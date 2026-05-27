import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { useOrdersStore } from '@/stores/orders-store';
import { formatMXN } from '@/lib/currency';
import { Order, OrderStatus } from '@/types/api';

const FORWARD_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'on_the_way',
  'delivered',
];

const STATUS_META: Record<
  OrderStatus,
  { label: string; description: string; icon: keyof typeof Feather.glyphMap }
> = {
  pending: {
    label: 'Pedido recibido',
    description: 'Esperamos confirmación de la cocina',
    icon: 'clock',
  },
  confirmed: {
    label: 'Pedido confirmado',
    description: 'La cocina ya lo tomó',
    icon: 'check-circle',
  },
  preparing: {
    label: 'Preparando',
    description: 'Estamos cocinando lo tuyo',
    icon: 'tool',
  },
  on_the_way: {
    label: 'En camino',
    description: 'El repartidor va a tu puerta',
    icon: 'truck',
  },
  delivered: {
    label: 'Entregado',
    description: '¡Buen provecho!',
    icon: 'home',
  },
  cancelled: {
    label: 'Cancelado',
    description: 'Esta orden se canceló',
    icon: 'x-circle',
  },
};

function indexOf(status: OrderStatus): number {
  const i = FORWARD_FLOW.indexOf(status);
  return i === -1 ? -1 : i;
}

function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function lastEventForStatus(order: Order, status: OrderStatus): string | undefined {
  const events = order.statusHistory ?? [];
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].status === status) return events[i].at;
  }
  return undefined;
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrdersStore((s) => (id ? s.byId[id] : undefined));
  const fetchOrder = useOrdersStore((s) => s.fetchOrder);

  const [loading, setLoading] = useState(!order);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(!order);
    fetchOrder(id)
      .then(() => setLoading(false))
      .catch((e: any) => {
        setLoading(false);
        setError(e?.message ?? 'No pudimos cargar tu pedido');
      });
  }, [id, fetchOrder, order]);

  const onRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      await fetchOrder(id);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'No pudimos refrescar');
    } finally {
      setRefreshing(false);
    }
  };

  const isCancelled = order?.status === 'cancelled';
  const currentIdx = order ? indexOf(order.status) : -1;
  const currentMeta = order ? STATUS_META[order.status] : null;

  const summary = useMemo(() => {
    if (!order) return null;
    return {
      itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
      hasNotes: order.notes && order.notes.trim().length > 0,
    };
  }, [order]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.ui.white} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Tu pedido</Text>
            {order ? (
              <Text style={styles.headerSubtitle}>#{order.orderNumber}</Text>
            ) : null}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.brand.tealDark}
            />
          }
        >
          {loading && !order ? (
            <View style={styles.statePad}>
              <ActivityIndicator color={COLORS.brand.tealDark} />
            </View>
          ) : error && !order ? (
            <View style={styles.statePad}>
              <Feather name="alert-circle" size={28} color={COLORS.status.error} />
              <Text style={styles.stateTitle}>No pudimos cargar tu pedido</Text>
              <Text style={styles.stateBody}>{error}</Text>
            </View>
          ) : !order ? (
            <View style={styles.statePad}>
              <Feather name="package" size={28} color={COLORS.text.label} />
              <Text style={styles.stateTitle}>Pedido no encontrado</Text>
            </View>
          ) : (
            <>
              {/* Hero status */}
              <View
                style={[
                  styles.hero,
                  isCancelled && { backgroundColor: '#fef2f2' },
                ]}
              >
                <View
                  style={[
                    styles.heroIcon,
                    {
                      backgroundColor: isCancelled
                        ? '#fee2e2'
                        : COLORS.promotions.pillBg,
                    },
                  ]}
                >
                  <Feather
                    name={currentMeta?.icon ?? 'clock'}
                    size={28}
                    color={isCancelled ? COLORS.status.error : COLORS.brand.tealDark}
                  />
                </View>
                <Text style={styles.heroTitle}>{currentMeta?.label}</Text>
                <Text style={styles.heroBody}>{currentMeta?.description}</Text>
                <Text style={styles.heroMeta}>
                  Creada {formatDateTime(order.createdAt)}
                </Text>
              </View>

              {/* Timeline */}
              {!isCancelled ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Avance</Text>
                  {FORWARD_FLOW.map((step, idx) => {
                    const meta = STATUS_META[step];
                    const isDone = idx < currentIdx;
                    const isActive = idx === currentIdx;
                    const isPending = idx > currentIdx;
                    const at = lastEventForStatus(order, step);
                    return (
                      <View key={step} style={styles.timelineRow}>
                        <View style={styles.timelineCol}>
                          <View
                            style={[
                              styles.timelineDot,
                              isDone && styles.timelineDotDone,
                              isActive && styles.timelineDotActive,
                              isPending && styles.timelineDotPending,
                            ]}
                          >
                            {isDone ? (
                              <Feather name="check" size={12} color={COLORS.ui.white} />
                            ) : isActive ? (
                              <View style={styles.timelinePulse} />
                            ) : null}
                          </View>
                          {idx < FORWARD_FLOW.length - 1 ? (
                            <View
                              style={[
                                styles.timelineLine,
                                isDone && styles.timelineLineDone,
                              ]}
                            />
                          ) : null}
                        </View>
                        <View style={styles.timelineBody}>
                          <Text
                            style={[
                              styles.timelineLabel,
                              isPending && { color: COLORS.text.label },
                            ]}
                          >
                            {meta.label}
                          </Text>
                          {at ? (
                            <Text style={styles.timelineTime}>{formatTime(at)}</Text>
                          ) : (
                            <Text style={styles.timelineTime}>
                              {isPending ? '—' : 'En curso'}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={[styles.card, { borderColor: COLORS.status.error }]}>
                  <Text style={[styles.cardTitle, { color: COLORS.status.error }]}>
                    Cancelada
                  </Text>
                  <Text style={styles.bodyText}>
                    Esta orden fue cancelada
                    {' '}
                    {formatDateTime(lastEventForStatus(order, 'cancelled'))}.
                  </Text>
                </View>
              )}

              {/* Items */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Resumen</Text>
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
                      {item.notes ? (
                        <Text style={styles.itemNotes}>“{item.notes}”</Text>
                      ) : null}
                    </View>
                    <Text style={styles.itemPrice}>{formatMXN(item.lineTotal)}</Text>
                  </View>
                ))}
                <View style={styles.divider} />
                <View style={styles.kvRow}>
                  <Text style={styles.kvKey}>Subtotal</Text>
                  <Text style={styles.kvValue}>{formatMXN(order.subtotal)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatMXN(order.total)}</Text>
                </View>
              </View>

              {/* Payment */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Pago</Text>
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

              {summary?.hasNotes ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Notas</Text>
                  <Text style={styles.bodyText}>{order.notes}</Text>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light.backgroundSecondary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 16,
    backgroundColor: COLORS.ui.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary },
  headerSubtitle: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },

  scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },

  statePad: { paddingVertical: 56, alignItems: 'center', gap: 8, paddingHorizontal: 32 },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  stateBody: { fontSize: 13, color: COLORS.text.secondary, textAlign: 'center' },

  hero: {
    backgroundColor: COLORS.ui.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroBody: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroMeta: {
    fontSize: 12,
    color: COLORS.text.label,
    fontWeight: '600',
  },

  card: {
    backgroundColor: COLORS.ui.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  bodyText: { fontSize: 14, color: COLORS.text.primary, lineHeight: 20 },

  // Timeline
  timelineRow: { flexDirection: 'row', gap: 14, alignItems: 'stretch' },
  timelineCol: { width: 22, alignItems: 'center' },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.light.border,
  },
  timelineDotDone: { backgroundColor: COLORS.brand.tealDark },
  timelineDotActive: {
    backgroundColor: COLORS.brand.tealDark,
    borderWidth: 3,
    borderColor: COLORS.promotions.pillBg,
  },
  timelineDotPending: { backgroundColor: COLORS.light.border },
  timelinePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.ui.white,
  },
  timelineLine: { flex: 1, width: 2, backgroundColor: COLORS.light.border, marginTop: 2 },
  timelineLineDone: { backgroundColor: COLORS.brand.tealDark },
  timelineBody: { flex: 1, paddingBottom: 18 },
  timelineLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  timelineTime: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },

  // Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  itemMods: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  itemNotes: { fontSize: 12, color: COLORS.text.label, marginTop: 4, fontStyle: 'italic' },
  itemPrice: { fontSize: 14, fontWeight: '800', color: COLORS.text.primary },

  divider: { height: 1, backgroundColor: COLORS.light.border, marginVertical: 8 },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  kvKey: { fontSize: 13, color: COLORS.text.secondary, fontWeight: '600' },
  kvValue: { fontSize: 14, color: COLORS.text.primary, fontWeight: '700' },
  kvHighlight: { color: COLORS.brand.tealDark, fontWeight: '800' },

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
    marginBottom: 4,
  },
  paymentMethod: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
});
