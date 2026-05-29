import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true, index: true })
  clubId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ default: 'grid' })
  icon: string;

  @Prop({ default: '#0f766e' })
  color: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  active: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ clubId: 1, slug: 1 }, { unique: true });
CategorySchema.index({ clubId: 1, active: 1, sortOrder: 1 });
