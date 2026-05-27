import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderStatus } from './schemas/order.schema';
import { Product } from './schemas/product.schema';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import {
  CurrentUserPayload,
  Role,
} from '../auth/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Permitted forward transitions. cancel is handled separately because only
 * admins can cancel and it can come from any non-final state.
 */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['on_the_way', 'cancelled'],
  on_the_way: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const STAFF_ROLES: Role[] = ['admin', 'kitchen_operator'];

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notifications: NotificationsService,
  ) {}

  // ------------------------------------------------------------------
  // CREATE
  // ------------------------------------------------------------------

  async create(user: CurrentUserPayload, dto: CreateOrderDto) {
    if (dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productModel
      .find({
        _id: { $in: productIds.map((id) => new Types.ObjectId(id)) },
        residencyId: user.residencyId,
      })
      .lean()
      .exec();

    const productById = new Map(products.map((p) => [String(p._id), p]));

    const orderItems = dto.items.map((item, idx) => {
      const product = productById.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} is not available in this residency`,
        );
      }
      if (product.status !== 'available') {
        throw new BadRequestException(`"${product.name}" is not available`);
      }

      const modifiers: Array<{
        groupId: string;
        groupName: string;
        optionId: string;
        optionName: string;
        priceDelta: number;
      }> = [];
      let unitPrice = product.price;

      // Validate selections + compute deltas off authoritative product data.
      const selections = item.selections ?? [];
      for (const group of product.optionGroups ?? []) {
        const sel = selections.find((s) => s.groupId === group.id);
        const chosen = sel?.optionIds ?? [];

        if (group.required && chosen.length === 0) {
          throw new BadRequestException(
            `Group "${group.name}" requires a selection`,
          );
        }
        if (group.mode === 'single' && chosen.length > 1) {
          throw new BadRequestException(
            `Group "${group.name}" only allows one option`,
          );
        }
        if (group.maxSelections && chosen.length > group.maxSelections) {
          throw new BadRequestException(
            `Group "${group.name}" allows max ${group.maxSelections} options`,
          );
        }

        for (const optionId of chosen) {
          const option = group.options.find((o) => o.id === optionId);
          if (!option) {
            throw new BadRequestException(
              `Option ${optionId} not found in group "${group.name}"`,
            );
          }
          if (!option.available) {
            throw new BadRequestException(
              `Option "${option.name}" is not available`,
            );
          }
          modifiers.push({
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            priceDelta: option.priceDelta,
          });
          unitPrice += option.priceDelta;
        }
      }

      const lineTotal = unitPrice * item.quantity;
      return {
        lineId: `${Date.now()}-${idx}`,
        productId: new Types.ObjectId(String(product._id)),
        name: product.name,
        image: product.image,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
        modifiers,
        notes: item.notes,
      };
    });

    const subtotal = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);
    const total = subtotal;

    let cashChange: number | undefined;
    if (dto.payment.method === 'cash') {
      if (!dto.payment.cashDenomination) {
        throw new BadRequestException(
          'Cash payment requires a denomination',
        );
      }
      if (dto.payment.cashDenomination < total) {
        throw new BadRequestException(
          'Cash denomination is lower than the order total',
        );
      }
      cashChange = dto.payment.cashDenomination - total;
    }

    const orderNumber = await this.generateOrderNumber();

    const created = await this.orderModel.create({
      residencyId: user.residencyId,
      userId: new Types.ObjectId(user.userId),
      orderNumber,
      items: orderItems,
      subtotal,
      total,
      payment: dto.payment,
      cashChange,
      notes: dto.notes,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          at: new Date(),
          byUserId: new Types.ObjectId(user.userId),
        },
      ],
    });

    // Fire-and-forget notifications. Do not block order creation if push
    // delivery fails; the inbox doc is still produced inside notifyUser.
    this.notifyOrderCreated(created).catch((e) => {
      this.logger.error(`notifyOrderCreated failed: ${e?.message}`);
    });

    return created;
  }

  // ------------------------------------------------------------------
  // READ
  // ------------------------------------------------------------------

  async findOne(id: string, user: CurrentUserPayload) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Order not found');
    }
    const order = await this.orderModel
      .findOne({ _id: id, residencyId: user.residencyId })
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Order not found');

    if (
      !STAFF_ROLES.includes(user.role) &&
      String(order.userId) !== user.userId
    ) {
      throw new ForbiddenException('Cannot view another user\'s order');
    }

    return order;
  }

  async listMine(user: CurrentUserPayload, filter?: string) {
    const q: Record<string, any> = {
      residencyId: user.residencyId,
      userId: new Types.ObjectId(user.userId),
    };
    this.applyFilter(q, filter);
    return this.orderModel.find(q).sort({ createdAt: -1 }).lean().exec();
  }

  async listForStaff(
    user: CurrentUserPayload,
    opts: { status?: string; filter?: string; userId?: string },
  ) {
    const q: Record<string, any> = { residencyId: user.residencyId };
    if (opts.status) q.status = opts.status;
    if (opts.userId) q.userId = new Types.ObjectId(opts.userId);
    this.applyFilter(q, opts.filter);
    return this.orderModel.find(q).sort({ createdAt: -1 }).limit(200).lean().exec();
  }

  // ------------------------------------------------------------------
  // STATUS TRANSITION
  // ------------------------------------------------------------------

  async updateStatus(
    id: string,
    user: CurrentUserPayload,
    dto: UpdateOrderStatusDto,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Order not found');
    }
    if (!STAFF_ROLES.includes(user.role)) {
      throw new ForbiddenException('Only staff can update order status');
    }
    if (dto.status === 'cancelled' && user.role !== 'admin') {
      throw new ForbiddenException('Only admin can cancel orders');
    }

    const order = await this.orderModel
      .findOne({ _id: id, residencyId: user.residencyId })
      .exec();
    if (!order) throw new NotFoundException('Order not found');

    const allowed = TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new ConflictException(
        `Cannot transition from "${order.status}" to "${dto.status}"`,
      );
    }

    order.status = dto.status;
    order.statusHistory.push({
      status: dto.status,
      at: new Date(),
      byUserId: new Types.ObjectId(user.userId),
      note: dto.note,
    } as any);
    await order.save();

    this.notifyOrderStatusChanged(order, dto.status).catch((e) => {
      this.logger.error(`notifyOrderStatusChanged failed: ${e?.message}`);
    });

    return order;
  }

  // ------------------------------------------------------------------
  // helpers
  // ------------------------------------------------------------------

  private applyFilter(q: Record<string, any>, filter?: string) {
    if (filter === 'active') {
      q.status = {
        $in: ['pending', 'confirmed', 'preparing', 'on_the_way'],
      };
    } else if (filter === 'completed') {
      q.status = { $in: ['delivered', 'cancelled'] };
    }
  }

  private async generateOrderNumber(): Promise<string> {
    // Compact human-readable format: YYMMDD-XXXX where XXXX is a daily sequence.
    const now = new Date();
    const y = String(now.getUTCFullYear()).slice(-2);
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    const prefix = `${y}${m}${d}`;
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const count = await this.orderModel.countDocuments({
      createdAt: { $gte: startOfDay },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}-${seq}`;
  }

  private async notifyOrderCreated(order: Order) {
    const data = {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
    };
    await this.notifications.notifyUser(String(order.userId), {
      kind: 'order_created',
      title: '✅ Pedido recibido',
      body: `Tu pedido #${order.orderNumber} está pendiente de confirmación.`,
      data,
    });
    await this.notifications.notifyOrderStaff(order.residencyId, {
      kind: 'order_admin_alert',
      title: '🛒 Nuevo pedido',
      body: `Pedido #${order.orderNumber} • $${order.total.toFixed(2)}`,
      data,
    });
  }

  private async notifyOrderStatusChanged(
    order: Order,
    next: OrderStatus,
  ) {
    const data = {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      status: next,
    };
    const copy = orderStatusCopy(next, order.orderNumber);
    if (copy) {
      await this.notifications.notifyUser(String(order.userId), {
        kind: copy.kind,
        title: copy.title,
        body: copy.body,
        data,
      });
    }
  }
}

function orderStatusCopy(
  status: OrderStatus,
  orderNumber: string,
):
  | { kind: 'order_status_update' | 'order_cancelled'; title: string; body: string }
  | null {
  switch (status) {
    case 'confirmed':
      return {
        kind: 'order_status_update',
        title: '👨‍🍳 Pedido confirmado',
        body: `Estamos preparando tu pedido #${orderNumber}.`,
      };
    case 'preparing':
      return {
        kind: 'order_status_update',
        title: '🔥 Tu pedido se está preparando',
        body: `Pedido #${orderNumber}.`,
      };
    case 'on_the_way':
      return {
        kind: 'order_status_update',
        title: '🛵 ¡En camino!',
        body: `Pedido #${orderNumber} va para allá.`,
      };
    case 'delivered':
      return {
        kind: 'order_status_update',
        title: '🎉 Pedido entregado',
        body: `Disfruta tu pedido #${orderNumber}.`,
      };
    case 'cancelled':
      return {
        kind: 'order_cancelled',
        title: 'Pedido cancelado',
        body: `Tu pedido #${orderNumber} fue cancelado.`,
      };
    default:
      return null;
  }
}
