import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

export interface AmenityItem {
  id: string;
  title: string;
  location: string;
  status: string;
  nextSlot: string;
  rating: number;
  image: string;
}

interface AmenityCardProps {
  item: AmenityItem;
  onPress: () => void;
}

export const AmenityCard = ({ item, onPress }: AmenityCardProps) => {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
        {/* Imagen + Badges */}
        <View style={styles.imageWrapper}>
            <Image source={{ uri: item.image }} style={styles.cardImage} contentFit="cover" transition={500} />
            
            <View style={styles.cardOverlay}>
                <View style={styles.ratingBadge}>
                    <Feather name="star" size={12} color="#FFF" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
                <View style={styles.favBtn}>
                    <Feather name="heart" size={16} color="#FFF" />
                </View>
            </View>
        </View>

        {/* Info Body */}
        <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.status === 'available' ? (
                    <View style={styles.statusDot} />
                ) : (
                    <Text style={styles.timeText}>{item.nextSlot}</Text>
                )}
            </View>
            
            <Text style={styles.cardLocation}>{item.location}</Text>
            
            <View style={styles.cardFooter}>
                <View style={styles.slotPill}>
                    <Feather name="clock" size={12} color={COLORS.brand.tealDark} />
                    <Text style={styles.slotText}>
                        Prox: <Text style={{ fontWeight: '700' }}>{item.nextSlot}</Text>
                    </Text>
                </View>
            </View>
        </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.ui.white,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  imageWrapper: {
    height: 160,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  favBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: -0.5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brand.emerald,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  cardLocation: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  slotText: {
    fontSize: 12,
    color: COLORS.brand.tealDark,
    fontWeight: '500',
  },
});