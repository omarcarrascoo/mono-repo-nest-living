import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductStatus = 'available' | 'sold_out' | 'hidden';
export type OptionSelectMode = 'single' | 'multiple';

class ProductOption {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  priceDelta: number;

  @Prop({ default: true })
  available: boolean;

  @Prop({ default: false })
  default?: boolean;
}

class ProductOptionGroup {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['single', 'multiple'] })
  mode: OptionSelectMode;

  @Prop({ default: false })
  required: boolean;

  @Prop()
  maxSelections?: number;

  @Prop({ type: [ProductOption], default: [] })
  options: ProductOption[];
}

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, index: true })
  residencyId: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'ProductCategory',
    required: true,
    index: true,
  })
  categoryId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  image?: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  originalPrice?: number;

  @Prop({ default: 'available', enum: ['available', 'sold_out', 'hidden'] })
  status: ProductStatus;

  @Prop({ default: 0 })
  rating?: number;

  @Prop({ default: 0 })
  reviewCount?: number;

  @Prop()
  prepTime?: string;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: [ProductOptionGroup], default: [] })
  optionGroups: ProductOptionGroup[];

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: false })
  featured: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ residencyId: 1, categoryId: 1 });
ProductSchema.index({ residencyId: 1, status: 1 });
ProductSchema.index({ residencyId: 1, featured: 1 });
ProductSchema.index(
  { name: 'text', description: 'text', tags: 'text' },
  { name: 'product_text_index', default_language: 'spanish' },
);
