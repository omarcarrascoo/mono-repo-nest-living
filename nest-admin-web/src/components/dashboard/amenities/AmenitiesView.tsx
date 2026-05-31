"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import {
  LayoutGrid,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users as UsersIcon,
} from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AmenityFormModal } from "./AmenityFormModal";
import { Amenity } from "@/types/api";
import { amenitiesService } from "@/services/amenities.service";
import { useAsyncData } from "@/hooks/use-async-data";

const STATUS_LABEL: Record<Amenity["status"], string> = {
  available: "Disponible",
  busy: "Ocupada",
  maintenance: "Mantenimiento",
};

const STATUS_TONE: Record<
  Amenity["status"],
  "ok" | "warn" | "danger" | "neutral"
> = {
  available: "ok",
  busy: "warn",
  maintenance: "danger",
};

export function AmenitiesView() {
  const fetchAll = useCallback(() => amenitiesService.list(), []);
  const { data, loading, error, reload } = useAsyncData(fetchAll);
  const items = data ?? [];

  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Amenity | null>(null);
  const [removing, setRemoving] = useState<Amenity | null>(null);

  const filtered = query.trim()
    ? items.filter((a) => {
        const q = query.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          (a.location ?? "").toLowerCase().includes(q)
        );
      })
    : items;

  async function handleSubmit(dto: Partial<Amenity>) {
    if (editing) {
      await amenitiesService.update(editing.id, dto);
    } else {
      await amenitiesService.create(dto);
    }
    reload();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Espacios del club</p>
          <h2 className="font-display mt-3 text-3xl leading-tight text-editorial-ink md:text-[2.6rem]">
            Amenidades <em className="italic text-teal-dark">reservables</em>
          </h2>
          <p className="mt-3 max-w-md text-sm text-editorial-soft">
            Crea y administra los espacios reservables de tu club.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="relative flex-1 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o ubicación…"
              className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-ink outline-none transition-colors focus:border-teal"
            />
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nueva amenidad
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
          <button onClick={reload} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-teal-dark" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title={query ? "Sin coincidencias" : "Aún no hay amenidades"}
          description={
            query
              ? "Prueba con otra búsqueda."
              : "Crea la primera amenidad para que tus residentes puedan reservar."
          }
          action={
            !query ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Crear amenidad
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a.id} className="flex flex-col overflow-hidden">
              <div className="relative aspect-[16/9] bg-canvas">
                {a.image ? (
                  <Image
                    src={a.image}
                    alt={a.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-soft">
                    <LayoutGrid className="h-10 w-10" />
                  </div>
                )}
                <span className="absolute right-3 top-3">
                  <Badge tone={STATUS_TONE[a.status]}>
                    {STATUS_LABEL[a.status]}
                  </Badge>
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="truncate font-bold text-ink">{a.title}</h3>
                {a.location && (
                  <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-ink-soft">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {a.location}
                  </p>
                )}
                {a.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-ink-soft">
                    {a.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-ink-soft">
                  {typeof a.capacity === "number" && (
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon className="h-3.5 w-3.5" />
                      {a.capacity} pers.
                    </span>
                  )}
                  {a.rules.length > 0 && (
                    <span>
                      {a.rules.length}{" "}
                      {a.rules.length === 1 ? "regla" : "reglas"}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditing(a);
                      setFormOpen(true);
                    }}
                    className="flex-1 px-3 py-2 text-xs"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setRemoving(a)}
                    className="px-2.5 py-2 text-red-600 hover:bg-red-50"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AmenityFormModal
        open={formOpen}
        amenity={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing) {
            await amenitiesService.remove(removing.id);
            reload();
          }
        }}
        title="Eliminar amenidad"
        message={`Vas a eliminar "${removing?.title}". Las reservas existentes no se borran, pero los residentes ya no podrán reservar este espacio.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
