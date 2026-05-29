import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '@/constants/theme';
import {
  CommunityPost,
  CommunityReply,
  CreateReplyRequest,
} from '@/types/api';
import { useCommunityStore } from '@/stores/community-store';
import { usePostThreadStore } from '@/stores/post-thread-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatRelative } from '@/lib/datetime';
import { AuthorBadge } from '@/components/community/AuthorBadge';
import { ReactionBar } from '@/components/community/ReactionBar';
import { ReplyItem } from '@/components/community/ReplyItem';
import { ReplyComposer } from '@/components/community/ReplyComposer';

export default function PostThreadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const postId = String(params.id ?? '');

  const user = useAuthStore((s) => s.user);
  const activeMembershipRole = useAuthStore((s) => s.activeMembershipRole); const isAdmin = activeMembershipRole === 'admin';

  const cached = useCommunityStore((s) => s.byId[postId]);
  const getPost = useCommunityStore((s) => s.getPost);
  const togglePostReaction = useCommunityStore((s) => s.toggleReaction);
  const deletePost = useCommunityStore((s) => s.deletePost);

  const replies = usePostThreadStore((s) => s.replies);
  const loading = usePostThreadStore((s) => s.loading);
  const refreshing = usePostThreadStore((s) => s.refreshing);
  const posting = usePostThreadStore((s) => s.posting);
  const threadError = usePostThreadStore((s) => s.error);
  const loadFor = usePostThreadStore((s) => s.loadFor);
  const refresh = usePostThreadStore((s) => s.refresh);
  const createReply = usePostThreadStore((s) => s.createReply);
  const toggleReplyReaction = usePostThreadStore((s) => s.toggleReplyReaction);
  const deleteReplyAction = usePostThreadStore((s) => s.deleteReply);

  const [postLoading, setPostLoading] = useState(!cached);
  const [postError, setPostError] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<CommunityReply | null>(null);

  const post: CommunityPost | null = cached ?? null;

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    if (!cached) {
      setPostLoading(true);
      getPost(postId)
        .then(() => {
          if (!cancelled) setPostLoading(false);
        })
        .catch((e: any) => {
          if (!cancelled) {
            setPostError(e?.message ?? 'No pudimos cargar la publicación');
            setPostLoading(false);
          }
        });
    } else {
      setPostLoading(false);
    }
    void loadFor(postId);
    return () => {
      cancelled = true;
    };
    // We intentionally only depend on postId — `cached` flipping doesn't
    // require re-fetching the post or thread.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const { topLevelReplies, childMapByParent } = useMemo(() => {
    const top: CommunityReply[] = [];
    const byParent = new Map<string, CommunityReply[]>();
    for (const r of replies) {
      if (!r.parentReplyId) {
        top.push(r);
      } else {
        const list = byParent.get(r.parentReplyId) ?? [];
        list.push(r);
        byParent.set(r.parentReplyId, list);
      }
    }
    const cmp = (a: CommunityReply, b: CommunityReply) =>
      (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
    top.sort(cmp);
    for (const list of byParent.values()) list.sort(cmp);
    return { topLevelReplies: top, childMapByParent: byParent };
  }, [replies]);

  const handleSubmitReply = useCallback(
    async (content: string) => {
      const payload: CreateReplyRequest = {
        content,
        parentReplyId: replyTarget?.id,
      };
      await createReply(payload);
      setReplyTarget(null);
    },
    [createReply, replyTarget],
  );

  const handleReplyToReply = useCallback((reply: CommunityReply) => {
    setReplyTarget(reply);
  }, []);

  const handleDeleteReply = useCallback(
    (reply: CommunityReply) => {
      Alert.alert(
        'Eliminar respuesta',
        '¿Seguro que quieres eliminar este comentario? También se eliminarán las respuestas anidadas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => {
              void deleteReplyAction(reply.id).catch((e: any) => {
                Alert.alert('Error', e?.message ?? 'No pudimos eliminar');
              });
            },
          },
        ],
      );
    },
    [deleteReplyAction],
  );

  const handleDeletePost = useCallback(() => {
    if (!post) return;
    Alert.alert(
      'Eliminar publicación',
      '¿Seguro que quieres eliminar esta publicación? Se eliminarán también todos los comentarios.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void deletePost(post.id)
              .then(() => router.back())
              .catch((e: any) => {
                Alert.alert('Error', e?.message ?? 'No pudimos eliminar');
              });
          },
        },
      ],
    );
  }, [post, deletePost, router]);

  if (postLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={COLORS.brand.tealDark} />
      </View>
    );
  }

  if (postError || !post) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorTitle}>No pudimos cargar la publicación</Text>
        {postError ? <Text style={styles.errorBody}>{postError}</Text> : null}
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const created = post.createdAt ? new Date(post.createdAt) : null;
  const subtitle = created ? formatRelative(created) : undefined;
  const isOwner = !!user && post.author.id === user.id;
  const canDeletePost = isOwner || isAdmin;
  const isAnnouncement = post.type === 'announcement';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isAnnouncement ? 'Aviso oficial' : 'Conversación'}
        </Text>
        {canDeletePost ? (
          <TouchableOpacity
            onPress={handleDeletePost}
            style={styles.headerBtn}
            hitSlop={8}
          >
            <Feather name="trash-2" size={18} color={COLORS.status.error} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh()}
              tintColor={COLORS.brand.tealDark}
            />
          }
        >
          <View
            style={[
              styles.postCard,
              isAnnouncement && styles.postCardAnnouncement,
            ]}
          >
            {isAnnouncement ? (
              <View style={styles.announcementHeader}>
                <View style={styles.announcementIconBox}>
                  <Feather name="bell" size={14} color={COLORS.brand.tealDark} />
                </View>
                <Text style={styles.announcementHeaderText}>Aviso oficial</Text>
                {post.pinned ? (
                  <View style={styles.pinPill}>
                    <Feather
                      name="bookmark"
                      size={10}
                      color={COLORS.brand.tealDark}
                    />
                    <Text style={styles.pinText}>Anclado</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <AuthorBadge author={post.author} subtitle={subtitle} />

            {post.tag ? (
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{post.tag}</Text>
              </View>
            ) : null}

            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postBody}>{post.content}</Text>

            <View style={styles.postFooter}>
              <ReactionBar
                reactions={post.reactions}
                myReaction={post.myReaction}
                onToggle={(e) => {
                  void togglePostReaction(post.id, e).catch(() => {});
                }}
              />
            </View>
          </View>

          <View style={styles.repliesHeader}>
            <Feather
              name="message-square"
              size={14}
              color={COLORS.text.secondary}
            />
            <Text style={styles.repliesHeaderText}>
              {post.repliesCount}{' '}
              {post.repliesCount === 1 ? 'comentario' : 'comentarios'}
            </Text>
          </View>

          {loading ? (
            <View style={styles.threadStatus}>
              <ActivityIndicator color={COLORS.brand.tealDark} />
            </View>
          ) : threadError ? (
            <View style={styles.threadStatus}>
              <Text style={styles.threadErrorText}>{threadError}</Text>
              <TouchableOpacity
                onPress={() => void refresh()}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : topLevelReplies.length === 0 ? (
            <View style={styles.threadEmpty}>
              <Text style={styles.threadEmptyText}>
                Sé el primero en comentar.
              </Text>
            </View>
          ) : (
            <View style={styles.repliesList}>
              {topLevelReplies.map((r) => (
                <ReplyItem
                  key={r.id}
                  reply={r}
                  children={childMapByParent.get(r.id) ?? []}
                  childMap={childMapByParent}
                  currentUserId={user?.id}
                  isAdmin={isAdmin}
                  onReact={(replyId, emoji) => {
                    void toggleReplyReaction(replyId, emoji).catch(() => {});
                  }}
                  onReply={handleReplyToReply}
                  onDelete={handleDeleteReply}
                  maxDepth={2}
                />
              ))}
            </View>
          )}
        </ScrollView>

        <ReplyComposer
          replyingToName={replyTarget?.author.name ?? null}
          onCancelReply={() => setReplyTarget(null)}
          onSubmit={handleSubmitReply}
          posting={posting}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ui.white },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  errorBody: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  errorBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.brand.tealDark,
  },
  errorBtnText: { color: COLORS.ui.white, fontWeight: '800' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 18,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
    backgroundColor: COLORS.ui.white,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text.primary,
  },

  postCard: {
    backgroundColor: COLORS.ui.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    gap: 12,
  },
  postCardAnnouncement: {
    backgroundColor: COLORS.promotions.pillBg,
    borderColor: COLORS.brand.tealDark,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  announcementIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ui.white,
  },
  announcementHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brand.tealDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
  },
  pinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: COLORS.ui.white,
  },
  pinText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.brand.tealDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text.primary,
    lineHeight: 26,
  },
  postBody: {
    fontSize: 15,
    color: COLORS.text.primary,
    lineHeight: 22,
  },
  postFooter: { marginTop: 4 },

  repliesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  repliesHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  repliesList: { marginHorizontal: 16, marginTop: 4 },
  threadStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  threadErrorText: {
    color: COLORS.status.error,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  threadEmpty: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  threadEmptyText: {
    color: COLORS.text.secondary,
    fontSize: 13,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.brand.tealDark,
    borderRadius: 14,
  },
  retryText: { color: COLORS.ui.white, fontWeight: '800', fontSize: 13 },
});
