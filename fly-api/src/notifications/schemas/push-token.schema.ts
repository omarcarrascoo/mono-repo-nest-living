import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PushToken extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  expoPushToken: string;

  @Prop({ default: 'unknown' })
  platform: 'ios' | 'android' | 'web' | 'unknown';

  @Prop()
  deviceName?: string;

  @Prop({ default: () => new Date() })
  lastSeenAt: Date;
}

export const PushTokenSchema = SchemaFactory.createForClass(PushToken);
PushTokenSchema.index({ userId: 1, lastSeenAt: -1 });
