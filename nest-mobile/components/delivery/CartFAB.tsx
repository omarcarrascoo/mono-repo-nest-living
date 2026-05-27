import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { formatMXN } from '@/lib/currency';

interface CartFABProps {
  itemCount: number;
  total: number;
  onPress: () => void;
}

/**
 * Floating action button del carrito. Aparece sobre la TabBar (que vive
 * a 30px del bottom + 64px de alto = 94px). Lo posicionamos a 110px
 * para que respire.
 *
 * No se muestra si itemCount === 0 — el caller decide si renderizarlo.
 */
export const CartFAB: React.FC<CartFABProps> = ({ itemCount, total, onPress }) => {
  if (itemCount <= 0) return null;
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.btn}>
        <View style={styles.left}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{itemCount}</Text>
          </View>
          <Feather name="shopping-bag" size={18} color={COLORS.ui.white} />
          <Text style={styles.label}>Ver carrito</Text>
        </View>
        <Text style={styles.total}>{formatMXN(total)}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 100,
    left: 24,
    right: 24,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.brand.tealDark,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: COLORS.ui.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.brand.tealDark,
    fontSize: 12,
    fontWeight: '800',
  },
  label: {
    color: COLORS.ui.white,
    fontSize: 15,
    fontWeight: '700',
  },
  total: {
    color: COLORS.ui.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
