import React, { useEffect } from 'react';
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
import { useRouter, Stack } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { useOrdersStore } from '@/stores/orders-store';
import { formatMXN } from '@/lib/currency';
import { Order, OrderListFilter, OrderStatus } from '@/types/api';

const FILTER_TABS: { id: OrderListFilter; label: string }[] = [
  { id: 'active', label: 'Activos' },
  { id: 'completed', label: 'Anteriores' },
  { id: 'all', label: 'Todos' },
];

const STATUS_COPY: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Recibido', color: COLORS.text.secondary, bg: COLORS.light.border },
  confirmed: {
    label: 'Confirmado',
    color: COLORS.brand.tealDark,
    bg: COLORS.promotions.pillBg,
  },
  preparing: {
    label: 'Preparando',
    color: COLORS.brand.tealDark,
    bg: COLORS.promotions.pillBg,
  },
  on_the_way: {
    label: 'En camino',
    color: COLORS.brand.tealDark,
    bg: COLORS.promotions.pillBg,
  },
  delivered: { label: 'Entregado', color: COLORS.status.success, bg: '#d1fae5' },
  cancelled: { label: 'Cancelado', color: COLORS.status.error, bg: '#fee2e2' },
};

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

function summarize(o: Order): string {
  const total = o.items.reduce((s, i) => s + i.quantity, 0);
  if (total === 0) return 'Sin items';
  const head = o.items[0];
  if (o.items.length === 1) {
    return `${total}x ${head.name}`;
  }
  return `${total} items · ${head.name}…`;
}

export default function MyOrdersScreen() {
  const router = useRouter();
  const items = useOrdersStore((s) => s.items);
  const filter = useOrdersStore((s) => s.filter);
  const loading = useOrdersStore((s) => s.loading);
  const refreshing = useOrdersStore((s) => s.refreshing);
  const error = useOrdersStore((s) => s.error);
  const fetchMine = useOrdersStore((s) => s.fetchMine);
  const refreshMine = useOrdersStore((s) => s.refreshMine);
  const setFilter = useOrdersStore((s) => s.setFilter);

  useEffect(() => {
    void fetchMine({ force: true });
  }, [fetchMine, filter]);

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
            <Text style={styles.headerTitle}>Mis pedidos</Text>
            <Text style={styles.headerSubtitle}>Historial y pedidos en curso</Text>
          </View>
        </View>

        <View style={styles.tabsRow}>
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setFilter(tab.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshMine}
              tintColor={COLORS.brand.tealDark}
            />
          }
        >
          {loading && items.length === 0 ? (
            <View style={styles.statePad}>
              <ActivityIndicator color={COLORS.brand.tealDark} />
            </View>
          ) : error && items.length === 0 ? (
            <View style={styles.statePad}>
              <Feather name="alert-circle" size={28} color={COLORS.status.error} />
              <Text style={styles.stateTitle}>No pudimos cargar tus pedidos</Text>
              <Text style={styles.stateBody}>{error}</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.statePad}>
              <Feather name="shopping-bag" size={36} color={COLORS.text.label} />
              <Text style={styles.stateTitle}>
                {filter === 'active'
                  ? 'No tienes pedidos activos'
                  : filter === 'completed'
                    ? 'No tienes pedidos anteriores'
                    : 'No has hecho ningún pedido'}
              </Text>
              <Text style={styles.stateBody}>
                Pide algo desde el menú de Delivery y aparecerá aquí.
              </Text>
              <TouchableOpacity
                style={styles.cta}
                onPress={() => router.push('/(tabs)/delivery' as never)}
              >
                <Text style={styles.ctaText}>Ir al menú</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {items.map((order) => {
                const meta = STATUS_COPY[order.status] ?? STATUS_COPY.pending;
                return (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.row}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/orders/${order.id}` as never)}
                  >
                    <View style={styles.rowHead}>
                      <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                      <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.badgeText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.orderSummary}>{summarize(order)}</Text>
                    <View style={styles.rowFoot}>
                      <Text style={styles.orderDate}>{formatDateTime(order.createdAt)}</Text>
                      <Text style={styles.orderTotal}>{formatMXN(order.total)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },

  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.ui.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  tabActive: {
    backgroundColor: COLORS.brand.tealDark,
    borderColor: COLORS.brand.tealDark,
  },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.text.secondary },
  tabTextActive: { color: COLORS.ui.white },

  scrollContent: { padding: 16, paddingBottom: 40 },
  list: { gap: 10 },

  row: {
    backgroundColor: COLORS.ui.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderNumber: { fontSize: 15, fontWeight: '800', color: COLORS.text.primary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },

  orderSummary: { fontSize: 13, color: COLORS.text.secondary, marginBottom: 8 },
  rowFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: { fontSize: 12, color: COLORS.text.label, fontWeight: '600' },
  orderTotal: { fontSize: 15, fontWeight: '800', color: COLORS.text.primary },

  statePad: { paddingVertical: 56, alignItems: 'center', gap: 8, paddingHorizontal: 32 },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  stateBody: { fontSize: 13, color: COLORS.text.secondary, textAlign: 'center' },
  cta: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: COLORS.brand.tealDark,
  },
  ctaText: { color: COLORS.ui.white, fontWeight: '800', fontSize: 14 },
});
