"use client";

import { useState } from "react";
import { Loader2, Megaphone, Send } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { BroadcastAudience } from "@/types/api";
import { notificationsService } from "@/services/notifications.service";
import { cn } from "@/lib/cn";

const AUDIENCES: { value: BroadcastAudience; label: string; help: string }[] = [
  {
    value: "all",
    label: "Toda la comunidad",
    help: "Llega a todos los residentes activos del club.",
  },
  {
    value: "unit",
    label: "Por unidad",
    help: "Solo a los residentes cuya unidad empieza con un prefijo.",
  },
  {
    value: "user",
    label: "A un usuario",
    help: "Una persona específica por su ID de usuario.",
  },
];

/**
 * Difusión de un push a la audiencia indicada. El backend valida rol admin y
 * resuelve el club desde el JWT, así que aquí no toca pasar `clubId`.
 */
export function BroadcastComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<BroadcastAudience>("all");
  const [unitPrefix, setUnitPrefix] = useState("");
  const [userId, setUserId] = useState("");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ sent: number } | null>(null);

  async function handleSend() {
    setError(null);
    setSuccess(null);

    if (title.trim().length < 2 || body.trim().length < 2) {
      setError("Llena el título y el mensaje.");
      return;
    }
    if (audience === "unit" && !unitPrefix.trim()) {
      setError("Escribe el prefijo de unidad.");
      return;
    }
    if (audience === "user" && !userId.trim()) {
      setError("Pega el ID del usuario.");
      return;
    }

    setSending(true);
    try {
      const res = await notificationsService.broadcast({
        title: title.trim(),
        body: body.trim(),
        audience,
        unitPrefix: audience === "unit" ? unitPrefix.trim() : undefined,
        userId: audience === "user" ? userId.trim() : undefined,
      });
      setSuccess({ sent: res.sent });
      setTitle("");
      setBody("");
      setUnitPrefix("");
      setUserId("");
    } catch (e) {
      setError((e as Error)?.message ?? "No pudimos enviar el broadcast.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal/[0.10] text-teal-dark">
          <Megaphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-ink">Enviar broadcast</h3>
          <p className="mt-1 text-sm text-ink-soft">
            Manda una notificación push a tus residentes. Llegará a su teléfono
            si tienen la app abierta o en background.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">
                Audiencia
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                {AUDIENCES.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAudience(a.value)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      audience === a.value
                        ? "border-teal bg-teal/[0.08]"
                        : "border-line hover:bg-canvas",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        audience === a.value
                          ? "text-teal-dark"
                          : "text-ink",
                      )}
                    >
                      {a.label}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">{a.help}</p>
                  </button>
                ))}
              </div>
            </div>

            {audience === "unit" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">
                  Prefijo de unidad
                </label>
                <input
                  value={unitPrefix}
                  onChange={(e) => setUnitPrefix(e.target.value)}
                  placeholder="Ej. A-, Torre 2, 4"
                  className="input"
                />
                <p className="mt-1 text-xs text-ink-soft">
                  Llega a todas las unidades que empiezan con este texto.
                </p>
              </div>
            )}

            {audience === "user" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">
                  ID del usuario
                </label>
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Ej. 665f1a2b3c4d5e6f7a8b9c0d"
                  className="input font-mono text-sm"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">
                Título
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Mantenimiento mañana"
                maxLength={100}
                className="input"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">
                Mensaje
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Cuerpo de la notificación…"
                rows={3}
                maxLength={500}
                className="input resize-none py-3"
                style={{ height: "auto" }}
              />
              <p className="mt-1 text-right text-xs text-ink-soft">
                {body.length} / 500
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Notificación enviada a {success.sent}{" "}
                {success.sent === 1 ? "residente" : "residentes"}.
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-55"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar broadcast
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
