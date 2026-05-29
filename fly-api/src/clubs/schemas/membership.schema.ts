import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MembershipRole = 'admin' | 'user' | 'kitchen_operator';
export type MembershipStatus = 'pending' | 'active' | 'rejected';

@Schema({ timestamps: true })
export class Membership extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Club', required: true, index: true })
  clubId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['admin', 'user', 'kitchen_operator'],
    required: true,
    default: 'user',
  })
  role: MembershipRole;

  @Prop({
    type: String,
    enum: ['pending', 'active', 'rejected'],
    required: true,
    default: 'pending',
    index: true,
  })
  status: MembershipStatus;

  /** Unidad / depto / casa dentro del club. Lo edita el admin del club. */
  @Prop() unitNumber?: string;

  @Prop() approvedAt?: Date;
  @Prop({ type: Types.ObjectId, ref: 'User' }) approvedById?: Types.ObjectId;
}

export const MembershipSchema = SchemaFactory.createForClass(Membership);
MembershipSchema.index({ userId: 1, clubId: 1 }, { unique: true });
MembershipSchema.index({ clubId: 1, role: 1 });
MembershipSchema.index({ clubId: 1, status: 1 });
