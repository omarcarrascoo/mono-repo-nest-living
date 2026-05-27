import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationKind =
  | 'reservation_created'
  | 'reservation_cancelled'
  | 'reservation_reminder'
  | 'admin_alert'
  | 'order_created'
  | 'order_status_update'
  | 'order_cancelled'
  | 'order_admin_alert';

@Schema({ timestamps: true })
export class NotificationLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  kind: NotificationKind;

  @Prop({ required: true })
  title: string;

  @Prop()
  body?: string;

  @Prop({ type: Object })
  data?: Record<string, unknown>;

  @Prop({ default: 'pending' })
  status: 'pending' | 'sent' | 'error';

  @Prop()
  error?: string;

  /** Whether this entry should appear in the in-app inbox (vs push-only). */
  @Prop({ default: true })
  inbox: boolean;

  /** Read state — only meaningful for inbox entries. */
  @Prop({ default: false, index: true })
  read: boolean;

  @Prop()
  readAt?: Date;
}

export const NotificationLogSchema = SchemaFactory.createForClass(NotificationLog);

// TTL index — borra logs > 90 días
NotificationLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);
NotificationLogSchema.index({ userId: 1, createdAt: -1 });
NotificationLogSchema.index({ userId: 1, read: 1, createdAt: -1 });
