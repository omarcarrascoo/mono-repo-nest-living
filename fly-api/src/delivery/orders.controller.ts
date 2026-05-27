import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  CreateOrderDto,
  ListMyOrdersQueryDto,
  ListOrdersQueryDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';

@Controller('delivery/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.create(user, dto);
  }

  @Get('me')
  listMine(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListMyOrdersQueryDto,
  ) {
    return this.service.listMine(user, query.filter);
  }

  /** Staff endpoint — admin & kitchen_operator can see all residency orders. */
  @Get()
  @Roles('admin', 'kitchen_operator')
  listForStaff(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListOrdersQueryDto,
  ) {
    return this.service.listForStaff(user, {
      status: query.status,
      filter: query.filter,
      userId: query.userId,
    });
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles('admin', 'kitchen_operator')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.updateStatus(id, user, dto);
  }
}
