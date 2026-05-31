"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import {
  Loader2,
  MessageSquareHeart,
  Pencil,
  Pin,
  Plus,
  Trash2,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, Card, EmptyState } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TabNav, TabItem } from "@/components/ui/TabNav";
import { PostFormModal } from "./PostFormModal";
import { BroadcastComposer } from "./BroadcastComposer";
import { CommunityPost, CreatePostRequest } from "@/types/api";
import { communityService } from "@/services/community.service";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuthStore } from "@/stores/auth-store";

type Tab = "feed" | "broadcast";

const TABS: TabItem<Tab>[] = [
  { key: "feed", label: "Feed" },
  { key: "broadcast", label: "Broadcast" },
];

function timeAgo(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `hace ${days} d`;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

export function CommunityView() {
  const [tab, setTab] = useState<Tab>("feed");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="border-b border-hairline pb-6">
        <p className="eyebrow">Voz oficial</p>
        <h2 className="font-display mt-3 text-3xl leading-tight text-editorial-ink md:text-[2.6rem]">
          Comunidad <em className="italic text-teal-dark">y broadcasts</em>
        </h2>
        <p className="mt-3 max-w-md text-sm text-editorial-soft">
          Anuncios oficiales, feed vecinal y broadcasts a tus residentes.
        </p>
      </div>

      <TabNav items={TABS} active={tab} onChange={setTab} />

      {tab === "feed" && <FeedTab />}
      {tab === "broadcast" && <BroadcastComposer />}
    </div>
  );
}

function FeedTab() {
  const userId = useAuthStore((s) => s.user?.id);

  const fetchPosts = useCallback(
    () => communityService.listPosts({}, userId),
    [userId],
  );
  const { data, loading, error, reload } = useAsyncData<CommunityPost[]>(
    fetchPosts,
  );
  const posts = data ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CommunityPost | null>(null);
  const [removing, setRemoving] = useState<CommunityPost | null>(null);

  async function handleSubmit(dto: CreatePostRequest & { pinned: boolean }) {
    if (editing) {
      await communityService.updatePost(editing.id, dto, userId);
    } else {
      await communityService.createPost(dto, userId);
    }
    reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nueva publicación
        </Button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
          <button onClick={reload} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {loading && posts.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-teal-dark" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={MessageSquareHeart}
          title="Aún no hay publicaciones"
          description="Crea la primera publicación o anuncio oficial."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Crear publicación
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              {p.image && (
                <div className="relative aspect-[16/8] bg-canvas">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 720px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar
                    name={p.author.name}
                    src={p.author.avatar}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-ink">
                        {p.author.name}
                      </p>
                      <span className="text-xs text-ink-soft">
                        {timeAgo(p.createdAt)}
                      </span>
                      {p.pinned && (
                        <Badge tone="teal">
                          <Pin className="h-3 w-3" />
                          Fijado
                        </Badge>
                      )}
                      {p.type === "announcement" && (
                        <Badge tone="warn">Anuncio oficial</Badge>
                      )}
                      {p.tag && <Badge tone="neutral">{p.tag}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                      className="px-2 py-1.5"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setRemoving(p)}
                      className="px-2 py-1.5 text-red-600 hover:bg-red-50"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="mt-3 text-lg font-bold text-ink">{p.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
                  {p.content}
                </p>

                <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-xs text-ink-soft">
                  <span>
                    {p.repliesCount}{" "}
                    {p.repliesCount === 1 ? "respuesta" : "respuestas"}
                  </span>
                  {Object.keys(p.reactions).length > 0 && (
                    <span>
                      {Object.entries(p.reactions)
                        .map(([emoji, count]) => `${emoji} ${count}`)
                        .join(" · ")}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PostFormModal
        open={formOpen}
        post={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing) {
            await communityService.deletePost(removing.id);
            reload();
          }
        }}
        title="Eliminar publicación"
        message={`Vas a eliminar "${removing?.title}". Las respuestas también se borran y no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
