import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CommunityPost } from '@/types/api';
import { COLORS } from '@/constants/theme';
import { formatRelative } from '@/lib/datetime';
import { AuthorBadge } from './AuthorBadge';
import { ReactionBar } from './ReactionBar';

interface AnnouncementCardProps {
  post: CommunityPost;
  onPress: () => void;
  onReact: (emoji: string) => void;
  onDelete?: () => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  post,
  onPress,
  onReact,
  onDelete,
}) => {
  const created = post.createdAt ? new Date(post.createdAt) : null;
  const subtitle = created ? formatRelative(created) : undefined;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Feather name="bell" size={16} color={COLORS.brand.tealDark} />
        </View>
        <Text style={styles.headerLabel}>Aviso oficial</Text>
        {post.pinned ? (
          <View style={styles.pinPill}>
            <Feather name="bookmark" size={10} color={COLORS.brand.tealDark} />
            <Text style={styles.pinText}>Anclado</Text>
          </View>
        ) : null}
      </View>

      <AuthorBadge author={post.author} subtitle={subtitle} size="sm" />

      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.body} numberOfLines={5}>
        {post.content}
      </Text>

      <View style={styles.footer}>
        <View style={styles.metaRow}>
          <Feather
            name="message-square"
            size={13}
            color={COLORS.brand.tealDark}
          />
          <Text style={styles.metaText}>
            {post.repliesCount}{' '}
            {post.repliesCount === 1 ? 'comentario' : 'comentarios'}
          </Text>
        </View>
        <ReactionBar
          reactions={post.reactions}
          myReaction={post.myReaction}
          onToggle={onReact}
          compact
        />
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaText}>Ver detalles</Text>
        <Feather name="arrow-right" size={14} color={COLORS.brand.tealDark} />
      </View>

      {onDelete ? (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={onDelete}
          activeOpacity={0.85}
          hitSlop={6}
        >
          <Feather name="trash-2" size={13} color="#dc2626" />
          <Text style={styles.deleteText}>Eliminar aviso</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginBottom: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.promotions.pillBg,
    borderWidth: 1,
    borderColor: COLORS.brand.tealDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ui.white,
  },
  headerLabel: {
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
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginTop: 14,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
    marginTop: 6,
    opacity: 0.85,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand.tealDark,
  },
  cta: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,118,110,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brand.tealDark,
  },
  deleteBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
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
