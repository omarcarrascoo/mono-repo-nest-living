import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { COLORS } from '@/constants/theme';
import { DashboardHeader } from '@/components/ui/DashboardHeader';
import { useNotificationsStore } from '@/stores/notifications-store';
import { useCommunityStore, CommunityFilter } from '@/stores/community-store';
import { useAuthStore } from '@/stores/auth-store';
import { PostComposerTrigger } from '@/components/community/PostComposerTrigger';
import { AnnouncementCard } from '@/components/community/AnnouncementCard';
import { PostCard } from '@/components/community/PostCard';
import { PinnedCarousel } from '@/components/community/PinnedCarousel';
import { BroadcastComposer } from '@/components/admin/BroadcastComposer';

const TABS: Array<{ label: string; filter: CommunityFilter }> = [
  { label: 'Todos', filter: 'all' },
  { label: 'Anuncios', filter: 'announcement' },
  { label: 'Vecinos', filter: 'post' },
];

export default function FeedUnifiedScreen() {
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const activeMembershipRole = useAuthStore((s) => s.activeMembershipRole); const isAdmin = activeMembershipRole === 'admin';

  const items = useCommunityStore((s) => s.items);
  const filter = useCommunityStore((s) => s.filter);
  const loading = useCommunityStore((s) => s.loading);
  const refreshing = useCommunityStore((s) => s.refreshing);
  const error = useCommunityStore((s) => s.error);
  const fetchPosts = useCommunityStore((s) => s.fetchPosts);
  const refreshPosts = useCommunityStore((s) => s.refreshPosts);
  const setFilter = useCommunityStore((s) => s.setFilter);
  const toggleReaction = useCommunityStore((s) => s.toggleReaction);
  const deletePost = useCommunityStore((s) => s.deletePost);

  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationsStore((s) => s.fetchUnreadCount);

  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const adminStats = useMemo(() => {
    if (!isAdmin) return null;
    const announcements = items.filter((p) => p.type === 'announcement').length;
    const posts = items.length - announcements;
    const replies = items.reduce((sum, p) => sum + (p.repliesCount ?? 0), 0);
    return { announcements, posts, replies };
  }, [isAdmin, items]);

  const { pinnedItems, timelineItems } = useMemo(() => {
    const pinned: typeof items = [];
    const timeline: typeof items = [];
    for (const p of items) {
      if (p.pinned) pinned.push(p);
      else timeline.push(p);
    }
    return { pinnedItems: pinned, timelineItems: timeline };
  }, [items]);

  useEffect(() => {
    void fetchUnreadCount();
    void fetchPosts();
  }, [fetchUnreadCount, fetchPosts]);

  const activeLabel = useMemo(
    () => TABS.find((t) => t.filter === filter)?.label ?? 'Todos',
    [filter],
  );

  const handleTabPress = useCallback(
    (label: string) => {
      const next = TABS.find((t) => t.label === label);
      if (next) setFilter(next.filter);
    },
    [setFilter],
  );

  const handleOpenPost = useCallback(
    (id: string) => router.push(`/post/${id}` as never),
    [router],
  );

  const handleNewPost = useCallback(
    () => router.push('/post/new' as never),
    [router],
  );

  const handleReact = useCallback(
    (postId: string, emoji: string) => {
      void toggleReaction(postId, emoji).catch(() => {});
    },
    [toggleReaction],
  );

  const handleDelete = useCallback(
    (postId: string) => {
      const post = items.find((p) => p.id === postId);
      const label = post?.type === 'announcement' ? 'el aviso' : 'la publicación';
      Alert.alert(
        'Eliminar publicación',
        `Esto eliminará ${label} y sus respuestas. ¿Continuar?`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí, eliminar',
            style: 'destructive',
            onPress: async () => {
              setDeletingId(postId);
              try {
                await deletePost(postId);
              } catch (e: any) {
                Alert.alert('Error', e?.message ?? 'No se pudo eliminar.');
              } finally {
                setDeletingId(null);
              }
            },
          },
        ],
      );
    },
    [deletePost, items],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <DashboardHeader
          avatarUrl={user?.avatar}
          fullName={user?.fullName}
          userName={user?.fullName?.split(' ')[0] ?? 'Vecino'}
          hasUnread={unreadCount > 0}
          onMenuPress={() => router.push('/notifications' as never)}
          variant="standard"
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refreshPosts()}
              tintColor={COLORS.brand.tealDark}
            />
          }
        >
          <View style={styles.heroSection}>
            {isAdmin ? (
              <Text style={styles.heroEyebrow}>Moderación</Text>
            ) : null}
            <Text style={styles.heroTitle}>
              {isAdmin ? 'Muro de la\ncomunidad' : 'Bienvenido al\nMuro Vecinal'}
            </Text>
            {isAdmin ? (
              <Text style={styles.heroSub}>
                Difunde avisos, modera publicaciones y mantén el tono del muro.
              </Text>
            ) : null}
            <ToggleRow
              tabs={TABS.map((t) => t.label)}
              activeTab={activeLabel}
              onTabPress={handleTabPress}
            />
          </View>

          {isAdmin && adminStats ? (
            <View style={styles.modStrip}>
              <ModStat
                icon="bell"
                label="Avisos"
                value={adminStats.announcements}
                tint="#0f766e"
                bg="#ccfbf1"
              />
              <ModStat
                icon="message-circle"
                label="Posts"
                value={adminStats.posts}
                tint="#1d4ed8"
                bg="#dbeafe"
              />
              <ModStat
                icon="corner-down-right"
                label="Respuestas"
                value={adminStats.replies}
                tint="#9333ea"
                bg="#f3e8ff"
              />
            </View>
          ) : null}

          <PinnedCarousel items={pinnedItems} onPressItem={handleOpenPost} />

          <View style={styles.timelineHeaderRow}>
            <Text style={styles.timelineTitle}>
              {isAdmin ? 'Publicaciones' : 'Conversaciones'}
            </Text>
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => void refreshPosts()}
              activeOpacity={0.85}
            >
              <Feather name="refresh-cw" size={13} color={COLORS.text.label} />
            </TouchableOpacity>
          </View>

          <PostComposerTrigger
            avatarUrl={user?.avatar}
            fullName={user?.fullName}
            isAdmin={isAdmin}
            onPress={handleNewPost}
          />

          {loading && items.length === 0 ? (
            <View style={styles.statusBox}>
              <ActivityIndicator color={COLORS.brand.tealDark} />
              <Text style={styles.statusText}>Cargando muro…</Text>
            </View>
          ) : error && items.length === 0 ? (
            <View style={styles.statusBox}>
              <Feather
                name="alert-circle"
                size={20}
                color={COLORS.status.error}
              />
              <Text style={styles.statusText}>{error}</Text>
              <TouchableOpacity
                onPress={() => void fetchPosts({ force: true })}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : timelineItems.length === 0 && pinnedItems.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather
                name="message-circle"
                size={28}
                color={COLORS.brand.tealDark}
              />
              <Text style={styles.emptyTitle}>Aún no hay conversaciones</Text>
              <Text style={styles.emptyBody}>
                Sé el primero en compartir algo con tus vecinos.
              </Text>
              <TouchableOpacity onPress={handleNewPost} style={styles.emptyCta}>
                <Feather name="edit-3" size={14} color={COLORS.ui.white} />
                <Text style={styles.emptyCtaText}>Escribir publicación</Text>
              </TouchableOpacity>
            </View>
          ) : timelineItems.length === 0 ? (
            <View style={styles.softHint}>
              <Text style={styles.softHintText}>
                Sólo hay avisos fijados ahora mismo. ¡Inicia la conversación!
              </Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {timelineItems.map((post) => {
                const canDelete = isAdmin || post.author.id === user?.id;
                const onDelete =
                  canDelete && deletingId !== post.id
                    ? () => handleDelete(post.id)
                    : undefined;
                return post.type === 'announcement' ? (
                  <AnnouncementCard
                    key={post.id}
                    post={post}
                    onPress={() => handleOpenPost(post.id)}
                    onReact={(emoji) => handleReact(post.id, emoji)}
                    onDelete={onDelete}
                  />
                ) : (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPress={() => handleOpenPost(post.id)}
                    onReact={(emoji) => handleReact(post.id, emoji)}
                    onReply={() => handleOpenPost(post.id)}
                    onDelete={onDelete}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>

        {isAdmin ? (
          <TouchableOpacity
            style={styles.broadcastFab}
            onPress={() => setBroadcastOpen(true)}
            activeOpacity={0.9}
          >
            <Feather name="send" size={18} color="#fff" />
            <Text style={styles.broadcastFabText}>Difundir</Text>
          </TouchableOpacity>
        ) : null}

        <BroadcastComposer
          visible={broadcastOpen}
          onClose={() => setBroadcastOpen(false)}
        />
      </SafeAreaView>
    </View>
  );
}

function ModStat({
  icon,
  label,
  value,
  tint,
  bg,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number;
  tint: string;
  bg: string;
}) {
  return (
    <View style={styles.modStat}>
      <View style={[styles.modStatIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={14} color={tint} />
      </View>
      <Text style={styles.modStatValue}>{value}</Text>
      <Text style={styles.modStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ui.white },
  heroSection: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 30 },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text.primary,
    lineHeight: 38,
    marginBottom: 24,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brand.tealDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginTop: -16,
    marginBottom: 24,
  },
  modStrip: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 24,
    marginBottom: 18,
  },
  modStat: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    gap: 6,
  },
  modStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modStatValue: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary },
  modStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  broadcastFab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: COLORS.brand.tealDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  broadcastFabText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 12,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  timeline: {
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.light.border,
  },
  softHint: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    alignItems: 'center',
  },
  softHintText: {
    fontSize: 13,
    color: COLORS.text.label,
    textAlign: 'center',
  },
  filterChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  statusBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.brand.tealDark,
    borderRadius: 14,
    marginTop: 4,
  },
  retryText: { color: COLORS.ui.white, fontWeight: '800', fontSize: 13 },
  emptyBox: {
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginTop: 8,
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.light.backgroundSecondary,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginTop: 4,
  },
  emptyBody: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.brand.tealDark,
  },
  emptyCtaText: {
    color: COLORS.ui.white,
    fontWeight: '800',
    fontSize: 13,
  },
});
