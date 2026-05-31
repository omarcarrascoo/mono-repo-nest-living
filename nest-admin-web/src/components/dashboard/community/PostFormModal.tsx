"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { CommunityPost, CommunityPostType } from "@/types/api";
import { cn } from "@/lib/cn";

const TYPE_OPTS: { value: CommunityPostType; label: string; help: string }[] = [
  {
    value: "post",
    label: "Publicación",
    help: "Comparte algo con la comunidad. Aparece en el feed normal.",
  },
  {
    value: "announcement",
    label: "Anuncio oficial",
    help: "Mensaje destacado de la administración. Aparece resaltado en el feed.",
  },
];

export function PostFormModal({
  open,
  post,
  onClose,
  onSubmit,
}: {
  open: boolean;
  post: CommunityPost | null;
  onClose: () => void;
  onSubmit: (dto: {
    type: CommunityPostType;
    title: string;
    content: string;
    image?: string;
    tag?: string;
    pinned: boolean;
  }) => Promise<void>;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={post ? "Editar publicación" : "Nueva publicación"}
    >
      {open && (
        <PostForm
          key={post?.id ?? "new"}
          post={post}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function PostForm({
  post,
  onClose,
  onSubmit,
}: {
  post: CommunityPost | null;
  onClose: () => void;
  onSubmit: (dto: {
    type: CommunityPostType;
    title: string;
    content: string;
    image?: string;
    tag?: string;
    pinned: boolean;
  }) => Promise<void>;
}) {
  const [type, setType] = useState<CommunityPostType>(post?.type ?? "post");
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [tag, setTag] = useState(post?.tag ?? "");
  const [image, setImage] = useState<string | null>(post?.image ?? null);
  const [pinned, setPinned] = useState(!!post?.pinned);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (title.trim().length < 2) {
      setError("El título debe tener al menos 2 caracteres.");
      return;
    }
    if (content.trim().length < 2) {
      setError("Escribe el contenido de la publicación.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        content: content.trim(),
        image: image ?? undefined,
        tag: tag.trim() || undefined,
        pinned,
      });
      onClose();
    } catch (e) {
      setError((e as Error)?.message ?? "No pudimos guardar la publicación.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-ink">
          Tipo
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TYPE_OPTS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                type === t.value
                  ? "border-teal bg-teal/[0.08]"
                  : "border-line hover:bg-canvas",
              )}
            >
              <p
                className={cn(
                  "text-sm font-semibold",
                  type === t.value ? "text-teal-dark" : "text-ink",
                )}
              >
                {t.label}
              </p>
              <p className="mt-1 text-xs text-ink-soft">{t.help}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-ink">
          Título
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Mantenimiento general el sábado"
          autoFocus
          className="input"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-ink">
          Contenido
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe el mensaje para tu comunidad…"
          rows={5}
          className="input resize-none py-3"
          style={{ height: "auto" }}
        />
      </div>

      <ImageUploader
        value={image}
        onChange={setImage}
        kind="post"
        label="Imagen (opcional)"
      />

      <div>
        <label className="mb-2 block text-sm font-semibold text-ink">
          Etiqueta <span className="font-normal text-ink-soft">(opcional)</span>
        </label>
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Ej. Mantenimiento, Eventos, Seguridad"
          className="input"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3">
        <input
          type="checkbox"
          checked={pinned}
          onChange={(e) => setPinned(e.target.checked)}
          className="h-4 w-4 rounded accent-teal-700"
        />
        <span className="text-sm font-semibold text-ink">
          Fijar al inicio del feed
        </span>
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : post ? (
            "Guardar cambios"
          ) : (
            "Publicar"
          )}
        </Button>
      </div>
    </div>
  );
}
