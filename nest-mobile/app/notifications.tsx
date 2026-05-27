import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { useNotificationsStore } from '@/stores/notifications-store';
import { Notification, NotificationKind } from '@/types/api';

const KIND_META: Record<
  NotificationKind,
  { icon: keyof typeof Feather.glyphMap; tint: string; bg: string; label: string }
> = {
  reservation_created: {
    icon: 'calendar',
    tint: COLORS.brand.tealDark,
    bg: COLORS.promotions.pillBg,
    label: 'Reservación',
  },
  reservation_cancelled: {
    icon: 'x-circle',
    tint: COLORS.status.error,
    bg: '#fee2e2',
    label: 'Reservación cancelada',
  },
  reservation_reminder: {
    icon: 'bell',
    tint: COLORS.status.warning,
    bg: '#fef3c7',
    label: 'Recordatorio',
  },
  admin_alert: {
    icon: 'alert-triangle',
    tint: COLORS.status.warning,
    bg: '#fef3c7',
    label: 'Aviso',
  },
  order_created: {
    icon: 'shopping-bag',
    tint: COLORS.brand.tealDark,
    bg: COLORS.promotions.pillBg,
    label: 'Pedido',
  },
  order_status_update: {
    icon: 'truck',
    tint: COLORS.brand.tealDark,
    bg: COLORS.promotions.pillBg,
    label: 'Pedido',
  },
  order_cancelled: {
    icon: 'x-circle',
    tint: COLORS.status.error,
    bg: '#fee2e2',
    label: 'Pedido cancelado',
  },
  order_admin_alert: {
    icon: 'alert-circle',
    tint: COLORS.status.info,
    bg: '#e0f2fe',
    label: 'Cocina',
  },
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.round(hr / 24);
  if (day < 7) return `hace ${day} d`;
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function getOrderId(n: Notification): string | null {
  if (!n.data) return null;
  const v = (n.data as Record<string, unknown>).orderId;
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function getReservationId(n: Notification): string | null {
  if (!n.data) return null;
  const v = (n.data as Record<string, unknown>).reservationId;
  return typeof v === 'string' && v.length > 0 ? v : null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const items = useNotificationsStore((s) => s.items);
  const loading = useNotificationsStore((s) => s.loading);
  const refreshing = useNotificationsStore((s) => s.refreshing);
  const error = useNotificationsStore((s) => s.inboxError);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const fetchInbox = useNotificationsStore((s) => s.fetchInbox);
  const refreshInbox = useNotificationsStore((s) => s.refreshInbox);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  useEffect(() => {
    void fetchInbox({ force: true });
  }, [fetchInbox]);

  const handlePress = async (n: Notification) => {
    if (!n.read) void markRead(n.id);
    const orderId = getOrderId(n);
    if (orderId) {
      router.push(`/orders/${orderId}` as never);
      return;
    }
    const reservationId = getReservationId(n);
    if (reservationId) {
      router.push(`/reservation/${reservationId}` as never);
    }
  };

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
            <Text style={styles.title}>Notificaciones</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0
                ? `${unreadCount} sin leer`
                : 'Estás al corriente'}
            </Text>
          </View>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead} hitSlop={8}>
              <Text style={styles.markAll}>Marcar todas</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshInbox}
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
              <Text style={styles.stateTitle}>No pudimos cargar tu inbox</Text>
              <Text style={styles.stateBody}>{error}</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.statePad}>
              <Feather name="inbox" size={36} color={COLORS.text.label} />
              <Text style={styles.stateTitle}>Tu inbox está vacío</Text>
              <Text style={styles.stateBody}>
                Aquí verás avisos sobre tus reservas y pedidos.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {items.map((n) => {
                const meta = KIND_META[n.kind] ?? KIND_META.admin_alert;
                return (
                  <TouchableOpacity
                    key={n.id}
                    style={[styles.row, !n.read && styles.rowUnread]}
                    activeOpacity={0.85}
                    onPress={() => handlePress(n)}
                  >
                    <View style={[styles.iconBubble, { backgroundColor: meta.bg }]}>
                      <Feather name={meta.icon} size={18} color={meta.tint} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.rowHead}>
                        <Text style={styles.rowKind}>{meta.label}</Text>
                        <Text style={styles.rowTime}>{formatRelative(n.createdAt)}</Text>
                      </View>
                      <Text style={[styles.rowTitle, !n.read && styles.rowTitleUnread]}>
                        {n.title}
                      </Text>
                      {n.body ? <Text style={styles.rowBody}>{n.body}</Text> : null}
                    </View>
                    {!n.read ? <View style={styles.unreadDot} /> : null}
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
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  markAll: { fontSize: 13, fontWeight: '700', color: COLORS.brand.tealDark },

  scrollContent: { paddingVertical: 12 },
  list: { gap: 8, paddingHorizontal: 16 },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.ui.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  rowUnread: {
    borderColor: COLORS.brand.teal,
    backgroundColor: '#f0fdfa',
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  rowKind: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rowTime: { fontSize: 11, color: COLORS.text.label },
  rowTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary, marginTop: 2 },
  rowTitleUnread: { color: COLORS.text.primary, fontWeight: '800' },
  rowBody: { fontSize: 13, color: COLORS.text.secondary, marginTop: 4, lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brand.teal,
    marginTop: 6,
  },

  statePad: { paddingVertical: 56, alignItems: 'center', gap: 8, paddingHorizontal: 32 },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  stateBody: { fontSize: 13, color: COLORS.text.secondary, textAlign: 'center' },
});
