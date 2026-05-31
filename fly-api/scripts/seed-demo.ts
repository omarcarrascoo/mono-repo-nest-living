/**
 * Seed de demo. Pobla MongoDB con un club completo, listo para grabar la
 * demo de la app: 1 super_admin + 1 admin de club + 6 residentes + amenidades
 * + reservas variadas + productos delivery + pedidos en distintos estados +
 * posts de comunidad.
 *
 * Uso:
 *   npx tsx scripts/seed-demo.ts              # crea o actualiza idempotente
 *   npx tsx scripts/seed-demo.ts --reset      # borra el club demo antes
 *
 * Credenciales de la demo (passwords todos 'password123'):
 *   super_admin@nest.demo   (super admin global, crea/destruye clubs)
 *   admin@palmas.demo       (admin del club)
 *   ana@palmas.demo         (residente)
 *   luis@palmas.demo        (residente)
 *   marta@palmas.demo       (residente)
 *   diego@palmas.demo       (residente)
 *   sofia@palmas.demo       (residente PENDING — flujo de aprobación)
 *   ivan@palmas.demo        (kitchen_operator)
 *
 * No usamos los schemas decorados de Nest aquí porque tsx no procesa
 * `emitDecoratorMetadata` en runtime. En su lugar declaramos schemas de
 * Mongoose planos que reflejan el shape esperado por los modelos del backend.
 */

import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import mongoose, { Schema, Types } from 'mongoose';

const MONGO_URI =
  process.env.MONGO_URI ??
  'mongodb+srv://omarcarrascoaranda_db_user:AO84sK0heqCkPuMF@testing-tree.h9btn6m.mongodb.net/?appName=TESTING-TREE';

const DEMO_CLUB_NAME = 'Residencial Las Palmas';
const DEMO_JOIN_CODE = 'PALMAS25';
const RESET = process.argv.includes('--reset');
const PASSWORD = 'password123';

// ─────────────────────────────────────────────────────────────
// Schemas planos (sin decoradores)
// ─────────────────────────────────────────────────────────────
const NotificationPreferencesSchema = new Schema(
  {
    reservationReminders: { type: Boolean, default: true },
    reservationUpdates: { type: Boolean, default: true },
    adminAlerts: { type: Boolean, default: true },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    globalRole: { type: String, default: null, index: true },
    dateOfBirth: String,
    status: { type: String, default: 'ACTIVE' },
    avatar: String,
    timezone: String,
    favoriteAmenityIds: [{ type: Schema.Types.ObjectId, ref: 'Amenity' }],
    notificationPreferences: {
      type: NotificationPreferencesSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

const ClubSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    joinCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    privacy: { type: String, enum: ['public', 'private'], required: true, default: 'public' },
    createdBySuperAdminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, default: 'ACTIVE' },
  },
  { timestamps: true },
);

const MembershipSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clubId: { type: Schema.Types.ObjectId, ref: 'Club', required: true, index: true },
    role: { type: String, enum: ['admin', 'user', 'kitchen_operator'], required: true, default: 'user' },
    status: { type: String, enum: ['pending', 'active', 'rejected'], required: true, default: 'pending', index: true },
    unitNumber: String,
    approvedAt: Date,
    approvedById: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);
MembershipSchema.index({ userId: 1, clubId: 1 }, { unique: true });

const CategorySchema = new Schema(
  {
    clubId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    icon: { type: String, default: 'grid' },
    color: { type: String, default: '#0f766e' },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
CategorySchema.index({ clubId: 1, slug: 1 }, { unique: true });

const DayScheduleSchema = new Schema(
  {
    open: String,
    close: String,
    closed: Boolean,
  },
  { _id: false },
);
const FeatureSchema = new Schema(
  { icon: String, label: String },
  { _id: false },
);

const AmenitySchema = new Schema(
  {
    clubId: { type: String, required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    title: { type: String, required: true },
    description: String,
    image: String,
    location: String,
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    status: { type: String, default: 'available' },
    schedule: { type: Object, default: () => ({}) },
    slotDurationMinutes: { type: Number, default: 60 },
    maxConcurrentReservations: { type: Number, default: 1 },
    maxPerUserPerDay: { type: Number, default: 1 },
    bookingLeadMinutes: { type: Number, default: 60 },
    bookingHorizonDays: { type: Number, default: 14 },
    timezone: { type: String, default: 'America/Mexico_City' },
    capacity: { type: Number, default: 0 },
    features: { type: [FeatureSchema], default: [] },
    rules: [String],
    nextSlot: String,
    availableSlots: [String],
  },
  { timestamps: true },
);

const ReservationSchema = new Schema(
  {
    clubId: { type: String, required: true, index: true },
    amenityId: { type: Schema.Types.ObjectId, ref: 'Amenity', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed', 'no_show'],
      default: 'confirmed',
      required: true,
    },
    notes: String,
    cancelledAt: Date,
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reminderSentAt: Date,
  },
  { timestamps: true },
);

const ProductCategorySchema = new Schema(
  {
    clubId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    icon: { type: String, default: 'package' },
    color: String,
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
ProductCategorySchema.index({ clubId: 1, slug: 1 }, { unique: true });

const ProductOptionSchema = new Schema(
  {
    id: String,
    name: String,
    priceDelta: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    default: Boolean,
  },
  { _id: false },
);
const ProductOptionGroupSchema = new Schema(
  {
    id: String,
    name: String,
    mode: { type: String, enum: ['single', 'multiple'] },
    required: Boolean,
    minSelections: Number,
    maxSelections: Number,
    options: [ProductOptionSchema],
  },
  { _id: false },
);

const ProductSchema = new Schema(
  {
    clubId: { type: String, required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ProductCategory', required: true, index: true },
    name: { type: String, required: true },
    description: String,
    image: String,
    price: { type: Number, required: true },
    originalPrice: Number,
    status: { type: String, enum: ['available', 'sold_out', 'hidden'], default: 'available' },
    rating: Number,
    reviewCount: Number,
    prepTime: String,
    tags: [String],
    optionGroups: { type: [ProductOptionGroupSchema], default: [] },
    sortOrder: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const OrderItemModifierSchema = new Schema(
  {
    groupId: String,
    groupName: String,
    optionId: String,
    optionName: String,
    priceDelta: { type: Number, default: 0 },
  },
  { _id: false },
);
const OrderItemSchema = new Schema(
  {
    lineId: String,
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    image: String,
    unitPrice: Number,
    quantity: Number,
    lineTotal: Number,
    modifiers: { type: [OrderItemModifierSchema], default: [] },
    notes: String,
  },
  { _id: false },
);
const OrderStatusEventSchema = new Schema(
  {
    status: String,
    at: { type: Date, default: () => new Date() },
    byUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    note: String,
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    clubId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    payment: {
      type: new Schema(
        {
          method: { type: String, enum: ['terminal', 'cash'], required: true },
          cashDenomination: Number,
        },
        { _id: false },
      ),
      required: true,
    },
    cashChange: Number,
    notes: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'],
      default: 'pending',
      required: true,
      index: true,
    },
    statusHistory: { type: [OrderStatusEventSchema], default: [] },
  },
  { timestamps: true },
);

const CommunityPostSchema = new Schema(
  {
    clubId: { type: String, required: true, index: true },
    type: { type: String, enum: ['announcement', 'post'], default: 'post', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorName: { type: String, required: true },
    authorAvatar: String,
    authorRole: { type: String, required: true },
    tag: String,
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: String,
    pinned: { type: Boolean, default: false, index: true },
    reactions: { type: Map, of: [Schema.Types.ObjectId], default: {} },
    repliesCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'communityposts' },
);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}
function addHours(d: Date, hours: number) {
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}
function addMinutes(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60 * 1000);
}
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`▶︎  Conectando a Mongo…`);
  await mongoose.connect(MONGO_URI);
  console.log(`▶︎  Conectado.`);

  const User = mongoose.model('User', UserSchema);
  const Club = mongoose.model('Club', ClubSchema);
  const Membership = mongoose.model('Membership', MembershipSchema);
  const Category = mongoose.model('Category', CategorySchema);
  const Amenity = mongoose.model('Amenity', AmenitySchema);
  const Reservation = mongoose.model('Reservation', ReservationSchema);
  const ProductCategory = mongoose.model('ProductCategory', ProductCategorySchema);
  const Product = mongoose.model('Product', ProductSchema);
  const Order = mongoose.model('Order', OrderSchema);
  const CommunityPost = mongoose.model('CommunityPost', CommunityPostSchema);

  // 1. RESET
  if (RESET) {
    console.log(`▶︎  --reset: borrando datos del club demo…`);
    const existing = await Club.findOne({ name: DEMO_CLUB_NAME }).lean<any>();
    if (existing) {
      const clubId = String(existing._id);
      await Promise.all([
        Membership.deleteMany({ clubId: new Types.ObjectId(clubId) }),
        Category.deleteMany({ clubId }),
        Amenity.deleteMany({ clubId }),
        Reservation.deleteMany({ clubId }),
        ProductCategory.deleteMany({ clubId }),
        Product.deleteMany({ clubId }),
        Order.deleteMany({ clubId }),
        CommunityPost.deleteMany({ clubId }),
        Club.deleteOne({ _id: existing._id }),
      ]);
    }
    await User.deleteMany({ email: /@(palmas|nest)\.demo$/ });
    console.log(`✓  Datos previos borrados.`);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // 2. USERS
  console.log(`▶︎  Upsert users…`);
  const userDefs = [
    { email: 'super_admin@nest.demo', fullName: 'Super Admin', globalRole: 'super_admin', dateOfBirth: '1985-04-12' },
    { email: 'admin@palmas.demo', fullName: 'Carla Mendoza', globalRole: null, dateOfBirth: '1988-09-22' },
    { email: 'ana@palmas.demo', fullName: 'Ana Martínez', globalRole: null, dateOfBirth: '1992-02-14' },
    { email: 'luis@palmas.demo', fullName: 'Luis Ramírez', globalRole: null, dateOfBirth: '1990-07-03' },
    { email: 'marta@palmas.demo', fullName: 'Marta García', globalRole: null, dateOfBirth: '1995-11-30' },
    { email: 'diego@palmas.demo', fullName: 'Diego Sánchez', globalRole: null, dateOfBirth: '1987-06-18' },
    { email: 'sofia@palmas.demo', fullName: 'Sofía Torres', globalRole: null, dateOfBirth: '1993-12-05' },
    { email: 'ivan@palmas.demo', fullName: 'Iván Cocina', globalRole: null, dateOfBirth: '1991-08-08' },
  ];

  const users: Record<string, any> = {};
  for (const u of userDefs) {
    const doc = await User.findOneAndUpdate(
      { email: u.email },
      {
        $setOnInsert: { password: passwordHash },
        $set: {
          fullName: u.fullName,
          globalRole: u.globalRole,
          dateOfBirth: u.dateOfBirth,
          status: 'ACTIVE',
          avatar: '',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    users[u.email] = doc;
  }
  console.log(`✓  ${userDefs.length} users listos.`);

  // 3. CLUB
  console.log(`▶︎  Upsert club…`);
  const club = await Club.findOneAndUpdate(
    { name: DEMO_CLUB_NAME },
    {
      $setOnInsert: {
        joinCode: DEMO_JOIN_CODE,
        createdBySuperAdminId: users['super_admin@nest.demo']._id,
      },
      $set: {
        description:
          'Fraccionamiento residencial con alberca, gimnasio y palapa. Demo para pruebas.',
        privacy: 'public',
        status: 'ACTIVE',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const clubId = String(club!._id);
  console.log(`✓  Club "${club!.name}" id=${clubId} joinCode=${(club as any).joinCode}`);

  // 4. MEMBERSHIPS
  console.log(`▶︎  Memberships…`);
  const membershipDefs: Array<{
    email: string;
    role: 'admin' | 'user' | 'kitchen_operator';
    status: 'active' | 'pending';
    unitNumber?: string;
  }> = [
    { email: 'admin@palmas.demo', role: 'admin', status: 'active', unitNumber: 'A-101' },
    { email: 'ana@palmas.demo', role: 'user', status: 'active', unitNumber: 'A-204' },
    { email: 'luis@palmas.demo', role: 'user', status: 'active', unitNumber: 'B-103' },
    { email: 'marta@palmas.demo', role: 'user', status: 'active', unitNumber: 'B-205' },
    { email: 'diego@palmas.demo', role: 'user', status: 'active', unitNumber: 'C-302' },
    { email: 'sofia@palmas.demo', role: 'user', status: 'pending', unitNumber: 'C-401' },
    { email: 'ivan@palmas.demo', role: 'kitchen_operator', status: 'active' },
  ];
  for (const m of membershipDefs) {
    await Membership.findOneAndUpdate(
      { userId: users[m.email]._id, clubId: new Types.ObjectId(clubId) },
      {
        $set: {
          role: m.role,
          status: m.status,
          unitNumber: m.unitNumber,
          ...(m.status === 'active'
            ? { approvedAt: new Date(), approvedById: users['admin@palmas.demo']._id }
            : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  console.log(`✓  ${membershipDefs.length} memberships.`);

  // 5. AMENITY CATEGORIES
  console.log(`▶︎  Categorías de amenidad…`);
  const amenityCatDefs = [
    { slug: 'piscina', name: 'Piscina', icon: 'sun', color: '#0891b2', sortOrder: 1 },
    { slug: 'gym', name: 'Gym', icon: 'activity', color: '#dc2626', sortOrder: 2 },
    { slug: 'eventos', name: 'Eventos', icon: 'music', color: '#7c3aed', sortOrder: 3 },
    { slug: 'al-aire', name: 'Aire libre', icon: 'wind', color: '#16a34a', sortOrder: 4 },
    { slug: 'social', name: 'Social', icon: 'users', color: '#ea580c', sortOrder: 5 },
  ];
  const amenityCats: Record<string, any> = {};
  for (const c of amenityCatDefs) {
    const doc = await Category.findOneAndUpdate(
      { clubId, slug: c.slug },
      { $set: { ...c, clubId, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    amenityCats[c.slug] = doc;
  }
  console.log(`✓  ${amenityCatDefs.length} categorías.`);

  // 6. AMENITIES
  console.log(`▶︎  Amenidades…`);
  const standardSchedule = {
    mon: { open: '07:00', close: '22:00', closed: false },
    tue: { open: '07:00', close: '22:00', closed: false },
    wed: { open: '07:00', close: '22:00', closed: false },
    thu: { open: '07:00', close: '22:00', closed: false },
    fri: { open: '07:00', close: '23:00', closed: false },
    sat: { open: '08:00', close: '23:00', closed: false },
    sun: { open: '08:00', close: '21:00', closed: false },
  };

  const amenityDefs = [
    {
      title: 'Alberca principal',
      categoryId: amenityCats['piscina']._id,
      description: 'Alberca semi-olímpica climatizada, 25 metros, 3 carriles.',
      location: 'Área verde central',
      image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1600&auto=format&fit=crop',
      capacity: 25,
      slotDurationMinutes: 60,
      maxConcurrentReservations: 3,
      maxPerUserPerDay: 2,
      bookingLeadMinutes: 30,
      bookingHorizonDays: 14,
      schedule: standardSchedule,
      features: [
        { icon: 'sun', label: 'Climatizada' },
        { icon: 'shield', label: 'Salvavidas' },
      ],
      rules: ['Báñate antes de entrar.', 'No corras alrededor.', 'Niños menores de 10 con un adulto.'],
    },
    {
      title: 'Gimnasio',
      categoryId: amenityCats['gym']._id,
      description: 'Equipo cardio + peso libre. Crossfit rig.',
      location: 'Planta baja, Torre A',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop',
      capacity: 12,
      slotDurationMinutes: 60,
      maxConcurrentReservations: 6,
      maxPerUserPerDay: 1,
      bookingLeadMinutes: 60,
      bookingHorizonDays: 7,
      schedule: { ...standardSchedule, sun: { open: '00:00', close: '00:00', closed: true } },
      features: [
        { icon: 'activity', label: 'Cardio' },
        { icon: 'award', label: 'Peso libre' },
        { icon: 'wifi', label: 'Wi-Fi' },
      ],
      rules: ['Trae toalla obligatoria.', 'Limpia el equipo.', '60 min máximo por sesión.'],
    },
    {
      title: 'Salón de eventos',
      categoryId: amenityCats['eventos']._id,
      description: 'Salón para 80 personas, sonido, proyector y barra.',
      location: 'Edificio común',
      image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=1600&auto=format&fit=crop',
      capacity: 80,
      slotDurationMinutes: 240,
      maxConcurrentReservations: 1,
      maxPerUserPerDay: 1,
      bookingLeadMinutes: 60 * 24,
      bookingHorizonDays: 60,
      schedule: {
        ...standardSchedule,
        mon: { open: '00:00', close: '00:00', closed: true },
        tue: { open: '00:00', close: '00:00', closed: true },
      },
      features: [
        { icon: 'music', label: 'Sonido' },
        { icon: 'film', label: 'Proyector' },
      ],
      rules: ['Música hasta las 23:00.', 'Limpieza al término incluida.'],
    },
    {
      title: 'Cancha de pádel',
      categoryId: amenityCats['al-aire']._id,
      description: 'Cancha panorámica iluminada.',
      location: 'Área deportiva norte',
      image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1600&auto=format&fit=crop',
      capacity: 4,
      slotDurationMinutes: 90,
      maxConcurrentReservations: 1,
      maxPerUserPerDay: 1,
      bookingLeadMinutes: 30,
      bookingHorizonDays: 14,
      schedule: standardSchedule,
      features: [
        { icon: 'sun', label: 'Iluminada' },
        { icon: 'wind', label: 'Aire libre' },
      ],
      rules: ['Calzado deportivo obligatorio.', '90 min por reserva.'],
    },
    {
      title: 'Palapa con asadores',
      categoryId: amenityCats['al-aire']._id,
      description: 'Palapa para 20 personas con 2 asadores y mesas.',
      location: 'Área verde sur',
      image: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?q=80&w=1600&auto=format&fit=crop',
      capacity: 20,
      slotDurationMinutes: 180,
      maxConcurrentReservations: 1,
      maxPerUserPerDay: 1,
      bookingLeadMinutes: 60 * 12,
      bookingHorizonDays: 30,
      schedule: standardSchedule,
      features: [
        { icon: 'coffee', label: 'Asadores' },
        { icon: 'umbrella', label: 'Techo' },
      ],
      rules: ['Trae tu propio carbón.', 'Apaga el asador al terminar.'],
    },
    {
      title: 'Sala de juntas',
      categoryId: amenityCats['social']._id,
      description: 'Sala con TV, video-conf y wifi.',
      location: 'Planta baja, Torre B',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop',
      capacity: 8,
      slotDurationMinutes: 60,
      maxConcurrentReservations: 1,
      maxPerUserPerDay: 2,
      bookingLeadMinutes: 30,
      bookingHorizonDays: 7,
      schedule: {
        ...standardSchedule,
        sat: { open: '00:00', close: '00:00', closed: true },
        sun: { open: '00:00', close: '00:00', closed: true },
      },
      features: [
        { icon: 'wifi', label: 'Wi-Fi' },
        { icon: 'tv', label: 'TV 65"' },
      ],
      rules: ['Reserva máxima 2h al día.'],
    },
  ];

  const amenities: any[] = [];
  for (const a of amenityDefs) {
    const doc = await Amenity.findOneAndUpdate(
      { clubId, title: a.title },
      {
        $set: {
          ...a,
          clubId,
          status: 'available',
          rating: Number((4.5 + Math.random() * 0.5).toFixed(1)),
          reviews: 10 + Math.floor(Math.random() * 40),
          timezone: 'America/Mexico_City',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    amenities.push(doc);
  }
  console.log(`✓  ${amenities.length} amenidades.`);

  // 7. RESERVATIONS
  console.log(`▶︎  Reservas (limpiando previas)…`);
  await Reservation.deleteMany({ clubId });

  const residents = [
    users['ana@palmas.demo'],
    users['luis@palmas.demo'],
    users['marta@palmas.demo'],
    users['diego@palmas.demo'],
  ];
  const today = startOfDay(new Date());
  const reservationsToCreate: any[] = [];

  const futureSlots = [
    { dayOffset: 0, hour: 18, amenity: amenities[0], user: residents[0] },
    { dayOffset: 1, hour: 8, amenity: amenities[1], user: residents[1] },
    { dayOffset: 1, hour: 19, amenity: amenities[3], user: residents[2] },
    { dayOffset: 2, hour: 17, amenity: amenities[4], user: residents[3] },
    { dayOffset: 3, hour: 19, amenity: amenities[2], user: residents[0] },
    { dayOffset: 5, hour: 11, amenity: amenities[0], user: residents[2] },
    { dayOffset: 6, hour: 16, amenity: amenities[3], user: residents[1] },
  ];
  for (const s of futureSlots) {
    const start = addHours(addDays(today, s.dayOffset), s.hour);
    const end = addMinutes(start, s.amenity.slotDurationMinutes);
    reservationsToCreate.push({
      clubId,
      amenityId: s.amenity._id,
      userId: s.user._id,
      startTime: start,
      endTime: end,
      status: 'confirmed',
      notes: `Demo · ${s.amenity.title}`,
    });
  }

  for (let i = 1; i <= 8; i++) {
    const a = pick(amenities, i);
    const u = pick(residents, i);
    const start = addHours(addDays(today, -i), 9 + (i % 8));
    const end = addMinutes(start, a.slotDurationMinutes);
    reservationsToCreate.push({
      clubId,
      amenityId: a._id,
      userId: u._id,
      startTime: start,
      endTime: end,
      status: 'completed',
      notes: 'Demo · histórica',
    });
  }
  for (let i = 0; i < 2; i++) {
    const a = pick(amenities, i + 1);
    const u = pick(residents, i + 2);
    const start = addHours(addDays(today, -2 - i), 18);
    const end = addMinutes(start, a.slotDurationMinutes);
    reservationsToCreate.push({
      clubId,
      amenityId: a._id,
      userId: u._id,
      startTime: start,
      endTime: end,
      status: 'cancelled',
      cancelledAt: addDays(today, -2 - i),
      cancelledBy: u._id,
      notes: 'Demo · cancelada',
    });
  }
  await Reservation.insertMany(reservationsToCreate);
  console.log(`✓  ${reservationsToCreate.length} reservas.`);

  // 8. PRODUCT CATEGORIES + PRODUCTS
  console.log(`▶︎  Categorías delivery…`);
  const productCatDefs = [
    { slug: 'desayunos', name: 'Desayunos', icon: 'sun', sortOrder: 1 },
    { slug: 'comidas', name: 'Comidas', icon: 'coffee', sortOrder: 2 },
    { slug: 'bebidas', name: 'Bebidas', icon: 'droplet', sortOrder: 3 },
    { slug: 'postres', name: 'Postres', icon: 'gift', sortOrder: 4 },
  ];
  const productCats: Record<string, any> = {};
  for (const c of productCatDefs) {
    const doc = await ProductCategory.findOneAndUpdate(
      { clubId, slug: c.slug },
      { $set: { ...c, clubId, active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    productCats[c.slug] = doc;
  }
  console.log(`✓  ${productCatDefs.length} categorías delivery.`);

  console.log(`▶︎  Productos…`);
  await Product.deleteMany({ clubId });

  const sizeGroup = {
    id: 'size',
    name: 'Tamaño',
    mode: 'single' as const,
    required: true,
    options: [
      { id: 'sm', name: 'Chico', priceDelta: 0, available: true, default: true },
      { id: 'md', name: 'Mediano', priceDelta: 25, available: true },
      { id: 'lg', name: 'Grande', priceDelta: 45, available: true },
    ],
  };
  const extrasGroup = {
    id: 'extras',
    name: 'Extras',
    mode: 'multiple' as const,
    required: false,
    maxSelections: 3,
    options: [
      { id: 'cheese', name: 'Queso extra', priceDelta: 15, available: true },
      { id: 'bacon', name: 'Tocino', priceDelta: 20, available: true },
      { id: 'avocado', name: 'Aguacate', priceDelta: 18, available: true },
    ],
  };

  const productDefs: any[] = [
    { categoryId: productCats['desayunos']._id, name: 'Chilaquiles verdes', description: 'Con pollo deshebrado, crema, cebolla morada y queso fresco.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1200', price: 95, originalPrice: 115, prepTime: '15-20 min', tags: ['picante', 'tradicional'], featured: true, optionGroups: [extrasGroup] },
    { categoryId: productCats['desayunos']._id, name: 'Hot cakes', description: 'Stack de 3 con miel maple y mantequilla.', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1200', price: 75, prepTime: '10 min', tags: ['dulce'] },
    { categoryId: productCats['comidas']._id, name: 'Hamburguesa BBQ', description: 'Carne 200g, queso cheddar, BBQ y papas.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200', price: 145, prepTime: '20 min', tags: ['bestseller'], optionGroups: [sizeGroup, extrasGroup] },
    { categoryId: productCats['comidas']._id, name: 'Pizza margarita', description: 'Mozzarella, tomate y albahaca fresca.', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=1200', price: 175, prepTime: '25-30 min', tags: ['vegetariano'], optionGroups: [sizeGroup] },
    { categoryId: productCats['comidas']._id, name: 'Bowl de pollo teriyaki', description: 'Arroz, pollo teriyaki, edamame y aguacate.', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200', price: 135, prepTime: '15 min', tags: ['saludable'] },
    { categoryId: productCats['comidas']._id, name: 'Ensalada César', description: 'Lechuga romana, pollo, parmesano y crutones.', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?q=80&w=1200', price: 110, prepTime: '10 min', tags: ['saludable', 'vegetariano'] },
    { categoryId: productCats['bebidas']._id, name: 'Limonada de la casa', description: 'Limón fresco con un toque de menta.', image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=1200', price: 45, prepTime: '5 min', tags: ['refrescante'] },
    { categoryId: productCats['bebidas']._id, name: 'Café latte', description: 'Espresso doble con leche cremada.', image: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?q=80&w=1200', price: 55, prepTime: '5 min', tags: ['caliente'] },
    { categoryId: productCats['bebidas']._id, name: 'Agua mineral', description: 'Botella 600ml.', image: '', price: 25, prepTime: '1 min', status: 'sold_out' },
    { categoryId: productCats['postres']._id, name: 'Brownie con helado', description: 'Brownie tibio con helado de vainilla.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=1200', price: 75, prepTime: '8 min', tags: ['dulce'] },
    { categoryId: productCats['postres']._id, name: 'Cheesecake de fresa', description: 'Rebanada con coulis casero.', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=1200', price: 80, prepTime: '5 min', tags: ['dulce'] },
    { categoryId: productCats['postres']._id, name: 'Flan napolitano', description: 'Receta tradicional con cajeta.', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=1200', price: 65, prepTime: '5 min', tags: ['dulce', 'tradicional'] },
  ];

  const products: any[] = [];
  for (const p of productDefs) {
    const doc = await Product.create({
      ...p,
      clubId,
      status: p.status ?? 'available',
      rating: Number((4 + Math.random()).toFixed(1)),
      reviewCount: 5 + Math.floor(Math.random() * 30),
      featured: p.featured ?? false,
      optionGroups: p.optionGroups ?? [],
    });
    products.push(doc);
  }
  console.log(`✓  ${products.length} productos.`);

  // 9. ORDERS
  console.log(`▶︎  Pedidos…`);
  await Order.deleteMany({ clubId });

  const orderStatuses: Array<{ status: string; daysAgo: number }> = [
    { status: 'pending', daysAgo: 0 },
    { status: 'confirmed', daysAgo: 0 },
    { status: 'preparing', daysAgo: 0 },
    { status: 'on_the_way', daysAgo: 0 },
    { status: 'delivered', daysAgo: 0 },
    { status: 'delivered', daysAgo: 1 },
    { status: 'delivered', daysAgo: 2 },
    { status: 'delivered', daysAgo: 4 },
    { status: 'cancelled', daysAgo: 1 },
    { status: 'pending', daysAgo: 0 },
  ];

  let orderSeq = 1;
  for (const o of orderStatuses) {
    const customer = pick(residents, orderSeq);
    const productA = pick(products, orderSeq);
    const productB = pick(products, orderSeq + 2);

    const items = [
      {
        lineId: `line-${orderSeq}-1`,
        productId: productA._id,
        name: productA.name,
        image: productA.image,
        unitPrice: productA.price,
        quantity: 1 + (orderSeq % 2),
        lineTotal: productA.price * (1 + (orderSeq % 2)),
        modifiers: [],
      },
      {
        lineId: `line-${orderSeq}-2`,
        productId: productB._id,
        name: productB.name,
        image: productB.image,
        unitPrice: productB.price,
        quantity: 1,
        lineTotal: productB.price,
        modifiers: [],
      },
    ];
    const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);

    const createdAt = addHours(addDays(today, -o.daysAgo), 12 + orderSeq);
    const statusHistory: any[] = [{ status: 'pending', at: createdAt }];
    const flow = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered'];
    if (o.status !== 'pending' && o.status !== 'cancelled') {
      const idx = flow.indexOf(o.status);
      for (let i = 1; i <= idx; i++) {
        statusHistory.push({
          status: flow[i],
          at: addMinutes(createdAt, 10 * i),
          byUserId: users['ivan@palmas.demo']._id,
        });
      }
    } else if (o.status === 'cancelled') {
      statusHistory.push({
        status: 'cancelled',
        at: addMinutes(createdAt, 5),
        byUserId: users['admin@palmas.demo']._id,
        note: 'Cliente canceló.',
      });
    }

    await Order.create({
      clubId,
      userId: customer._id,
      orderNumber: `DEMO-${String(1000 + orderSeq).padStart(4, '0')}`,
      items,
      subtotal,
      total: subtotal,
      payment: { method: orderSeq % 2 === 0 ? 'cash' : 'terminal' },
      status: o.status,
      statusHistory,
      createdAt,
      updatedAt: statusHistory[statusHistory.length - 1].at,
    });
    orderSeq++;
  }
  console.log(`✓  ${orderStatuses.length} pedidos.`);

  // 10. POSTS
  console.log(`▶︎  Posts…`);
  await CommunityPost.deleteMany({ clubId });

  const adminUser = users['admin@palmas.demo'];
  const postDefs = [
    { type: 'announcement', author: adminUser, pinned: true, title: '🛠 Mantenimiento de alberca', content: 'El próximo lunes la alberca estará cerrada de 8:00 a 14:00 por mantenimiento programado. Gracias por su comprensión.', tag: 'mantenimiento', hoursAgo: 8 },
    { type: 'announcement', author: adminUser, pinned: true, title: '🎄 Fiesta de fin de año', content: 'Ya están abiertas las inscripciones para la cena del 22 de diciembre en el salón de eventos. Reserva tu lugar antes del 15.', tag: 'eventos', hoursAgo: 30 },
    { type: 'post', author: users['ana@palmas.demo'], pinned: false, title: '¿Recomendación de plomero?', content: '¿Alguien tiene un plomero confiable que recomienden? Tengo una fuga en la cocina.', hoursAgo: 3 },
    { type: 'post', author: users['luis@palmas.demo'], pinned: false, title: 'Encontré llaves', content: 'Encontré un llavero con llavero rojo cerca del gym. Lo dejé con el conserje de Torre A.', hoursAgo: 12 },
    { type: 'post', author: users['marta@palmas.demo'], pinned: false, title: 'Carrera 5K este sábado', content: '¿Alguien se anima a una carrera 5K este sábado a las 7am en el parque? Salimos por la entrada principal.', tag: 'deporte', hoursAgo: 20 },
    { type: 'announcement', author: adminUser, pinned: false, title: '🚮 Recolección de basura', content: 'Recordatorio: la basura orgánica se recoge martes y viernes; la inorgánica miércoles y sábados.', hoursAgo: 48 },
    { type: 'post', author: users['diego@palmas.demo'], pinned: false, title: 'Vendo bicicleta', content: 'Vendo bici de montaña Trek talla M, casi nueva. $4,500. DM si interesa.', hoursAgo: 60 },
    { type: 'post', author: users['ana@palmas.demo'], pinned: false, title: 'Gracias por la fiesta', content: 'Quería agradecer al comité por la posada del fin de semana, estuvo padrísima 🎉', hoursAgo: 96 },
  ];

  const now = new Date();
  for (const p of postDefs) {
    const createdAt = new Date(now.getTime() - p.hoursAgo * 60 * 60 * 1000);
    await CommunityPost.create({
      clubId,
      type: p.type,
      authorId: p.author._id,
      authorName: p.author.fullName,
      authorAvatar: '',
      authorRole: p.author.email === 'admin@palmas.demo' ? 'admin' : 'user',
      tag: p.tag,
      title: p.title,
      content: p.content,
      pinned: p.pinned,
      reactions: {},
      repliesCount: 0,
      createdAt,
      updatedAt: createdAt,
    });
  }
  console.log(`✓  ${postDefs.length} posts.`);

  console.log('\n────────────────────────────────────────────────');
  console.log('🎉  Seed completado.');
  console.log('────────────────────────────────────────────────');
  console.log(`Club:        ${club!.name}`);
  console.log(`joinCode:    ${(club as any).joinCode}`);
  console.log(`Privacidad:  ${(club as any).privacy}`);
  console.log('');
  console.log('CUENTAS DEMO (password: password123)');
  console.log('  super_admin@nest.demo    super admin global');
  console.log('  admin@palmas.demo        admin del club        unidad A-101');
  console.log('  ana@palmas.demo          residente             unidad A-204');
  console.log('  luis@palmas.demo         residente             unidad B-103');
  console.log('  marta@palmas.demo        residente             unidad B-205');
  console.log('  diego@palmas.demo        residente             unidad C-302');
  console.log('  sofia@palmas.demo        residente PENDING ←   prueba el flujo de aprobación');
  console.log('  ivan@palmas.demo         kitchen_operator');
  console.log('────────────────────────────────────────────────\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('💥 Seed falló:', err);
  process.exit(1);
});
