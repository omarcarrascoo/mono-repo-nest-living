import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Club extends Document {
  @Prop({ required: true }) name: string;
  @Prop() description?: string;

  /**
   * Código único que el super admin entrega al cliente. Los usuarios lo meten
   * en la app para solicitar entrada al club. No expira por sí solo.
   */
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  joinCode: string;

  /**
   * 'public' = la solicitud se aprueba sola, el user queda activo al instante.
   * 'private' = la solicitud queda pending, un admin del club tiene que aprobar.
   */
  @Prop({
    type: String,
    enum: ['public', 'private'],
    required: true,
    default: 'public',
  })
  privacy: 'public' | 'private';

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBySuperAdminId: Types.ObjectId;

  @Prop({ default: 'ACTIVE' }) status: string;
}

export const ClubSchema = SchemaFactory.createForClass(Club);
ClubSchema.index({ joinCode: 1 }, { unique: true });
