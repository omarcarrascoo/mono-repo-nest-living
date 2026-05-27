import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AmenityStatus = 'available' | 'busy' | 'maintenance';

export interface DaySchedule {
  open: string;       // 'HH:mm' en timezone de la amenidad
  close: string;      // 'HH:mm'
  closed: boolean;    // true = ese día no abre
}

export interface WeeklySchedule {
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
  sun: DaySchedule;
}

@Schema({ timestamps: true })
export class Amenity extends Document {
  @Prop({ required: true, index: true })
  residencyId: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', index: true })
  categoryId?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  image: string;

  @Prop()
  location: string;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviews: number;

  @Prop({ default: 'available' })
  status: AmenityStatus;

  // ---- Reglas de reserva (nuevo modelo) ----

  @Prop({ type: Object, default: () => defaultSchedule() })
  schedule: WeeklySchedule;

  @Prop({ default: 60 })
  slotDurationMinutes: number;

  @Prop({ default: 1 })
  maxConcurrentReservations: number;

  @Prop({ default: 1 })
  maxPerUserPerDay: number;

  @Prop({ default: 60 })
  bookingLeadMinutes: number;

  @Prop({ default: 14 })
  bookingHorizonDays: number;

  @Prop({ default: 'America/Mexico_City' })
  timezone: string;

  @Prop({ default: 0 })
  capacity: number;

  @Prop({ type: [{ icon: String, label: String, _id: false }] })
  features: { icon: string; label: string }[];

  @Prop([String])
  rules: string[];

  // ---- Legacy (no se sigue escribiendo, pero respetamos data existente) ----

  @Prop()
  nextSlot?: string;

  @Prop([String])
  availableSlots?: string[];
}

function defaultSchedule(): WeeklySchedule {
  const standard: DaySchedule = { open: '08:00', close: '22:00', closed: false };
  return {
    mon: { ...standard },
    tue: { ...standard },
    wed: { ...standard },
    thu: { ...standard },
    fri: { ...standard },
    sat: { ...standard },
    sun: { ...standard },
  };
}

export const AmenitySchema = SchemaFactory.createForClass(Amenity);

// Búsqueda full-text (search bar)
AmenitySchema.index(
  { title: 'text', description: 'text', location: 'text' },
  { name: 'amenity_text_index', default_language: 'spanish' },
);

// Listados scoped + filter por categoría
AmenitySchema.index({ residencyId: 1, categoryId: 1 });
AmenitySchema.index({ residencyId: 1, status: 1 });
