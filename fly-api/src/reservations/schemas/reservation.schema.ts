import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReservationStatus =
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

@Schema({ timestamps: true })
export class Reservation extends Document {
  @Prop({ required: true, index: true })
  clubId: string;

  @Prop({ type: Types.ObjectId, ref: 'Amenity', required: true, index: true })
  amenityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({
    required: true,
    enum: ['confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'confirmed',
  })
  status: ReservationStatus;

  @Prop()
  notes?: string;

  @Prop()
  cancelledAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  @Prop()
  reminderSentAt?: Date;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);

// Cálculo de disponibilidad: dado amenityId + ventana de tiempo, contamos confirmadas
ReservationSchema.index({
  amenityId: 1,
  status: 1,
  startTime: 1,
});

// Historial del usuario (lista paginada por fecha desc)
ReservationSchema.index({ userId: 1, startTime: -1 });

// Vista admin por residencia
ReservationSchema.index({ clubId: 1, startTime: -1 });

// Cron de recordatorios: busca reservas próximas no recordadas
ReservationSchema.index({ status: 1, startTime: 1, reminderSentAt: 1 });

// Anti race-condition para amenities con capacidad = 1.
// El partial filter solo aplica al status 'confirmed', así que las canceladas
// no chocan.
ReservationSchema.index(
  { amenityId: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'confirmed' },
    name: 'reservation_unique_slot_partial',
  },
);
