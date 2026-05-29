import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'productcategories' })
export class ProductCategory extends Document {
  @Prop({ required: true, index: true })
  clubId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  icon: string;

  @Prop()
  color?: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  active: boolean;
}

export const ProductCategorySchema = SchemaFactory.createForClass(ProductCategory);

ProductCategorySchema.index({ clubId: 1, slug: 1 }, { unique: true });
ProductCategorySchema.index({ clubId: 1, sortOrder: 1 });
