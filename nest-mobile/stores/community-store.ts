import { create } from 'zustand';
import {
  CommunityPost,
  CommunityPostType,
  CreatePostRequest,
  UpdatePostRequest,
} from '@/types/api';
import { communityService } from '@/services/community.service';
import { useAuthStore } from './auth-store';

export type CommunityFilter = 'all' | CommunityPostType;

interface CommunityState {
  items: CommunityPost[];
  byId: Record<string, CommunityPost>;

  filter: CommunityFilter;
  query: string;

  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadedAt: number | null;

  fetchPosts: (opts?: { force?: boolean }) => Promise<void>;
  refreshPosts: () => Promise<void>;
  setFilter: (filter: CommunityFilter) => void;
  setQuery: (q: string) => void;

  getPost: (id: string) => Promise<CommunityPost>;
  upsertPost: (post: CommunityPost) => void;
  removePost: (id: string) => void;

  createPost: (payload: CreatePostRequest) => Promise<CommunityPost>;
  updatePost: (id: string, payload: UpdatePostRequest) => Promise<CommunityPost>;
  deletePost: (id: string) => Promise<void>;
  toggleReaction: (id: string, emoji: string) => Promise<void>;

  reset: () => void;
}

const STALE_MS = 30_000;

function currentUserId(): string | undefined {
  return useAuthStore.getState().user?.id;
}

function sortPosts(items: CommunityPost[]): CommunityPost[] {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
  });
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  items: [],
  byId: {},
  filter: 'all',
  query: '',
  loading: false,
  refreshing: false,
  error: null,
  loadedAt: null,

  fetchPosts: async ({ force = false } = {}) => {
    const state = get();
    if (!force && state.loadedAt && Date.now() - state.loadedAt < STALE_MS) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const items = await communityService.listPosts(
        { type: state.filter, q: state.query.trim() || undefined },
        currentUserId(),
      );
      const byId: Record<string, CommunityPost> = { ...state.byId };
      for (const p of items) byId[p.id] = p;
      set({
        items: sortPosts(items),
        byId,
        loading: false,
        loadedAt: Date.now(),
      });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'Error cargando el muro' });
    }
  },

  refreshPosts: async () => {
    const state = get();
    set({ refreshing: true, error: null });
    try {
      const items = await communityService.listPosts(
        { type: state.filter, q: state.query.trim() || undefined },
        currentUserId(),
      );
      const byId: Record<string, CommunityPost> = { ...state.byId };
      for (const p of items) byId[p.id] = p;
      set({
        items: sortPosts(items),
        byId,
        refreshing: false,
        loadedAt: Date.now(),
      });
    } catch (e: any) {
      set({ refreshing: false, error: e?.message ?? 'Error refrescando' });
    }
  },

  setFilter: (filter) => {
    if (get().filter === filter) return;
    set({ filter, loadedAt: null });
    void get().fetchPosts({ force: true });
  },

  setQuery: (q) => {
    if (get().query === q) return;
    set({ query: q, loadedAt: null });
    void get().fetchPosts({ force: true });
  },

  getPost: async (id) => {
    const post = await communityService.getPost(id, currentUserId());
    get().upsertPost(post);
    return post;
  },

  upsertPost: (post) =>
    set((s) => {
      const byId = { ...s.byId, [post.id]: post };
      const exists = s.items.some((p) => p.id === post.id);
      const items = exists
        ? s.items.map((p) => (p.id === post.id ? post : p))
        : [post, ...s.items];
      return { byId, items: sortPosts(items) };
    }),

  removePost: (id) =>
    set((s) => {
      const { [id]: _gone, ...rest } = s.byId;
      return {
        byId: rest,
        items: s.items.filter((p) => p.id !== id),
      };
    }),

  createPost: async (payload) => {
    const post = await communityService.createPost(payload, currentUserId());
    get().upsertPost(post);
    return post;
  },

  updatePost: async (id, payload) => {
    const post = await communityService.updatePost(
      id,
      payload,
      currentUserId(),
    );
    get().upsertPost(post);
    return post;
  },

  deletePost: async (id) => {
    await communityService.deletePost(id);
    get().removePost(id);
  },

  toggleReaction: async (id, emoji) => {
    const userId = currentUserId();
    // Optimistic toggle. We compute the next reactions map locally to avoid
    // visible lag on tap, then reconcile with the server response.
    const prev = get().byId[id];
    if (prev) {
      const optimistic = applyReactionLocally(prev, emoji, userId);
      get().upsertPost(optimistic);
    }
    try {
      const updated = await communityService.togglePostReaction(
        id,
        emoji,
        userId,
      );
      get().upsertPost(updated);
    } catch (e) {
      if (prev) get().upsertPost(prev);
      throw e;
    }
  },

  reset: () =>
    set({
      items: [],
      byId: {},
      filter: 'all',
      query: '',
      loading: false,
      refreshing: false,
      error: null,
      loadedAt: null,
    }),
}));

function applyReactionLocally(
  post: CommunityPost,
  emoji: string,
  _userId?: string,
): CommunityPost {
  const reactions = { ...post.reactions };
  let myReaction = post.myReaction;
  if (myReaction) {
    reactions[myReaction] = Math.max(0, (reactions[myReaction] ?? 1) - 1);
    if (reactions[myReaction] === 0) delete reactions[myReaction];
  }
  if (myReaction === emoji) {
    myReaction = null;
  } else {
    reactions[emoji] = (reactions[emoji] ?? 0) + 1;
    myReaction = emoji;
  }
  return { ...post, reactions, myReaction };
}
