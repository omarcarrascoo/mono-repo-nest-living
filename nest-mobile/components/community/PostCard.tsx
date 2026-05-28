import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CommunityPost } from '@/types/api';
import { COLORS } from '@/constants/theme';
import { formatRelative } from '@/lib/datetime';
import { AuthorBadge } from './AuthorBadge';
import { ReactionBar } from './ReactionBar';

interface PostCardProps {
  post: CommunityPost;
  onPress: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onDelete?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onReact,
  onReply,
  onDelete,
}) => {
  const created = post.createdAt ? new Date(post.createdAt) : null;
  const subtitle = created
    ? formatRelative(created)
    : undefined;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <AuthorBadge author={post.author} subtitle={subtitle} />

      {post.tag ? (
        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{post.tag}</Text>
        </View>
      ) : null}

      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.body} numberOfLines={4}>
        {post.content}
      </Text>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Feather name="message-square" size={13} color={COLORS.text.label} />
          <Text style={styles.metaText}>
            {post.repliesCount}{' '}
            {post.repliesCount === 1 ? 'respuesta' : 'respuestas'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <ReactionBar
        reactions={post.reactions}
        myReaction={post.myReaction}
        onToggle={onReact}
      />

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.replyBtn} onPress={onReply} activeOpacity={0.85}>
          <Feather name="corner-down-right" size={14} color={COLORS.brand.tealDark} />
          <Text style={styles.replyText}>Responder</Text>
        </TouchableOpacity>
        {onDelete ? (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDelete}
            activeOpacity={0.85}
            hitSlop={6}
          >
            <Feather name="trash-2" size={14} color="#dc2626" />
            <Text style={styles.deleteText}>Eliminar</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.ui.white,
    marginHorizontal: 24,
    marginBottom: 14,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    marginTop: 14,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text.primary,
    lineHeight: 22,
    marginTop: 12,
  },
  body: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginTop: 6,
  },
  meta: { flexDirection: 'row', gap: 16, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: COLORS.text.label, fontWeight: '600' },
  divider: {
    height: 1,
    backgroundColor: COLORS.light.border,
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.promotions.pillBg,
  },
  replyText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand.tealDark,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#dc2626',
  },
});
