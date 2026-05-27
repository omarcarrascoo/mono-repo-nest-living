import React, { useCallback, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { COLORS } from '@/constants/theme';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DashboardHeader } from '@/components/ui/DashboardHeader';
import { useNotificationsStore } from '@/stores/notifications-store';
import { useCommunityStore, CommunityFilter } from '@/stores/community-store';
import { useAuthStore } from '@/stores/auth-store';
import { PostComposerTrigger } from '@/components/community/PostComposerTrigger';
import { AnnouncementCard } from '@/components/community/AnnouncementCard';
import { PostCard } from '@/components/community/PostCard';

const TABS: Array<{ label: string; filter: CommunityFilter }> = [
  { label: 'Todos', filter: 'all' },
  { label: 'Anuncios', filter: 'announcement' },
  { label: 'Vecinos', filter: 'post' },
];

export default function FeedUnifiedScreen() {
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const items = useCommunityStore((s) => s.items);
  const filter = useCommunityStore((s) => s.filter);
  const loading = useCommunityStore((s) => s.loading);
  const refreshing = useCommunityStore((s) => s.refreshing);
  const error = useCommunityStore((s) => s.error);
  const fetchPosts = useCommunityStore((s) => s.fetchPosts);
  const refreshPosts = useCommunityStore((s) => s.refreshPosts);
  const setFilter = useCommunityStore((s) => s.setFilter);
  const toggleReaction = useCommunityStore((s) => s.toggleReaction);

  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationsStore((s) => s.fetchUnreadCount);

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <DashboardHeader
          avatarUrl={user?.avatar ?? ''}
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
            <Text style={styles.heroTitle}>Bienvenido al{'\n'}Muro Vecinal</Text>
            <ToggleRow
              tabs={TABS.map((t) => t.label)}
              activeTab={activeLabel}
              onTabPress={handleTabPress}
            />
          </View>

          <SectionHeader
            title="Conversaciones"
            rightAction={
              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => void refreshPosts()}
                activeOpacity={0.85}
              >
                <Feather name="refresh-cw" size={14} color={COLORS.text.primary} />
                <Text style={styles.filterChipText}>Refrescar</Text>
              </TouchableOpacity>
            }
          />

          <PostComposerTrigger
            avatarUrl={user?.avatar}
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
          ) : items.length === 0 ? (
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
          ) : (
            <View style={{ marginTop: 8 }}>
              {items.map((post) =>
                post.type === 'announcement' ? (
                  <AnnouncementCard
                    key={post.id}
                    post={post}
                    onPress={() => handleOpenPost(post.id)}
                    onReact={(emoji) => handleReact(post.id, emoji)}
                  />
                ) : (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPress={() => handleOpenPost(post.id)}
                    onReact={(emoji) => handleReact(post.id, emoji)}
                    onReply={() => handleOpenPost(post.id)}
                  />
                ),
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
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
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.primary,
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
