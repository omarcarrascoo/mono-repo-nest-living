import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { CartLineItem } from '@/components/delivery/CartLineItem';
import { cartSelectors, useCartStore } from '@/stores/cart-store';
import { formatMXN } from '@/lib/currency';

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartStore(cartSelectors.subtotal);
  const total = useCartStore(cartSelectors.total);

  const isEmpty = items.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tu carrito</Text>
        {isEmpty ? (
          <View style={styles.iconBtn} />
        ) : (
          <TouchableOpacity onPress={clear} hitSlop={8}>
            <Text style={styles.clearText}>Vaciar</Text>
          </TouchableOpacity>
        )}
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="shopping-bag" size={36} color={COLORS.brand.tealDark} />
          </View>
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.emptyBody}>
            Agrega productos del menú y aparecerán aquí.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/delivery' as never)}
            style={styles.emptyBtn}
          >
            <Text style={styles.emptyBtnText}>Explorar productos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.list}>
              {items.map((item) => (
                <CartLineItem
                  key={item.lineId}
                  item={item}
                  onChangeQuantity={(q) => updateQuantity(item.lineId, q)}
                  onRemove={() => removeLine(item.lineId)}
                />
              ))}
            </View>

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatMXN(subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Servicio</Text>
                <Text style={styles.summaryValueMuted}>Sin cargo</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatMXN(total)}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.ctaBar}>
            <TouchableOpacity
              style={styles.ctaBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/delivery/checkout' as never)}
            >
              <Text style={styles.ctaBtnText}>Continuar al pago</Text>
              <Feather name="arrow-right" size={18} color={COLORS.ui.white} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: COLORS.ui.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.status.error,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  emptyBody: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.brand.tealDark,
  },
  emptyBtnText: { color: COLORS.ui.white, fontWeight: '800' },

  scrollContent: { padding: 20, paddingBottom: 140 },
  list: { gap: 12, marginBottom: 24 },

  summary: {
    backgroundColor: COLORS.ui.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 14, color: COLORS.text.secondary, fontWeight: '600' },
  summaryValue: { fontSize: 14, color: COLORS.text.primary, fontWeight: '700' },
  summaryValueMuted: { fontSize: 14, color: COLORS.text.label, fontWeight: '500' },
  divider: { height: 1, backgroundColor: COLORS.light.border, marginVertical: 4 },
  totalLabel: { fontSize: 16, color: COLORS.text.primary, fontWeight: '800' },
  totalValue: { fontSize: 18, color: COLORS.text.primary, fontWeight: '800' },

  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    backgroundColor: COLORS.ui.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.brand.tealDark,
    height: 56,
    borderRadius: 28,
  },
  ctaBtnText: {
    color: COLORS.ui.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
