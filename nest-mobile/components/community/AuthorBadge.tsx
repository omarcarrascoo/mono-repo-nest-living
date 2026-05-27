import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { CommunityAuthor } from '@/types/api';
import { COLORS } from '@/constants/theme';

interface AuthorBadgeProps {
  author: CommunityAuthor;
  subtitle?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administración',
  kitchen_operator: 'Cocina',
  user: 'Vecino',
};

export const AuthorBadge: React.FC<AuthorBadgeProps> = ({
  author,
  subtitle,
  size = 'md',
  style,
}) => {
  const isAdmin = author.role === 'admin';
  const dim = size === 'sm' ? 36 : 44;

  return (
    <View style={[styles.row, style]}>
      {author.avatar ? (
        <Image source={{ uri: author.avatar }} style={[styles.avatar, { width: dim, height: dim, borderRadius: dim / 2 }]} />
      ) : (
        <View style={[styles.avatarFallback, { width: dim, height: dim, borderRadius: dim / 2 }]}>
          <Text style={styles.avatarFallbackText}>{(author.name?.[0] ?? '?').toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={size === 'sm' ? styles.nameSm : styles.name} numberOfLines={1}>
            {author.name}
          </Text>
          {isAdmin ? (
            <View style={styles.officialBadge}>
              <Feather name="shield" size={10} color={COLORS.brand.tealDark} />
              <Text style={styles.officialText}>Oficial</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle ?? ROLE_LABEL[author.role] ?? 'Vecino'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { backgroundColor: '#eee' },
  avatarFallback: {
    backgroundColor: COLORS.promotions.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.brand.tealDark,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.text.primary },
  nameSm: { fontSize: 13, fontWeight: '800', color: COLORS.text.primary },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: COLORS.promotions.pillBg,
  },
  officialText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.brand.tealDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subtitle: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
});
