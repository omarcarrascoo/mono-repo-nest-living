import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';
import { useReservationsStore } from '@/stores/reservations-store';
import { useAmenitiesStore } from '@/stores/amenities-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  formatDateKey,
  formatRelativeDay,
  formatTimeRange,
  getUserTimezone,
} from '@/lib/datetime';
import { ReservationStatusPill } from '@/components/reservations/ReservationStatusPill';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ResultModal } from '@/components/ui/ResultModal';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DatePickerStrip } from '@/components/reservations/DatePickerStrip';
import { SlotGrid } from '@/components/reservations/SlotGrid';
import { AvailabilitySlot, Reservation } from '@/types/api';

type FeedbackState =
  | { kind: 'cancelled' }
  | { kind: 'modified'; reservation: Reservation }
  | { kind: 'error'; message: string }
  | null;

export default function ReservationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = String(params.id ?? '');

  const user = useAuthStore((s) => s.user);
  const tz = user?.timezone ?? getUserTimezone();

  const cached = useReservationsStore((s) => (id ? s.byId[id] : undefined));
  const fetchOne = useReservationsStore((s) => s.fetchOne);
  const cancel = useReservationsStore((s) => s.cancel);
  const modify = useReservationsStore((s) => s.modify);
  const cancelling = useReservationsStore((s) => !!s.cancelling[id]);
  const modifying = useReservationsStore((s) => !!s.modifying[id]);

  const fetchAvailability = useAmenitiesStore((s) => s.fetchAvailability);
  const invalidateAvailability = useAmenitiesStore((s) => s.invalidateAvailability);

  const [reservation, setReservation] = useState<Reservation | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  // Modify sheet state
  const [modifyVisible, setModifyVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  useEffect(() => {
    if (cached) {
      setReservation(cached);
      setLoading(false);
      return;
    }
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    fetchOne(id)
      .then((r) => {
        if (!cancelled) {
          setReservation(r);
          setLoading(false);
        }
      })
      .catch((e: any) => {
        if (!cancelled) {
          setError(e?.message ?? 'No pudimos cargar la reserva');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, cached, fetchOne]);

  const isUpcoming = useMemo(() => {
    if (!reservation) return false;
    return (
      reservation.status === 'confirmed' &&
      new Date(reservation.startTime).getTime() > Date.now()
    );
  }, [reservation]);

  const cacheKey = reservation && selectedDate ? `${reservation.amenityId}::${selectedDate}` : '';
  const availability = useAmenitiesStore((s) =>
    cacheKey ? s.availability[cacheKey] : undefined,
  );
  const loadingAvailability = useAmenitiesStore((s) =>
    cacheKey ? !!s.availabilityLoading[cacheKey] : false,
  );

  const openModify = () => {
    if (!reservation) return;
    const today = formatDateKey(new Date(reservation.startTime), tz);
    setSelectedDate(today);
    setSelectedSlot(null);
    setModifyVisible(true);
  };

  useEffect(() => {
    if (!modifyVisible || !reservation || !selectedDate) return;
    void fetchAvailability(reservation.amenityId, selectedDate).catch(() => {});
  }, [modifyVisible, reservation, selectedDate, fetchAvailability]);

  const handleCancel = async () => {
    if (!reservation) return;
    try {
      await cancel(reservation.id);
      invalidateAvailability(reservation.amenityId);
      setConfirmCancel(false);
      setFeedback({ kind: 'cancelled' });
    } catch (e: any) {
      setConfirmCancel(false);
      setFeedback({ kind: 'error', message: e?.message ?? 'No pudimos cancelar' });
    }
  };

  const handleConfirmModify = async () => {
    if (!reservation || !selectedSlot) return;
    try {
      const r = await modify(reservation.id, { startTime: selectedSlot.startTime });
      invalidateAvailability(reservation.amenityId);
      setReservation(r);
      setModifyVisible(false);
      setFeedback({ kind: 'modified', reservation: r });
    } catch (e: any) {
      setModifyVisible(false);
      setFeedback({ kind: 'error', message: e?.message ?? 'No pudimos modificar' });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={COLORS.brand.tealDark} />
      </View>
    );
  }

  if (error || !reservation) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorTitle}>No pudimos cargar la reserva</Text>
        {error ? <Text style={styles.errorBody}>{error}</Text> : null}
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startDate = new Date(reservation.startTime);
  const isPast = startDate.getTime() < Date.now();
  const dayLabel = formatRelativeDay(startDate, tz);
  const range = formatTimeRange(reservation.startTime, reservation.endTime, tz);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background.base} />

      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          {reservation.amenityImage ? (
            <Image
              source={{ uri: reservation.amenityImage }}
              style={styles.heroImg}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.heroImg, styles.heroFallback]}>
              <Feather name="calendar" size={32} color={COLORS.brand.tealDark} />
            </View>
          )}
          <View style={styles.heroBody}>
            <ReservationStatusPill status={reservation.status} isPast={isPast} />
            <Text style={styles.title}>{reservation.amenityTitle ?? 'Reserva'}</Text>
            {reservation.amenityLocation ? (
              <Text style={styles.location}>{reservation.amenityLocation}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cuándo</Text>
          <View style={styles.row}>
            <Feather name="calendar" size={16} color={COLORS.brand.tealDark} />
            <Text style={styles.rowText}>{dayLabel}</Text>
          </View>
          <View style={styles.row}>
            <Feather name="clock" size={16} color={COLORS.brand.tealDark} />
            <Text style={styles.rowText}>{range}</Text>
          </View>
        </View>

        {reservation.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notas</Text>
            <Text style={styles.notesText}>{reservation.notes}</Text>
          </View>
        ) : null}

        {isUpcoming && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPrimary]}
              onPress={openModify}
              disabled={modifying}
            >
              {modifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="edit-2" size={16} color="#fff" />
                  <Text style={styles.actionPrimaryText}>Modificar horario</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionDanger]}
              onPress={() => setConfirmCancel(true)}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color="#dc2626" />
              ) : (
                <>
                  <Feather name="x-circle" size={16} color="#dc2626" />
                  <Text style={styles.actionDangerText}>Cancelar reserva</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.viewAmenity}
          onPress={() => router.push(`/amenity/${reservation.amenityId}`)}
        >
          <Feather name="external-link" size={14} color={COLORS.brand.tealDark} />
          <Text style={styles.viewAmenityText}>Ver detalle de la amenidad</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={confirmCancel}
        title="¿Cancelar tu reserva?"
        message="Liberaremos el horario para otros vecinos. Esta acción no se puede deshacer."
        confirmText="Sí, cancelar"
        cancelText="No"
        destructive
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />

      <BottomSheet visible={modifyVisible} onClose={() => setModifyVisible(false)} maxHeightRatio={0.9}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Cambiar horario</Text>
          <TouchableOpacity
            onPress={() => setModifyVisible(false)}
            style={styles.sheetClose}
          >
            <Feather name="x" size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
        <DatePickerStrip
          selectedDate={selectedDate ?? formatDateKey(new Date(), tz)}
          onSelect={(d) => {
            setSelectedDate(d);
            setSelectedSlot(null);
          }}
          timezone={tz}
        />
        <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={styles.sheetBody}>
          <SlotGrid
            slots={availability?.slots ?? []}
            loading={loadingAvailability && !availability}
            selectedStart={selectedSlot?.startTime ?? null}
            onSelect={(s) => setSelectedSlot(s)}
            timezone={tz}
          />
        </ScrollView>
        <View style={styles.sheetFooter}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionPrimary,
              (!selectedSlot || modifying) && { opacity: 0.6 },
            ]}
            disabled={!selectedSlot || modifying}
            onPress={handleConfirmModify}
          >
            {modifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionPrimaryText}>Guardar cambio</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {feedback?.kind === 'cancelled' && (
        <ResultModal
          visible
          variant="info"
          title="Reserva cancelada"
          message="Hemos liberado tu horario."
          primaryLabel="Volver"
          onPrimary={() => {
            setFeedback(null);
            router.back();
          }}
          onClose={() => setFeedback(null)}
        />
      )}

      {feedback?.kind === 'modified' && (
        <ResultModal
          visible
          variant="success"
          title="Horario actualizado"
          message="Tu reserva fue actualizada correctamente."
          primaryLabel="Listo"
          onPrimary={() => setFeedback(null)}
          onClose={() => setFeedback(null)}
        />
      )}

      {feedback?.kind === 'error' && (
        <ResultModal
          visible
          variant="error"
          title="Algo salió mal"
          message={feedback.message}
          primaryLabel="Cerrar"
          onPrimary={() => setFeedback(null)}
          onClose={() => setFeedback(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.base },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  headerSafe: { backgroundColor: COLORS.background.base },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    backgroundColor: COLORS.ui.lightSheet,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingBottom: 120,
    minHeight: '100%',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.ui.white,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  heroImg: { width: 88, height: 88, borderRadius: 16 },
  heroFallback: {
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: { flex: 1, gap: 6 },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  location: { fontSize: 13, color: COLORS.text.secondary },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rowText: {
    fontSize: 15,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionPrimary: { backgroundColor: COLORS.brand.tealDark },
  actionPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  actionDanger: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  actionDangerText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
  viewAmenity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  viewAmenityText: { color: COLORS.brand.tealDark, fontWeight: '700' },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.brand.teal,
  },
  errorBtnText: { color: '#fff', fontWeight: '700' },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text.primary },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  sheetFooter: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
});
