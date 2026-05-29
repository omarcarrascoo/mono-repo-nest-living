import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  /**
   * Global rol fuera del scope de cualquier club. Sólo `super_admin` puede
   * crear clubs y promover admins. Default null = usuario normal.
   */
  @Prop({ type: String, default: null, index: true })
  globalRole: 'super_admin' | null;

  @Prop() dateOfBirth?: string;

  @Prop({ default: 'ACTIVE' }) status: string;
  @Prop() avatar: string;
  @Prop() timezone?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Amenity', default: [] })
  favoriteAmenityIds: Types.ObjectId[];

  @Prop({ type: NotificationPreferences, default: () => ({}) })
  notificationPreferences: NotificationPreferences;
}

export const UserSchema = SchemaFactory.createForClass(User);
