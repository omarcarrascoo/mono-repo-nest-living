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
import { useCartStore } from '@/stores/cart-store';
import { formatMXN } from '@/lib/currency';

export default function ConfirmationScreen() {
  const router = useRouter();
  const order = useCartStore((s) => s.lastOrder);
  const resetLastOrder = useCartStore((s) => s.resetLastOrder);

  if (!order) {
    return (
      <View style={[styles.container, styles.center]}>
        <Feather name="inbox" size={32} color={COLORS.text.label} />
        <Text style={styles.emptyTitle}>Sin orden activa</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/(tabs)/delivery' as never)}
        >
          <Text style={styles.primaryBtnText}>Ir al menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDone = () => {
    resetLastOrder();
    router.replace('/(tabs)/delivery' as never);
  };

  const handleTrack = () => {
    if (!order) return;
    resetLastOrder();
    router.replace(`/orders/${order.id}` as never);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.successCircle}>
          <Feather name="check" size={42} color={COLORS.ui.white} />
        </View>

        <Text style={styles.title}>¡Pedido confirmado!</Text>
        <Text style={styles.subtitle}>
          Te avisaremos cuando esté en camino. Mantente atento.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen</Text>
          <View style={styles.divider} />
          {order.items.map((item) => (
            <View key={item.lineId} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {item.quantity}x {item.name}
                </Text>
                {item.modifiers.length > 0 ? (
                  <Text style={styles.itemMods}>
                    {item.modifiers.map((m) => m.optionName).join(' · ')}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.itemPrice}>{formatMXN(item.lineTotal)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatMXN(order.total)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pago</Text>
          <View style={styles.divider} />
          <View style={styles.paymentRow}>
            <Feather
              name={order.payment.method === 'terminal' ? 'credit-card' : 'dollar-sign'}
              size={18}
              color={COLORS.brand.tealDark}
            />
            <Text style={styles.paymentMethod}>
              {order.payment.method === 'terminal'
                ? 'Terminal en la entrega'
                : 'Efectivo a la entrega'}
            </Text>
          </View>
          {order.payment.method === 'cash' && order.payment.cashDenomination ? (
            <>
              <View style={styles.kvRow}>
                <Text style={styles.kvKey}>Pagas con</Text>
                <Text style={styles.kvValue}>
                  {formatMXN(order.payment.cashDenomination)}
                </Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvKey}>Cambio</Text>
                <Text style={[styles.kvValue, styles.kvHighlight]}>
                  {formatMXN(order.cashChange ?? 0)}
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={handleTrack}>
          <Text style={styles.ctaBtnText}>Seguir mi pedido</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.85}
          onPress={handleDone}
        >
          <Text style={styles.secondaryBtnText}>Volver al menú</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light.backgroundSecondary },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary },
  primaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.brand.tealDark,
  },
  primaryBtnText: { color: COLORS.ui.white, fontWeight: '800' },

  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 50,
    paddingBottom: 140,
    alignItems: 'center',
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.brand.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },

  card: {
    width: '100%',
    backgroundColor: COLORS.ui.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 13,
    color: COLORS.text.label,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  divider: { height: 1, backgroundColor: COLORS.light.border, marginVertical: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  itemMods: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: COLORS.text.primary },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary },
  totalValue: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  kvKey: { fontSize: 13, color: COLORS.text.secondary, fontWeight: '600' },
  kvValue: { fontSize: 14, color: COLORS.text.primary, fontWeight: '700' },
  kvHighlight: { color: COLORS.brand.tealDark, fontWeight: '800' },

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
    backgroundColor: COLORS.brand.tealDark,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    color: COLORS.ui.white,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryBtnText: {
    color: COLORS.brand.tealDark,
    fontSize: 14,
    fontWeight: '800',
  },
});
