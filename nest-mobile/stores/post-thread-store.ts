import { create } from 'zustand';
import { CommunityReply, CreateReplyRequest } from '@/types/api';
import { communityService } from '@/services/community.service';
import { useAuthStore } from './auth-store';
import { useCommunityStore } from './community-store';

interface PostThreadState {
  postId: string | null;
  replies: CommunityReply[];

  loading: boolean;
  refreshing: boolean;
  posting: boolean;
  error: string | null;

  loadFor: (postId: string) => Promise<void>;
  refresh: () => Promise<void>;

  createReply: (payload: CreateReplyRequest) => Promise<CommunityReply>;
  toggleReplyReaction: (replyId: string, emoji: string) => Promise<void>;
  deleteReply: (replyId: string) => Promise<void>;
  reset: () => void;
}

function currentUserId(): string | undefined {
  return useAuthStore.getState().user?.id;
}

function applyReactionLocally(
  reply: CommunityReply,
  emoji: string,
): CommunityReply {
  const reactions = { ...reply.reactions };
  let mine = reply.myReaction;
  if (mine) {
    reactions[mine] = Math.max(0, (reactions[mine] ?? 1) - 1);
    if (reactions[mine] === 0) delete reactions[mine];
  }
  if (mine === emoji) {
    mine = null;
  } else {
    reactions[emoji] = (reactions[emoji] ?? 0) + 1;
    mine = emoji;
  }
  return { ...reply, reactions, myReaction: mine };
}

export const usePostThreadStore = create<PostThreadState>((set, get) => ({
  postId: null,
  replies: [],
  loading: false,
  refreshing: false,
  posting: false,
  error: null,

  loadFor: async (postId) => {
    set({ postId, loading: true, error: null, replies: [] });
    try {
      const replies = await communityService.listReplies(
        postId,
        {},
        currentUserId(),
      );
      set({ replies, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'No pudimos cargar el hilo' });
    }
  },

  refresh: async () => {
    const { postId } = get();
    if (!postId) return;
    set({ refreshing: true, error: null });
    try {
      const replies = await communityService.listReplies(
        postId,
        {},
        currentUserId(),
      );
      set({ replies, refreshing: false });
    } catch (e: any) {
      set({ refreshing: false, error: e?.message ?? 'No pudimos refrescar' });
    }
  },

  createReply: async (payload) => {
    const { postId } = get();
    if (!postId) throw new Error('No active post');
    set({ posting: true, error: null });
    try {
      const reply = await communityService.createReply(
        postId,
        payload,
        currentUserId(),
      );
      set((s) => ({ replies: [...s.replies, reply], posting: false }));

      // Bump repliesCount on the post in the community store cache so the
      // feed reflects the change without a refetch.
      const cached = useCommunityStore.getState().byId[postId];
      if (cached) {
        useCommunityStore.getState().upsertPost({
          ...cached,
          repliesCount: cached.repliesCount + 1,
        });
      }
      return reply;
    } catch (e: any) {
      set({ posting: false, error: e?.message ?? 'No pudimos publicar' });
      throw e;
    }
  },

  toggleReplyReaction: async (replyId, emoji) => {
    const { postId, replies } = get();
    if (!postId) return;
    const prev = replies.find((r) => r.id === replyId);
    if (!prev) return;
    const optimistic = applyReactionLocally(prev, emoji);
    set({
      replies: replies.map((r) => (r.id === replyId ? optimistic : r)),
    });
    try {
      const updated = await communityService.toggleReplyReaction(
        postId,
        replyId,
        emoji,
        currentUserId(),
      );
      set((s) => ({
        replies: s.replies.map((r) => (r.id === replyId ? updated : r)),
      }));
    } catch (e) {
      set((s) => ({
        replies: s.replies.map((r) => (r.id === replyId ? prev : r)),
      }));
      throw e;
    }
  },

  deleteReply: async (replyId) => {
    const { postId, replies } = get();
    if (!postId) return;
    // Pre-compute descendants for an optimistic remove so the tree updates
    // before the server confirms the cascade.
    const descendantIds = collectDescendantIds(replies, replyId);
    const allIds = new Set([replyId, ...descendantIds]);
    const prev = replies;
    set({ replies: replies.filter((r) => !allIds.has(r.id)) });
    try {
      const result = await communityService.deleteReply(postId, replyId);
      const cached = useCommunityStore.getState().byId[postId];
      if (cached) {
        useCommunityStore.getState().upsertPost({
          ...cached,
          repliesCount: Math.max(0, cached.repliesCount - result.deleted),
        });
      }
    } catch (e) {
      set({ replies: prev });
      throw e;
    }
  },

  reset: () =>
    set({
      postId: null,
      replies: [],
      loading: false,
      refreshing: false,
      posting: false,
      error: null,
    }),
}));

function collectDescendantIds(
  replies: CommunityReply[],
  rootId: string,
): string[] {
  const out: string[] = [];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const next = replies
      .filter((r) => r.parentReplyId && frontier.includes(r.parentReplyId))
      .map((r) => r.id);
    if (next.length === 0) break;
    out.push(...next);
    frontier = next;
  }
  return out;
}
