import { apiFetch } from '@/lib/api/client';
import {
  CommunityPost,
  CommunityReply,
  CreatePostRequest,
  CreateReplyRequest,
  ListPostsParams,
  UpdatePostRequest,
} from '@/types/api';
import { adaptCommunityPost, adaptCommunityReply } from './adapters';

function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
    .join('&');
  return `?${qs}`;
}

export const communityService = {
  async listPosts(
    params: ListPostsParams = {},
    currentUserId?: string,
  ): Promise<CommunityPost[]> {
    const qs = buildQuery({ type: params.type, q: params.q });
    const raw = await apiFetch<any[]>(`/community/posts${qs}`);
    return Array.isArray(raw)
      ? raw.map((r) => adaptCommunityPost(r, currentUserId))
      : [];
  },

  async getPost(id: string, currentUserId?: string): Promise<CommunityPost> {
    const raw = await apiFetch<any>(`/community/posts/${id}`);
    return adaptCommunityPost(raw, currentUserId);
  },

  async createPost(
    payload: CreatePostRequest,
    currentUserId?: string,
  ): Promise<CommunityPost> {
    const raw = await apiFetch<any>('/community/posts', {
      method: 'POST',
      body: payload,
    });
    return adaptCommunityPost(raw, currentUserId);
  },

  async updatePost(
    id: string,
    payload: UpdatePostRequest,
    currentUserId?: string,
  ): Promise<CommunityPost> {
    const raw = await apiFetch<any>(`/community/posts/${id}`, {
      method: 'PATCH',
      body: payload,
    });
    return adaptCommunityPost(raw, currentUserId);
  },

  async deletePost(id: string): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>(`/community/posts/${id}`, {
      method: 'DELETE',
    });
  },

  async togglePostReaction(
    id: string,
    emoji: string,
    currentUserId?: string,
  ): Promise<CommunityPost> {
    const raw = await apiFetch<any>(`/community/posts/${id}/reactions`, {
      method: 'POST',
      body: { emoji },
    });
    return adaptCommunityPost(raw, currentUserId);
  },

  async listReplies(
    postId: string,
    opts: { parentReplyId?: string } = {},
    currentUserId?: string,
  ): Promise<CommunityReply[]> {
    const qs = buildQuery({ parentReplyId: opts.parentReplyId });
    const raw = await apiFetch<any[]>(
      `/community/posts/${postId}/replies${qs}`,
    );
    return Array.isArray(raw)
      ? raw.map((r) => adaptCommunityReply(r, currentUserId))
      : [];
  },

  async createReply(
    postId: string,
    payload: CreateReplyRequest,
    currentUserId?: string,
  ): Promise<CommunityReply> {
    const raw = await apiFetch<any>(`/community/posts/${postId}/replies`, {
      method: 'POST',
      body: payload,
    });
    return adaptCommunityReply(raw, currentUserId);
  },

  async deleteReply(
    postId: string,
    replyId: string,
  ): Promise<{ ok: boolean; deleted: number }> {
    return apiFetch<{ ok: boolean; deleted: number }>(
      `/community/posts/${postId}/replies/${replyId}`,
      { method: 'DELETE' },
    );
  },

  async toggleReplyReaction(
    postId: string,
    replyId: string,
    emoji: string,
    currentUserId?: string,
  ): Promise<CommunityReply> {
    const raw = await apiFetch<any>(
      `/community/posts/${postId}/replies/${replyId}/reactions`,
      {
        method: 'POST',
        body: { emoji },
      },
    );
    return adaptCommunityReply(raw, currentUserId);
  },
};
