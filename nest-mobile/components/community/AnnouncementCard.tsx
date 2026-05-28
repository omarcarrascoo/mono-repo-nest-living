import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { CommunityPost, REACTION_EMOJIS } from '@/types/api';
import { COLORS } from '@/constants/theme';
import { formatRelative } from '@/lib/datetime';

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
  const subtitle = created ? formatRelative(created) : '';
  const handle = useMemo(() => {
    const first = post.author.name?.split(' ')[0] ?? 'admin';
    return '@' + first.toLowerCase();
  }, [post.author.name]);

  const totalReactions = useMemo(
    () =>
      Object.values(post.reactions).reduce((sum, n) => sum + (n ?? 0), 0),
    [post.reactions],
  );
  const topEmojis = useMemo(
    () => REACTION_EMOJIS.filter((e) => (post.reactions[e] ?? 0) > 0).slice(0, 3),
    [post.reactions],
  );

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {post.author.avatar ? (
        <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Feather name="bell" size={18} color={COLORS.brand.tealDark} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {post.author.name}
          </Text>
          <View style={styles.officialPill}>
            <Feather name="shield" size={9} color={COLORS.brand.tealDark} />
            <Text style={styles.officialText}>Aviso</Text>
          </View>
          <Text style={styles.handle} numberOfLines={1}>
            {handle}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <Text style={styles.content} numberOfLines={6}>
          {post.content}
        </Text>

        <View style={styles.actionRow}>
          <View style={styles.actionItem}>
            <Feather name="message-circle" size={16} color={COLORS.text.label} />
            <Text style={styles.actionText}>{post.repliesCount}</Text>
          </View>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onReact(post.myReaction ?? '❤️')}
            activeOpacity={0.6}
            hitSlop={8}
          >
            {post.myReaction ? (
              <Text style={styles.actionEmoji}>{post.myReaction}</Text>
            ) : (
              <Feather name="heart" size={16} color={COLORS.text.label} />
            )}
            <Text
              style={[
                styles.actionText,
                post.myReaction ? styles.actionTextActive : null,
              ]}
            >
              {totalReactions || ''}
            </Text>
          </TouchableOpacity>

          {topEmojis.length > 0 ? (
            <View style={styles.emojiStrip}>
              {topEmojis.map((e) => (
                <Text key={e} style={styles.stripEmoji}>
                  {e}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={{ flex: 1 }} />

          {onDelete ? (
            <TouchableOpacity
              onPress={onDelete}
              activeOpacity={0.6}
              hitSlop={8}
              style={styles.deleteIcon}
            >
              <Feather name="trash-2" size={15} color="#dc2626" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.accent} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.ui.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.light.border,
    position: 'relative',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.brand.tealDark,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.promotions.pillBg,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { flex: 1, gap: 4 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.text.primary,
    maxWidth: 140,
  },
  officialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.promotions.pillBg,
  },
  officialText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.brand.tealDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  handle: {
    fontSize: 13,
    color: COLORS.text.label,
    fontWeight: '500',
    flexShrink: 1,
  },
  dot: { fontSize: 13, color: COLORS.text.label },
  time: { fontSize: 13, color: COLORS.text.label, fontWeight: '500' },

  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text.primary,
    lineHeight: 20,
    marginTop: 2,
  },
  content: {
    fontSize: 14.5,
    color: COLORS.text.primary,
    lineHeight: 20,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.label,
  },
  actionTextActive: { color: COLORS.brand.tealDark },
  actionEmoji: { fontSize: 16 },
  emojiStrip: { flexDirection: 'row', alignItems: 'center' },
  stripEmoji: { fontSize: 13, marginLeft: -2 },

  deleteIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
  },
});
