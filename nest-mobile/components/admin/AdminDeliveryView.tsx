import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { useAdminStore } from '@/stores/admin-store';
import { Order, OrderListFilter, OrderStatus } from '@/types/api';
import { AdminProductsManager } from './AdminProductsManager';

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'on_the_way',
  on_the_way: 'delivered',
  delivered: null,
  cancelled: null,
};

const STATUS_META: Record<OrderStatus, { label: string; bg: string; fg: string; nextLabel?: string }> = {
  pending: { label: 'Pendiente', bg: '#fef3c7', fg: '#92400e', nextLabel: 'Confirmar' },
  confirmed: { label: 'Confirmado', bg: '#dbeafe', fg: '#1d4ed8', nextLabel: 'En cocina' },
  preparing: { label: 'En cocina', bg: '#fed7aa', fg: '#c2410c', nextLabel: 'Salir' },
  on_the_way: { label: 'En camino', bg: '#e0e7ff', fg: '#4338ca', nextLabel: 'Entregado' },
  delivered: { label: 'Entregado', bg: '#dcfce7', fg: '#166534' },
  cancelled: { label: 'Cancelado', bg: '#fee2e2', fg: '#991b1b' },
};

const FILTERS: { key: OrderListFilter; label: string }[] = [
  { key: 'active', label: 'Activos' },
  { key: 'completed', label: 'Completados' },
  { key: 'all', label: 'Todos' },
];

function fmtMoney(n: number) {
  return `$${(n ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function AdminDeliveryView() {
  const orders = useAdminStore((s) => s.orders);
  const fetchOrders = useAdminStore((s) => s.fetchOrders);
  const refreshOrders = useAdminStore((s) => s.refreshOrders);
  const setFilter = useAdminStore((s) => s.setOrdersFilter);
  const advanceOrder = useAdminStore((s) => s.advanceOrder);
  const cancelOrder = useAdminStore((s) => s.cancelOrder);
  const updating = useAdminStore((s) => s.updatingOrder);

  const [showProducts, setShowProducts] = useState(false);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const stats = useMemo(() => {
    const items = orders.items ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    let active = 0;
    let todayCount = 0;
    let revenue = 0;
    for (const o of items) {
      if (o.status !== 'delivered' && o.status !== 'cancelled') active += 1;
      const created = new Date(o.createdAt).getTime();
      if (created >= todayMs) {
        todayCount += 1;
        if (o.status === 'delivered') revenue += o.total ?? 0;
      }
    }
    return { active, todayCount, revenue };
  }, [orders.items]);

  const handleAdvance = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      await advanceOrder(order.id, next);
    } catch (e: any) {
      Alert.alert('No se pudo actualizar', e?.message ?? 'Intenta de nuevo.');
    }
  };

  const handleCancel = (order: Order) => {
    Alert.alert(
      'Cancelar orden',
      `Esto cancelará la orden #${order.orderNumber}. ¿Continuar?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(order.id);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo cancelar.');
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={orders.refreshing}
            onRefresh={() => void refreshOrders()}
            tintColor={COLORS.brand.tealDark}
          />
        }
      >
        <View style={styles.kpiRow}>
          <KpiCard label="Activos" value={String(stats.active)} icon="zap" tint="#0f766e" bg="#ccfbf1" />
          <KpiCard label="Hoy" value={String(stats.todayCount)} icon="calendar" tint="#1d4ed8" bg="#dbeafe" />
          <KpiCard
            label="Ingreso"
            value={fmtMoney(stats.revenue)}
            icon="dollar-sign"
            tint="#9333ea"
            bg="#f3e8ff"
          />
        </View>

        <TouchableOpacity
          style={styles.productsBtn}
          onPress={() => setShowProducts(true)}
          activeOpacity={0.85}
        >
          <View style={styles.productsIcon}>
            <Feather name="package" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.productsLabel}>Gestionar productos</Text>
            <Text style={styles.productsSub}>Crear, editar o quitar del menú</Text>
          </View>
          <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Pedidos</Text>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = orders.filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {orders.loading && orders.items.length === 0 ? (
          <View style={styles.statePad}>
            <ActivityIndicator color={COLORS.brand.tealDark} />
          </View>
        ) : orders.error && orders.items.length === 0 ? (
          <View style={styles.statePad}>
            <Feather name="alert-circle" size={24} color={COLORS.status.error} />
            <Text style={styles.stateTitle}>Error al cargar</Text>
            <Text style={styles.stateBody}>{orders.error}</Text>
          </View>
        ) : orders.items.length === 0 ? (
          <View style={styles.statePad}>
            <Feather name="shopping-bag" size={28} color={COLORS.text.label} />
            <Text style={styles.stateTitle}>
              {orders.filter === 'active'
                ? 'Sin pedidos activos'
                : orders.filter === 'completed'
                  ? 'Sin pedidos completados'
                  : 'Aún no hay pedidos'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {orders.items.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                updating={!!updating[o.id]}
                onAdvance={() => handleAdvance(o)}
                onCancel={() => handleCancel(o)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AdminProductsManager visible={showProducts} onClose={() => setShowProducts(false)} />
    </>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tint,
  bg,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  tint: string;
  bg: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={16} color={tint} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function OrderRow({
  order,
  updating,
  onAdvance,
  onCancel,
}: {
  order: Order;
  updating: boolean;
  onAdvance: () => void;
  onCancel: () => void;
}) {
  const meta = STATUS_META[order.status];
  const next = NEXT_STATUS[order.status];
  const canAdvance = !!next && !updating;
  const canCancel =
    order.status !== 'delivered' && order.status !== 'cancelled' && !updating;

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNum}>#{order.orderNumber}</Text>
          <Text style={styles.orderTime}>{fmtTime(order.createdAt)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.badgeText, { color: meta.fg }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.orderBody}>
        {order.items.slice(0, 3).map((item, idx) => (
          <Text key={`${item.lineId}-${idx}`} style={styles.itemLine} numberOfLines={1}>
            {item.quantity}× {item.name}
          </Text>
        ))}
        {order.items.length > 3 ? (
          <Text style={styles.itemMore}>+{order.items.length - 3} más</Text>
        ) : null}
      </View>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.orderTotalLabel}>Total</Text>
          <Text style={styles.orderTotal}>{fmtMoney(order.total)}</Text>
        </View>
        <View style={styles.actionRow}>
          {canCancel ? (
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={updating}>
              <Feather name="x" size={14} color="#dc2626" />
            </TouchableOpacity>
          ) : null}
          {canAdvance && next ? (
            <TouchableOpacity
              style={[styles.advanceBtn, updating && { opacity: 0.6 }]}
              onPress={onAdvance}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.advanceBtnText}>{meta.nextLabel}</Text>
                  <Feather name="arrow-right" size={14} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingBottom: 100, gap: 16 },

  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    gap: 6,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: { fontSize: 22, fontWeight: '800', color: COLORS.text.primary },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  productsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.brand.tealDark,
    borderRadius: 18,
    padding: 14,
  },
  productsIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productsLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  productsSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 4,
    marginTop: 4,
  },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  filterChipActive: { backgroundColor: COLORS.brand.tealDark, borderColor: COLORS.brand.tealDark },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.text.primary },
  filterTextActive: { color: '#fff' },

  list: { gap: 10 },
  orderCard: {
    backgroundColor: COLORS.light.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    gap: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNum: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary },
  orderTime: { fontSize: 11, color: COLORS.text.label, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderBody: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    gap: 2,
  },
  itemLine: { fontSize: 13, color: COLORS.text.primary },
  itemMore: { fontSize: 12, color: COLORS.text.label, marginTop: 2, fontStyle: 'italic' },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotalLabel: { fontSize: 11, color: COLORS.text.label, fontWeight: '600' },
  orderTotal: { fontSize: 17, fontWeight: '800', color: COLORS.text.primary, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  cancelBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.brand.tealDark,
  },
  advanceBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  statePad: { paddingTop: 32, paddingBottom: 16, alignItems: 'center', gap: 8 },
  stateTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary },
  stateBody: { fontSize: 13, color: COLORS.text.secondary, textAlign: 'center', paddingHorizontal: 24 },
});
