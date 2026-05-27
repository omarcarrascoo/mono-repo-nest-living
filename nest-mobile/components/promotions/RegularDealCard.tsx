import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
// 1. Agregamos THEME al import
import { COLORS, THEME } from '@/constants/theme'; 
import { PromoDeal } from '@/types/promotions';

interface RegularDealCardProps {
  item: PromoDeal;
}

export const RegularDealCard: React.FC<RegularDealCardProps> = ({ item }) => (
  <TouchableOpacity activeOpacity={0.8} style={styles.container}>
    <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} />
        {item.isExclusive && (
            <View style={styles.crownBadge}>
                <Feather name="crown" size={12} color={COLORS.ui.white} />
            </View>
        )}
    </View>
    
    <View style={styles.content}>
      <View style={styles.header}>
        <View style={styles.merchantRow}>
            <Image source={{ uri: item.merchant.logo }} style={styles.logo} />
            <Text style={styles.merchantName} numberOfLines={1}>{item.merchant.name}</Text>
        </View>
        {item.distance && <Text style={styles.distance}>{item.distance}</Text>}
      </View>

      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      
      <View style={styles.footer}>
        <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discount}</Text>
        </View>
        <Text style={styles.expiry}>{item.expiry}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.ui.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    
    // 2. CORRECCIÓN: Usamos THEME.shadows en lugar de COLORS.shadows
    shadowColor: THEME.shadows.default.shadowColor,
    shadowOffset: THEME.shadows.default.shadowOffset,
    shadowOpacity: THEME.shadows.default.shadowOpacity,
    shadowRadius: THEME.shadows.default.shadowRadius,
    elevation: THEME.shadows.default.elevation,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.light.backgroundSecondary,
  },
  crownBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: COLORS.brand.teal,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.ui.white,
  },
  content: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  logo: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  merchantName: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '600',
    flex: 1,
  },
  distance: {
    fontSize: 11,
    color: COLORS.text.label,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: 4,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  discountBadge: {
    backgroundColor: COLORS.promotions.badgeSuccessBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.promotions.badgeSuccessBorder,
  },
  discountText: {
    color: COLORS.status.success,
    fontSize: 12,
    fontWeight: '800',
  },
  expiry: {
    fontSize: 12,
    color: COLORS.text.label,
  },
});