import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CommunityPost } from '@/types/api';
import { COLORS } from '@/constants/theme';
import { formatRelative } from '@/lib/datetime';

interface PinnedCarouselProps {
  items: CommunityPost[];
  onPressItem: (id: string) => void;
}

export const PinnedCarousel: React.FC<PinnedCarouselProps> = ({
  items,
  onPressItem,
}) => {
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Feather name="bookmark" size={14} color={COLORS.brand.tealDark} />
        <Text style={styles.headerLabel}>Avisos fijados</Text>
        <Text style={styles.headerCount}>· {items.length}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_W + 12}
        snapToAlignment="start"
      >
        {items.map((post) => {
          const created = post.createdAt ? new Date(post.createdAt) : null;
          const subtitle = created ? formatRelative(created) : null;
          return (
            <TouchableOpacity
              key={post.id}
              style={styles.card}
              onPress={() => onPressItem(post.id)}
              activeOpacity={0.9}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Feather name="bell" size={13} color={COLORS.brand.tealDark} />
                </View>
                <Text style={styles.cardEyebrow} numberOfLines={1}>
                  Aviso oficial
                </Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {post.title}
              </Text>
              <Text style={styles.cardBody} numberOfLines={3}>
                {post.content}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {post.author.name}
                </Text>
                {subtitle ? (
                  <Text style={styles.cardMetaDot}>· {subtitle}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const CARD_W = 260;

const styles = StyleSheet.create({
  wrap: { marginTop: 4, marginBottom: 18 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand.tealDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.label,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  card: {
    width: CARD_W,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.promotions.pillBg,
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.18)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ui.white,
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.brand.tealDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text.primary,
    lineHeight: 20,
  },
  cardBody: {
    fontSize: 13,
    color: COLORS.text.primary,
    lineHeight: 18,
    opacity: 0.8,
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,118,110,0.14)',
  },
  cardMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brand.tealDark,
    flexShrink: 1,
  },
  cardMetaDot: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.brand.tealDark,
    opacity: 0.7,
  },
});
