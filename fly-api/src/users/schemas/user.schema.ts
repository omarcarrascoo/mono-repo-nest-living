import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

class ResidentStats {
  @Prop() balanceOwed: number;
  @Prop() delinquencyRate: number;
  @Prop() lastPaymentDate: string;
}

class ResidentLease {
  @Prop() startDate: string;
  @Prop() endDate: string;
  @Prop() rentAmount: string;
  @Prop() securityDeposit: string;
  @Prop() daysLeft: number;
}

class NotificationPreferences {
  @Prop({ default: true }) reservationReminders: boolean;
  @Prop({ default: true }) reservationUpdates: boolean;
  @Prop({ default: true }) adminAlerts: boolean;
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true }) fullName: string;
  @Prop({ required: true, unique: true }) email: string;
  @Prop({ required: true }) password: string;

  @Prop({ required: true, default: 'user' }) role: 'admin' | 'user' | 'kitchen_operator';
  @Prop({ required: true, index: true }) residencyId: string;

  @Prop({ default: 'ACTIVE' }) status: string;
  @Prop() avatar: string;
  @Prop() unitNumber: string;
  @Prop() timezone?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Amenity', default: [] })
  favoriteAmenityIds: Types.ObjectId[];

  @Prop({ type: NotificationPreferences, default: () => ({}) })
  notificationPreferences: NotificationPreferences;

  @Prop({ type: ResidentStats }) stats: ResidentStats;
  @Prop({ type: ResidentLease }) lease: ResidentLease;
  @Prop({ type: Array }) contacts: any[];
  @Prop({ type: Array }) documents: any[];
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ residencyId: 1, role: 1 });