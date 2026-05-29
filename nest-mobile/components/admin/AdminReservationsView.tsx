import React, { useEffect, useState } from 'react';
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
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { COLORS } from '@/constants/theme';
import { useAdminStore } from '@/stores/admin-store';
import { AdminReservation } from '@/types/api';
import { formatRelative, formatShortDate, formatTimeRange } from '@/lib/datetime';
import { AdminReservationsDashboard } from './AdminReservationsDashboard';
import { AdminAmenitiesManager } from './AdminAmenitiesManager';

type FilterKey = 'upcoming' | 'past' | 'cancelled' | 'all';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'upcoming', label: 'Próximas' },
  { key: 'past', label: 'Pasadas' },
  { key: 'cancelled', label: 'Canceladas' },
  { key: 'all', label: 'Todas' },
];

interface AdminReservationsViewProps {
  timezone: string;
}

export function AdminReservationsView({ timezone }: AdminReservationsViewProps) {
  const stats = useAdminStore((s) => s.stats);
  const statsLoading = useAdminStore((s) => s.statsLoading);
  const statsError = useAdminStore((s) => s.statsError);
  const fetchStats = useAdminStore((s) => s.fetchStats);

  const reservationsById = useAdminStore((s) => s.reservationsById);
  const pages = useAdminStore((s) => s.reservationsPage);
  const fetchReservations = useAdminStore((s) => s.fetchReservations);
  const cancelReservation = useAdminStore((s) => s.cancelReservation);
  const cancelling = useAdminStore((s) => s.cancellingReservation);

  const [filter, setFilter] = useState<FilterKey>('upcoming');
  const [showAmenities, setShowAmenities] = useState(false);

  const page = pages[filter];

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!page.loaded && !page.loading) {
      void fetchReservations(filter);
    }
  }, [filter, page.loaded, page.loading, fetchReservations]);

  const data = page.ids.map((id) => reservationsById[id]).filter(Boolean);

  const handleCancel = (r: AdminReservation) => {
    Alert.alert(
      'Cancelar reserva',
      `Esto cancelará la reserva de ${r.user?.fullName ?? 'este usuario'}. ¿Continuar?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelReservation(r.id);
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
            refreshing={page.refreshing || statsLoading}
            onRefresh={() => {
              void fetchStats({ force: true });
              void fetchReservations(filter, { refresh: true });
            }}
            tintColor={COLORS.brand.tealDark}
          />
        }
      >
        <AdminReservationsDashboard stats={stats} loading={statsLoading} error={statsError} />

        <TouchableOpacity
          style={styles.amenitiesBtn}
          onPress={() => setShowAmenities(true)}
          activeOpacity={0.85}
        >
          <View style={styles.amenitiesIcon}>
            <Feather name="grid" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.amenitiesLabel}>Gestionar amenidades</Text>
            <Text style={styles.amenitiesSub}>Crear, editar o eliminar espacios</Text>
          </View>
          <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Reservas</Text>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
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

        {page.loading && data.length === 0 ? (
          <View style={styles.statePad}>
            <ActivityIndicator color={COLORS.brand.tealDark} />
          </View>
        ) : page.error && data.length === 0 ? (
          <View style={styles.statePad}>
            <Text style={styles.stateTitle}>Error al cargar</Text>
            <Text style={styles.stateBody}>{page.error}</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.statePad}>
            <Feather name="calendar" size={28} color={COLORS.text.label} />
            <Text style={styles.stateTitle}>
              {filter === 'upcoming'
                ? 'Sin reservas próximas'
                : filter === 'past'
                  ? 'Sin reservas pasadas'
                  : filter === 'cancelled'
                    ? 'Sin reservas canceladas'
                    : 'Aún no hay reservas'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {data.map((r) => (
              <AdminReservationRow
                key={r.id}
                reservation={r}
                timezone={timezone}
                cancelling={!!cancelling[r.id]}
                onCancel={() => handleCancel(r)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AdminAmenitiesManager
        visible={showAmenities}
        onClose={() => setShowAmenities(false)}
      />
    </>
  );
}

function AdminReservationRow({
  reservation,
  timezone,
  cancelling,
  onCancel,
}: {
  reservation: AdminReservation;
  timezone: string;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const start = new Date(reservation.startTime);
  const range = formatTimeRange(reservation.startTime, reservation.endTime, timezone);
  const date = formatShortDate(start, timezone);
  const isCancellable = reservation.status === 'confirmed';
  const status = reservation.status;

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={styles.rowAuthor}>
          <Avatar
            uri={reservation.user?.avatar}
            name={reservation.user?.fullName}
            size={38}
            rounded={12}
          />
          <View>
            <Text style={styles.rowName} numberOfLines={1}>
              {reservation.user?.fullName ?? 'Usuario'}
            </Text>
            <Text style={styles.rowUnit}>
              {reservation.user?.unitNumber ?? 'Sin unidad'}
            </Text>
          </View>
        </View>
        <StatusBadge status={status} />
      </View>

      <View style={styles.rowDivider} />

      <Text style={styles.rowAmenity} numberOfLines={1}>
        {reservation.amenityTitle ?? 'Amenidad'}
      </Text>
      <View style={styles.rowMetaRow}>
        <Feather name="calendar" size={12} color={COLORS.text.label} />
        <Text style={styles.rowMeta}>{date}</Text>
        <Feather name="clock" size={12} color={COLORS.text.label} />
        <Text style={styles.rowMeta}>{range}</Text>
      </View>

      {reservation.notes ? (
        <Text style={styles.rowNotes} numberOfLines={2}>
          “{reservation.notes}”
        </Text>
      ) : null}

      {isCancellable ? (
        <TouchableOpacity
          style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
          onPress={onCancel}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color="#dc2626" />
          ) : (
            <>
              <Feather name="x-circle" size={14} color="#dc2626" />
              <Text style={styles.cancelText}>Cancelar reserva</Text>
            </>
          )}
        </TouchableOpacity>
      ) : reservation.cancelledAt ? (
        <Text style={styles.cancelMeta}>
          Cancelada {formatRelative(new Date(reservation.cancelledAt), new Date())}
        </Text>
      ) : null}
    </View>
  );
}

function StatusBadge({ status }: { status: AdminReservation['status'] }) {
  const map: Record<AdminReservation['status'], { label: string; bg: string; fg: string }> = {
    confirmed: { label: 'Confirmada', bg: '#dcfce7', fg: '#166534' },
    cancelled: { label: 'Cancelada', bg: '#fee2e2', fg: '#991b1b' },
    completed: { label: 'Completada', bg: '#e0e7ff', fg: '#3730a3' },
    no_show: { label: 'No asistió', bg: '#fef3c7', fg: '#92400e' },
  };
  const info = map[status] ?? { label: status, bg: '#e2e8f0', fg: COLORS.text.primary };
  return (
    <View style={[styles.badge, { backgroundColor: info.bg }]}>
      <Text style={[styles.badgeText, { color: info.fg }]}>{info.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingBottom: 100, gap: 16 },

  amenitiesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.brand.tealDark,
    borderRadius: 18,
    padding: 14,
  },
  amenitiesIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenitiesLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  amenitiesSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  listHeader: { marginTop: 6 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
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
  row: {
    backgroundColor: COLORS.light.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    gap: 8,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  rowName: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary },
  rowUnit: { fontSize: 11, color: COLORS.text.label, marginTop: 2 },
  rowDivider: { height: 1, backgroundColor: COLORS.light.border },
  rowAmenity: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  rowMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowMeta: { fontSize: 12, color: COLORS.text.label, fontWeight: '500', marginRight: 8 },
  rowNotes: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
  },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginTop: 4,
  },
  cancelText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
  cancelMeta: { fontSize: 11, color: COLORS.text.label, fontStyle: 'italic' },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  statePad: { paddingTop: 32, paddingBottom: 16, alignItems: 'center', gap: 8 },
  stateTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary },
  stateBody: { fontSize: 13, color: COLORS.text.secondary, textAlign: 'center', paddingHorizontal: 24 },
});
