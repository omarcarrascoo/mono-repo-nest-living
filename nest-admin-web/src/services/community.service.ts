import { apiFetch } from "@/lib/api/client";
import {
  CommunityPost,
  CreatePostRequest,
  ListPostsParams,
  UpdatePostRequest,
} from "@/types/api";
import { adaptCommunityPost } from "./adapters";

function buildQuery(p: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== "") sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const communityService = {
  async listPosts(
    params: ListPostsParams = {},
    currentUserId?: string,
  ): Promise<CommunityPost[]> {
    const qs = buildQuery({ type: params.type, q: params.q });
    const raw = await apiFetch<unknown[]>(`/community/posts${qs}`);
    return Array.isArray(raw)
      ? raw.map((r) =>
          adaptCommunityPost(r as Record<string, unknown>, currentUserId),
        )
      : [];
  },

  async createPost(
    payload: CreatePostRequest,
    currentUserId?: string,
  ): Promise<CommunityPost> {
    const raw = await apiFetch<Record<string, unknown>>("/community/posts", {
      method: "POST",
      body: payload,
    });
    return adaptCommunityPost(raw, currentUserId);
  },

  async updatePost(
    id: string,
    payload: UpdatePostRequest,
    currentUserId?: string,
  ): Promise<CommunityPost> {
    const raw = await apiFetch<Record<string, unknown>>(
      `/community/posts/${id}`,
      { method: "PATCH", body: payload },
    );
    return adaptCommunityPost(raw, currentUserId);
  },

  async deletePost(id: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/community/posts/${id}`, {
      method: "DELETE",
    });
  },
};
