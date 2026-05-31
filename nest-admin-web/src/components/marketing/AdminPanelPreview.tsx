"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Bell,
  Building2,
  CalendarCheck,
  ChefHat,
  Check,
  ClipboardList,
  Filter,
  ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  MessageSquareHeart,
  Pin,
  Plus,
  Search,
  ShoppingBag,
  TrendingUp,
  Users,
  X,
  XOctagon,
} from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Mockup desktop del panel de administración. Replica los tokens visuales
 * del dashboard real (paper cálido, hairlines, font-display, eyebrow) sin
 * montar el dashboard de verdad — sería auth-gated.
 *
 * Dos modos:
 *   - Sin `view` → rota automáticamente entre las 3 vistas principales
 *     (residents/reservations/community) cada 5.5s. Se usa en la sección
 *     "Y también desde el navegador" del hero.
 *   - Con `view` → queda fijo en la vista que pidas. Se usa en cada sección
 *     editorial (`AppFeatureSection`) como mockup individual.
 */

export type AdminPanelView =
  | "residents"
  | "reservations"
  | "amenities"
  | "community"
  | "products"
  | "orders"
  | "notifications";

const VIEW_META: Record<
  AdminPanelView,
  { label: string; eyebrow: string }
> = {
  residents: { label: "Residentes", eyebrow: "Tu comunidad" },
  reservations: { label: "Reservas", eyebrow: "Operación" },
  amenities: { label: "Amenidades", eyebrow: "Espacios del club" },
  community: { label: "Comunidad", eyebrow: "Voz oficial" },
  products: { label: "Catálogo", eyebrow: "Cocina y comercio" },
  orders: { label: "Pedidos", eyebrow: "Operación de cocina" },
  notifications: { label: "Actualizaciones", eyebrow: "Pulso del club" },
};

/** Vistas que rotan en el modo "auto" (las 3 principales). */
const ROTATING_VIEWS: AdminPanelView[] = [
  "residents",
  "reservations",
  "community",
];

const ROTATE_MS = 5500;

interface Props {
  /** Si se pasa, el mockup queda fijo en esa vista (sin rotar). */
  view?: AdminPanelView;
}

export function AdminPanelPreview({ view: fixedView }: Props = {}) {
  const isFixed = fixedView !== undefined;
  const [view, setView] = useState<AdminPanelView>(
    fixedView ?? "residents",
  );
  const [paused, setPaused] = useState(false);

  // Auto-advance solo cuando NO es fijo.
  useEffect(() => {
    if (isFixed || paused) return;
    const id = setTimeout(() => {
      const idx = ROTATING_VIEWS.indexOf(view);
      const next =
        ROTATING_VIEWS[(idx === -1 ? 0 : idx + 1) % ROTATING_VIEWS.length];
      setView(next);
    }, ROTATE_MS);
    return () => clearTimeout(id);
  }, [view, paused, isFixed]);

  const meta = VIEW_META[view];
  const showDots = !isFixed;

  return (
    <div
      className="relative overflow-hidden rounded-md border border-hairline bg-paper shadow-[0_24px_60px_-20px_rgba(11,18,15,0.18)]"
      onMouseEnter={() => !isFixed && setPaused(true)}
      onMouseLeave={() => !isFixed && setPaused(false)}
    >
      {/* Barra de navegador con semáforos + URL */}
      <div className="flex items-center gap-3 border-b border-hairline bg-paper-2/70 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <div className="ml-2 flex flex-1 items-center justify-center">
          <div className="rounded-md border border-hairline bg-paper px-3 py-1 text-[11px] font-mono text-editorial-soft">
            nestliving.app/dashboard/{view}
          </div>
        </div>
      </div>

      {/* Contenido del panel: sidebar + main */}
      <div className="flex h-[440px] md:h-[520px]">
        {/* ---- Sidebar (oculto en mobile) ---- */}
        <aside className="hidden w-44 shrink-0 flex-col gap-4 border-r border-hairline bg-paper-2/40 p-4 md:flex">
          <div className="flex items-center gap-2 px-1 pt-1">
            <span
              aria-hidden
              className="font-display text-[11px] tracking-[0.18em] text-editorial-ink"
            >
              NEST LIVING
            </span>
          </div>
          <div className="border border-hairline bg-paper px-2 py-2">
            <p className="eyebrow text-[8px]">Club activo</p>
            <p className="font-display mt-0.5 truncate text-[13px] leading-tight text-editorial-ink">
              Residencial Las Palmas
            </p>
          </div>

          <nav className="space-y-0">
            <p className="eyebrow flex items-center gap-2 px-2 py-2 text-[8px]">
              Administración
              <span className="h-px flex-1 bg-hairline" />
            </p>
            <NavItem icon={LayoutDashboard} label="Resumen" />
            <NavItem
              icon={Users}
              label="Residentes"
              active={view === "residents"}
            />
            <NavItem
              icon={LayoutGrid}
              label="Amenidades"
              active={view === "amenities"}
            />
            <NavItem
              icon={CalendarCheck}
              label="Reservas"
              active={view === "reservations"}
            />
            <NavItem
              icon={ShoppingBag}
              label="Delivery"
              active={view === "products" || view === "orders"}
            />
            <NavItem
              icon={MessageSquareHeart}
              label="Comunidad"
              active={view === "community"}
            />
            <NavItem
              icon={Bell}
              label="Notificaciones"
              active={view === "notifications"}
            />
            <p className="eyebrow flex items-center gap-2 px-2 pb-2 pt-5 text-[8px]">
              Plataforma
              <span className="h-px flex-1 bg-hairline" />
            </p>
            <NavItem icon={Building2} label="Clubs" superAdmin />
          </nav>
        </aside>

        {/* ---- Columna principal ---- */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar con título serif */}
          <header className="sticky top-0 flex h-12 items-center justify-between gap-3 border-b border-hairline bg-paper/85 px-4 backdrop-blur md:px-6">
            <h3 className="font-display truncate text-base text-editorial-ink md:text-lg">
              {meta.label}
            </h3>
            <div className="flex items-center gap-2">
              <div className="hidden h-6 w-32 rounded-full bg-paper-2/80 md:block" />
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-hairline text-[10px] font-bold text-teal-dark">
                CM
              </span>
            </div>
          </header>

          {/* Cuerpo */}
          <div className="relative flex-1 overflow-hidden">
            <div
              key={view}
              className="animate-panel-fade absolute inset-0 overflow-y-auto p-4 md:p-6"
            >
              {view === "residents" && <ResidentsView />}
              {view === "reservations" && <ReservationsView />}
              {view === "amenities" && <AmenitiesView />}
              {view === "community" && <CommunityView />}
              {view === "products" && <ProductsView />}
              {view === "orders" && <OrdersView />}
              {view === "notifications" && <NotificationsView />}
            </div>
          </div>
        </div>
      </div>

      {/* Dots solo en modo rotativo */}
      {showDots && (
        <div className="flex items-center justify-center gap-2 border-t border-hairline bg-paper-2/40 py-2.5">
          {ROTATING_VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                v === view
                  ? "w-8 bg-editorial-ink"
                  : "w-1.5 bg-editorial-soft/40 hover:bg-editorial-soft",
              )}
              aria-label={`Ver ${VIEW_META[v].label}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes panel-fade {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        :global(.animate-panel-fade) {
          animation: panel-fade 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  );
}

/* =============== Items del nav =============== */
function NavItem({
  icon: Icon,
  label,
  active,
  superAdmin,
}: {
  icon: typeof Users;
  label: string;
  active?: boolean;
  superAdmin?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-2 px-2 py-1.5 text-[12px] font-medium transition-colors",
        active ? "text-editorial-ink" : "text-editorial-soft",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1/2 h-4 w-px -translate-y-1/2",
          active ? "bg-teal-dark" : "bg-transparent",
        )}
      />
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1">{label}</span>
      {superAdmin && (
        <span className="font-display text-[10px] italic text-teal-dark">
          super
        </span>
      )}
    </div>
  );
}

/* =============== Header común de página =============== */
function PageHeader({
  eyebrow,
  title,
  accent,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
}) {
  return (
    <div className="border-b border-hairline pb-4">
      <p className="eyebrow text-[9px]">{eyebrow}</p>
      <h4 className="font-display mt-1.5 text-xl leading-tight text-editorial-ink md:text-2xl">
        {title}{" "}
        {accent && <em className="italic text-teal-dark">{accent}</em>}
      </h4>
    </div>
  );
}

/* ============================================================
 * VISTAS — datos hardcodeados, mismos primitivos del dashboard real
 * ============================================================ */

function ResidentsView() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Tu comunidad"
        title="Residentes"
        accent="activos"
      />

      <div className="flex gap-1.5">
        {[
          ["Todos", false],
          ["Pendientes", true],
          ["Activos", false],
        ].map(([label, active]) => (
          <span
            key={label as string}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold",
              active
                ? "bg-editorial-ink text-paper"
                : "border border-hairline bg-paper text-editorial-soft",
            )}
          >
            {label as string}
          </span>
        ))}
      </div>

      <div className="border border-hairline bg-paper">
        {RESIDENTS.map((r, i) => (
          <div
            key={r.name}
            className={cn(
              "grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3",
              i !== RESIDENTS.length - 1 && "border-b border-hairline",
            )}
          >
            <span className="font-display flex h-8 w-8 items-center justify-center border border-hairline text-[13px] text-teal-dark">
              {r.initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-editorial-ink">
                {r.name}
              </p>
              <p className="truncate text-[11px] text-editorial-soft">
                {r.email} · {r.unit}
              </p>
            </div>
            {r.pending ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Pendiente
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Activo
              </span>
            )}
            <div className="flex gap-1">
              {r.pending ? (
                <>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-editorial-ink text-paper">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-red-200 text-red-600">
                    <X className="h-3 w-3" />
                  </span>
                </>
              ) : (
                <span className="text-[10px] uppercase tracking-wider text-editorial-soft">
                  •••
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const RESIDENTS = [
  {
    initial: "ST",
    name: "Sofía Torres",
    email: "sofia@palmas.dev",
    unit: "C-401",
    pending: true,
  },
  {
    initial: "JM",
    name: "Javier Martínez",
    email: "javier@palmas.dev",
    unit: "B-203",
    pending: false,
  },
  {
    initial: "AR",
    name: "Andrea Ramírez",
    email: "andrea@palmas.dev",
    unit: "A-512",
    pending: false,
  },
  {
    initial: "DG",
    name: "Diego Guzmán",
    email: "diego@palmas.dev",
    unit: "C-108",
    pending: false,
  },
];

/* =============== Reservas =============== */
function ReservationsView() {
  const hours = [
    1, 0, 0, 0, 0, 1, 2, 3, 5, 6, 4, 5, 6, 7, 9, 10, 8, 6, 4, 3, 2, 2, 1, 0,
  ];
  const peak = Math.max(...hours);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Operación"
        title="Reservas"
        accent="en vivo"
      />

      <div className="grid grid-cols-3 gap-3">
        <Kpi
          icon={CalendarCheck}
          label="Hoy"
          value="14"
          tint="#0f766e"
          bg="#ccfbf1"
        />
        <Kpi
          icon={TrendingUp}
          label="Esta semana"
          value="92"
          tint="#1d4ed8"
          bg="#dbeafe"
        />
        <Kpi
          icon={CalendarCheck}
          label="Este mes"
          value="318"
          tint="#9333ea"
          bg="#f3e8ff"
        />
      </div>

      <div className="flex items-center justify-between border border-hairline bg-paper p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <XOctagon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-editorial-ink">
              Tasa de cancelación
            </p>
            <p className="text-[10px] text-editorial-soft">
              Histórico del club
            </p>
          </div>
        </div>
        <p className="text-xl font-extrabold text-red-600">7%</p>
      </div>

      <div className="border border-hairline bg-paper p-4">
        <p className="eyebrow mb-3 text-[9px]">Ocupación · 30 días</p>
        <div className="flex h-16 items-end gap-0.5">
          {hours.map((count, h) => {
            const intensity = count / peak;
            const opacity = count === 0 ? 0.06 : 0.2 + intensity * 0.8;
            return (
              <div
                key={h}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${8 + intensity * 56}px`,
                  backgroundColor: `rgba(15, 118, 110, ${opacity.toFixed(2)})`,
                }}
              />
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-editorial-soft">
          <span>00h</span>
          <span>06h</span>
          <span>12h</span>
          <span>18h</span>
          <span>23h</span>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tint,
  bg,
}: {
  icon: typeof CalendarCheck;
  label: string;
  value: string;
  tint: string;
  bg: string;
}) {
  return (
    <div className="border border-hairline bg-paper p-3">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-md"
        style={{ backgroundColor: bg, color: tint }}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <p className="mt-3 text-2xl font-extrabold tabular-nums text-editorial-ink md:text-3xl">
        {value}
      </p>
      <p className="text-[10px] text-editorial-soft">{label}</p>
    </div>
  );
}

/* =============== Amenidades =============== */
function AmenitiesView() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Espacios del club"
        title="Amenidades"
        accent="reservables"
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-editorial-soft" />
          <div className="border border-hairline bg-paper py-1.5 pl-8 pr-3 text-[11px] text-editorial-soft">
            Buscar amenidad
          </div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-editorial-ink px-3 py-1.5 text-[11px] font-semibold text-paper">
          <Plus className="h-3 w-3" />
          Nueva
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          { name: "Alberca techada", busy: 4, status: "ok" },
          { name: "Gimnasio 24h", busy: 7, status: "ok" },
          { name: "Salón de eventos", busy: 2, status: "warn" },
          { name: "Cancha de pádel", busy: 1, status: "ok" },
          { name: "Sala de juntas", busy: 0, status: "ok" },
          { name: "Roof garden", busy: 3, status: "ok" },
        ].map((a) => (
          <div
            key={a.name}
            className="border border-hairline bg-paper p-2.5"
          >
            <div className="flex aspect-[16/9] items-center justify-center bg-paper-2/70 text-editorial-soft">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div className="mt-2 flex items-start justify-between gap-2">
              <p className="truncate text-[11px] font-semibold text-editorial-ink">
                {a.name}
              </p>
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold",
                  a.status === "ok"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700",
                )}
              >
                {a.status === "ok" ? "Activa" : "Ocupada"}
              </span>
            </div>
            <p className="mt-0.5 text-[9px] text-editorial-soft">
              {a.busy} reservas hoy
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =============== Comunidad =============== */
function CommunityView() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Voz oficial"
        title="Comunidad"
        accent="y broadcasts"
      />

      <div className="flex gap-3 border-b border-hairline">
        <span className="relative pb-2 text-[12px] font-semibold text-editorial-ink">
          Feed
          <span className="absolute inset-x-1 -bottom-px h-px bg-teal-dark" />
        </span>
        <span className="pb-2 text-[12px] font-medium text-editorial-soft">
          Broadcast
        </span>
      </div>

      <div className="space-y-3">
        {POSTS.map((p) => (
          <article
            key={p.title}
            className="border border-hairline bg-paper p-4"
          >
            <div className="flex items-start gap-2">
              <span className="font-display flex h-7 w-7 items-center justify-center border border-hairline text-[11px] text-teal-dark">
                {p.initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-editorial-ink">
                  {p.author}
                </p>
                <p className="text-[10px] text-editorial-soft">{p.time}</p>
              </div>
              {p.pinned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2 py-0.5 text-[9px] font-semibold text-teal-dark">
                  <Pin className="h-2.5 w-2.5" /> Fijado
                </span>
              )}
              {p.announcement && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700">
                  Anuncio oficial
                </span>
              )}
            </div>
            <h5 className="font-display mt-2 text-base leading-tight text-editorial-ink">
              {p.title}
            </h5>
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-editorial-soft">
              {p.body}
            </p>
            <div className="mt-3 flex items-center gap-3 border-t border-hairline pt-2 text-[10px] text-editorial-soft">
              <span>{p.replies} respuestas</span>
              <span>·</span>
              <span>{p.reactions}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

const POSTS = [
  {
    initial: "AD",
    author: "Administración",
    time: "hace 2 h",
    pinned: true,
    announcement: true,
    title: "Mantenimiento general · sábado 16",
    body: "El sábado por la mañana cortaremos el agua de 8 a 12. Asegúrate de llenar tus contenedores la noche anterior y respaldar lo que estés cocinando.",
    replies: 4,
    reactions: "👍 12 · ❤️ 3",
  },
  {
    initial: "JM",
    author: "Javier Martínez",
    time: "hace 5 h",
    title: "¿Alguien recomienda jardinero?",
    body: "Buenas, busco a alguien que venga cada quince días al jardín de mi unidad. Si tienen referencias les agradezco.",
    replies: 7,
    reactions: "👍 5",
  },
];

/* =============== Productos / Catálogo =============== */
function ProductsView() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Cocina y comercio"
        title="Catálogo"
        accent="del club"
      />

      <div className="flex gap-3 border-b border-hairline">
        {[
          ["Productos", true],
          ["Categorías", false],
          ["Pedidos", false],
        ].map(([label, active]) => (
          <span
            key={label as string}
            className={cn(
              "relative pb-2 text-[12px]",
              active
                ? "font-semibold text-editorial-ink"
                : "font-medium text-editorial-soft",
            )}
          >
            {label as string}
            {active && (
              <span className="absolute inset-x-1 -bottom-px h-px bg-teal-dark" />
            )}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-editorial-soft" />
          <div className="border border-hairline bg-paper py-1.5 pl-8 pr-3 text-[11px] text-editorial-soft">
            Buscar producto
          </div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-editorial-ink px-3 py-1.5 text-[11px] font-semibold text-paper">
          <Plus className="h-3 w-3" />
          Nuevo producto
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          {
            name: "Chilaquiles verdes",
            price: "$95",
            cat: "Desayunos",
            featured: true,
            tone: "ok",
          },
          {
            name: "Café americano",
            price: "$35",
            cat: "Bebidas",
            tone: "ok",
          },
          {
            name: "Pizza margarita",
            price: "$180",
            cat: "Comidas",
            tone: "warn",
          },
          {
            name: "Smoothie verde",
            price: "$60",
            cat: "Bebidas",
            tone: "ok",
          },
          {
            name: "Sandwich club",
            price: "$110",
            cat: "Comidas",
            tone: "ok",
          },
          {
            name: "Brownie con helado",
            price: "$75",
            cat: "Postres",
            tone: "ok",
          },
        ].map((p) => (
          <div key={p.name} className="border border-hairline bg-paper p-2.5">
            <div className="relative flex aspect-[16/10] items-center justify-center bg-paper-2/70 text-editorial-soft">
              <ImageIcon className="h-5 w-5" />
              {p.featured && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-teal/15 px-1.5 py-0.5 text-[8px] font-semibold text-teal-dark">
                  ★ Destacado
                </span>
              )}
            </div>
            <p className="mt-2 truncate text-[11px] font-semibold text-editorial-ink">
              {p.name}
            </p>
            <p className="text-[9px] text-editorial-soft">{p.cat}</p>
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-[12px] font-extrabold text-editorial-ink">
                {p.price}
              </p>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[8px] font-semibold",
                  p.tone === "ok"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700",
                )}
              >
                {p.tone === "ok" ? "Disponible" : "Agotado"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =============== Pedidos =============== */
function OrdersView() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Operación de cocina"
        title="Pedidos"
        accent="en vivo"
      />

      <div className="flex items-center gap-2">
        {[
          ["Activas", true, "8"],
          ["Hechas hoy", false, "23"],
          ["Todas", false, undefined],
        ].map(([label, active, count]) => (
          <span
            key={label as string}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold",
              active
                ? "bg-editorial-ink text-paper"
                : "border border-hairline bg-paper text-editorial-soft",
            )}
          >
            {label as string}
            {count && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[9px]",
                  active
                    ? "bg-paper/20"
                    : "bg-paper-2/80 text-editorial-ink",
                )}
              >
                {count as string}
              </span>
            )}
          </span>
        ))}
        <span className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-hairline text-editorial-soft">
          <Filter className="h-3 w-3" />
        </span>
      </div>

      <div className="space-y-2.5">
        {[
          {
            n: "#0428",
            time: "14:02",
            total: "$245",
            status: "Preparando",
            tone: "warn",
            items: "2× Chilaquiles verdes, 1× Café americano",
            user: "Andrea R.",
          },
          {
            n: "#0427",
            time: "13:48",
            total: "$95",
            status: "Confirmado",
            tone: "info",
            items: "1× Chilaquiles verdes",
            user: "Diego G.",
          },
          {
            n: "#0426",
            time: "13:22",
            total: "$420",
            status: "Entregado",
            tone: "ok",
            items: "1× Pizza margarita, 2× Smoothie verde",
            user: "Javier M.",
          },
          {
            n: "#0425",
            time: "12:50",
            total: "$185",
            status: "Entregado",
            tone: "ok",
            items: "1× Sandwich club, 1× Café americano",
            user: "Sofía T.",
          },
        ].map((o) => (
          <div
            key={o.n}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border border-hairline bg-paper p-3"
          >
            <div>
              <p className="font-display text-[14px] text-editorial-ink">
                {o.n}
              </p>
              <p className="text-[9px] text-editorial-soft">{o.time}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-editorial-ink">
                {o.user}
              </p>
              <p className="truncate text-[10px] text-editorial-soft">
                {o.items}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <p className="text-[14px] font-extrabold tabular-nums text-editorial-ink">
                {o.total}
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold",
                  o.tone === "ok"
                    ? "bg-emerald-50 text-emerald-700"
                    : o.tone === "warn"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-blue-50 text-blue-700",
                )}
              >
                <ChefHat className="h-2.5 w-2.5" />
                {o.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =============== Notificaciones =============== */
function NotificationsView() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Pulso del club"
        title="Actualizaciones"
        accent="en vivo"
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <span className="rounded-full bg-editorial-ink px-3 py-1 text-[11px] font-semibold text-paper">
            Todas
          </span>
          <span className="rounded-full border border-hairline bg-paper px-3 py-1 text-[11px] font-semibold text-editorial-soft">
            Sin leer
          </span>
        </div>
        <span className="text-[10px] font-semibold text-editorial-soft">
          Marcar todo como leído
        </span>
      </div>

      <div className="border border-hairline bg-paper">
        {[
          {
            icon: Users,
            tint: "#0f766e",
            bg: "#ccfbf1",
            title: "Sofía Torres pidió acceso al club",
            sub: "C-401 · ahora",
            unread: true,
          },
          {
            icon: CalendarCheck,
            tint: "#1d4ed8",
            bg: "#dbeafe",
            title: "Reserva nueva en Alberca techada · 18:00",
            sub: "Diego Guzmán · hace 4 min",
            unread: true,
          },
          {
            icon: ShoppingBag,
            tint: "#9333ea",
            bg: "#f3e8ff",
            title: "Pedido #0428 entregado",
            sub: "Andrea Ramírez · $245 · hace 12 min",
            unread: false,
          },
          {
            icon: ClipboardList,
            tint: "#b45309",
            bg: "#fef3c7",
            title: "3 cancelaciones de reserva esta hora",
            sub: "Salón de eventos · hace 22 min",
            unread: false,
          },
          {
            icon: Megaphone,
            tint: "#0f766e",
            bg: "#ccfbf1",
            title: "Anuncio oficial enviado a 142 vecinos",
            sub: "Mantenimiento general · hace 1 h",
            unread: false,
          },
          {
            icon: Banknote,
            tint: "#475569",
            bg: "#f1f5f9",
            title: "Pago de cuota recibido",
            sub: "Javier Martínez · $1,800 · hace 2 h",
            unread: false,
          },
        ].map((n, i, arr) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 px-4 py-3",
              i !== arr.length - 1 && "border-b border-hairline",
              n.unread && "bg-paper-2/40",
            )}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: n.bg, color: n.tint }}
            >
              <n.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-editorial-ink">
                {n.title}
              </p>
              <p className="truncate text-[10px] text-editorial-soft">
                {n.sub}
              </p>
            </div>
            {n.unread && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-teal-dark" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
