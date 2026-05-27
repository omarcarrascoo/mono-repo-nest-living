import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductCategory,
  ProductCategorySchema,
} from './schemas/product-category.schema';
import { Product, ProductSchema } from './schemas/product.schema';
import { Order, OrderSchema } from './schemas/order.schema';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategoriesService } from './product-categories.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductCategory.name, schema: ProductCategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [
    ProductCategoriesController,
    ProductsController,
    OrdersController,
  ],
  providers: [ProductCategoriesService, ProductsService, OrdersService],
  exports: [ProductCategoriesService, ProductsService, OrdersService],
})
export class DeliveryModule {}
