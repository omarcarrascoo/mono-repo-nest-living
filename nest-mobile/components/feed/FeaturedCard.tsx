import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { FeaturedPostData } from '../../types/feed';
import { COLORS, THEME } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface FeaturedCardProps {
  item: FeaturedPostData;
}

export const FeaturedCard: React.FC<FeaturedCardProps> = ({ item }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: item.author.avatar }} style={styles.avatar} />
        <View>
          <View style={styles.authorRow}>
            <Text style={styles.authorName}>{item.author.name}</Text>
            {/* Casting icon name safely would require a generic constraint, using 'any' for simplicity with Feather names */}
            <Feather name={item.badgeIcon as any} size={12} color={COLORS.background.base} />
          </View>
          <Text style={styles.role}>{item.author.role}</Text>
        </View>
      </View>
      
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.preview} numberOfLines={3}>{item.preview}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.75,
    backgroundColor: COLORS.ui.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginRight: 16, // Margin right included in component for FlatList separation
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorName: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  role: { fontSize: 12, color: COLORS.text.secondary },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 8, color: COLORS.text.primary },
  preview: { fontSize: 14, color: COLORS.text.secondary, lineHeight: 20 },
});