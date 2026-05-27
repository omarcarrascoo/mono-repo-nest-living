import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemSelectionGroupDto {
  @IsString() groupId: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  optionIds: string[];
}

export class CreateOrderItemDto {
  @IsMongoId() productId: string;

  @IsInt() @Min(1) @Max(50) quantity: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemSelectionGroupDto)
  @ArrayMaxSize(20)
  selections?: OrderItemSelectionGroupDto[];

  @IsOptional() @IsString() @Length(0, 200) notes?: string;
}

export class CreateOrderPaymentDto {
  @IsIn(['terminal', 'cash']) method: 'terminal' | 'cash';

  @IsOptional() @IsInt() @IsIn([50, 100, 200, 500, 1000]) cashDenomination?: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ValidateNested() @Type(() => CreateOrderPaymentDto)
  payment: CreateOrderPaymentDto;

  @IsOptional() @IsString() @Length(0, 300) notes?: string;
}

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'on_the_way',
  'delivered',
  'cancelled',
] as const;

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES as unknown as string[])
  status: (typeof ORDER_STATUSES)[number];

  @IsOptional() @IsString() @Length(0, 200) note?: string;
}

export class ListOrdersQueryDto {
  @IsOptional() @IsIn(ORDER_STATUSES as unknown as string[]) status?: string;

  @IsOptional() @IsIn(['active', 'completed', 'all']) filter?: string;

  @IsOptional() @IsMongoId() userId?: string;
}

export class ListMyOrdersQueryDto {
  @IsOptional() @IsIn(['active', 'completed', 'all']) filter?: string;
}
