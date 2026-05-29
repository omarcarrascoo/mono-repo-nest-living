import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export type PaymentMethodKind = 'terminal' | 'cash';

class OrderItemModifier {
  @Prop({ required: true })
  groupId: string;

  @Prop({ required: true })
  groupName: string;

  @Prop({ required: true })
  optionId: string;

  @Prop({ required: true })
  optionName: string;

  @Prop({ default: 0 })
  priceDelta: number;
}

class OrderItem {
  @Prop({ required: true })
  lineId: string;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  image?: string;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true })
  lineTotal: number;

  @Prop({ type: [OrderItemModifier], default: [] })
  modifiers: OrderItemModifier[];

  @Prop()
  notes?: string;
}

class PaymentSelection {
  @Prop({ required: true, enum: ['terminal', 'cash'] })
  method: PaymentMethodKind;

  @Prop()
  cashDenomination?: number;
}

class OrderStatusEvent {
  @Prop({ required: true })
  status: OrderStatus;

  @Prop({ required: true, default: () => new Date() })
  at: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  byUserId?: Types.ObjectId;

  @Prop()
  note?: string;
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true, index: true })
  clubId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  orderNumber: string;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  subtotal: number;

  @Prop({ required: true })
  total: number;

  @Prop({ type: PaymentSelection, required: true })
  payment: PaymentSelection;

  @Prop()
  cashChange?: number;

  @Prop()
  notes?: string;

  @Prop({
    required: true,
    default: 'pending',
    enum: ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'],
    index: true,
  })
  status: OrderStatus;

  @Prop({ type: [OrderStatusEvent], default: [] })
  statusHistory: OrderStatusEvent[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ clubId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
