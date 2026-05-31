"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  LayoutGrid,
  MessageSquareHeart,
  ShoppingBag,
  UserCheck,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/primitives";
import { useAuthStore } from "@/stores/auth-store";
import { residentsService } from "@/services/residents.service";

export default function DashboardHome() {
  return (
    <DashboardShell title="Resumen">
      <Overview />
    </DashboardShell>
  );
}

function Overview() {
  const user = useAuthStore((s) => s.user);
  const activeClubId = useAuthStore((s) => s.activeClubId);
  const memberships = useAuthStore((s) => s.memberships);

  const club = memberships.find((m) => m.clubId === activeClubId)?.club;

  const [pending, setPending] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (!activeClubId) return;
    let alive = true;
    Promise.all([
      residentsService.list(activeClubId, { status: "pending" }),
      residentsService.list(activeClubId, { status: "active" }),
    ])
      .then(([p, a]) => {
        if (!alive) return;
        setPending(p.length);
        setActive(a.length);
      })
      .catch(() => {
        if (!alive) return;
        setPending(0);
        setActive(0);
      });
    return () => {
      alive = false;
    };
  }, [activeClubId]);

  const firstName = user?.fullName?.split(/\s+/)[0] ?? "";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Saludo */}
      <div className="border-b border-hairline pb-8">
        <p className="eyebrow">Edición de hoy</p>
        <h2 className="font-display mt-3 text-3xl leading-[1.05] text-editorial-ink md:text-[3rem]">
          Hola,{" "}
          <em className="italic text-teal-dark">{firstName}</em>.
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-editorial-soft md:text-base">
          Esto es lo que pasa hoy en{" "}
          <strong className="font-semibold text-editorial-ink">
            {club?.name ?? "tu club"}
          </strong>
          .
        </p>
      </div>

      {/* KPIs en vivo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          icon={Clock}
          tint="#b45309"
          bg="#fffbeb"
          label="Solicitudes pendientes"
          value={pending}
          href="/dashboard/residents?status=pending"
          cta="Revisar"
        />
        <KpiCard
          icon={UserCheck}
          tint="#0f766e"
          bg="#f0fdfa"
          label="Residentes activos"
          value={active}
          href="/dashboard/residents"
          cta="Ver directorio"
        />
        <KpiCard
          icon={Users}
          tint="#7c3aed"
          bg="#f5f3ff"
          label="Total de miembros"
          value={pending !== null && active !== null ? pending + active : null}
          href="/dashboard/residents"
          cta="Gestionar"
        />
      </div>

      {/* Accesos a módulos */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-soft">
          Módulos
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleCard
            icon={Users}
            title="Residentes"
            body="Aprueba solicitudes y administra roles y unidades."
            href="/dashboard/residents"
            available
          />
          <ModuleCard
            icon={LayoutGrid}
            title="Amenidades"
            body="Crea espacios reservables con horarios y reglas."
            href="/dashboard/amenities"
            available
          />
          <ModuleCard
            icon={CalendarCheck}
            title="Reservas"
            body="Visualiza ocupación y resuelve conflictos."
            href="/dashboard/reservations"
            available
          />
          <ModuleCard
            icon={ShoppingBag}
            title="Delivery"
            body="Catálogo y pedidos para la cocina de tu club."
            href="/dashboard/delivery"
            available
          />
          <ModuleCard
            icon={MessageSquareHeart}
            title="Comunidad"
            body="Anuncios oficiales y feed de la comunidad."
            href="/dashboard/community"
            available
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  tint,
  bg,
  label,
  value,
  href,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  bg: string;
  label: string;
  value: number | null;
  href: string;
  cta: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: bg, color: tint }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark hover:underline"
        >
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <p className="mt-4 text-3xl font-extrabold tabular-nums text-ink">
        {value === null ? "—" : value}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </Card>
  );
}

function ModuleCard({
  icon: Icon,
  title,
  body,
  href,
  available,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href?: string;
  available?: boolean;
}) {
  const inner = (
    <Card
      className={
        available
          ? "h-full p-5 transition-all hover:-translate-y-0.5 hover:border-teal/30 hover:shadow-md"
          : "h-full p-5 opacity-70"
      }
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/[0.10] text-teal-dark">
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-bold text-ink">{title}</span>
        {!available && (
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-soft">
            Pronto
          </span>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{body}</p>
    </Card>
  );

  if (available && href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}
