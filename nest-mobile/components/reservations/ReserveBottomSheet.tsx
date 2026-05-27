import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DatePickerStrip } from './DatePickerStrip';
import { SlotGrid } from './SlotGrid';
import { Amenity, AvailabilitySlot, Reservation } from '@/types/api';
import { useAmenitiesStore } from '@/stores/amenities-store';
import { useReservationsStore } from '@/stores/reservations-store';
import {
  formatDateKey,
  formatTime12h,
  formatTimeRange,
  getUserTimezone,
} from '@/lib/datetime';

interface ReserveBottomSheetProps {
  amenity: Amenity;
  visible: boolean;
  onClose: () => void;
  onSuccess: (reservation: Reservation) => void;
  onError: (message: string) => void;
}

export function ReserveBottomSheet({
  amenity,
  visible,
  onClose,
  onSuccess,
  onError,
}: ReserveBottomSheetProps) {
  const tz = amenity.timezone ?? getUserTimezone();
  const today = useMemo(() => formatDateKey(new Date(), tz), [tz]);

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [notes, setNotes] = useState('');

  const fetchAvailability = useAmenitiesStore((s) => s.fetchAvailability);
  const invalidateAvailability = useAmenitiesStore((s) => s.invalidateAvailability);
  const cacheKey = `${amenity.id}::${selectedDate}`;
  const availability = useAmenitiesStore((s) => s.availability[cacheKey]);
  const loadingAvailability = useAmenitiesStore(
    (s) => !!s.availabilityLoading[cacheKey],
  );

  const create = useReservationsStore((s) => s.create);
  const creating = useReservationsStore((s) => s.creating);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setSelectedDate(today);
      setSelectedSlot(null);
      setNotes('');
    }
  }, [visible, today]);

  // Fetch availability when sheet visible or date changes
  useEffect(() => {
    if (!visible) return;
    void fetchAvailability(amenity.id, selectedDate).catch(() => {
      // Si falla, el SlotGrid muestra empty state
    });
  }, [visible, amenity.id, selectedDate, fetchAvailability]);

  // Auto-deselect cuando cambia la lista
  useEffect(() => {
    if (!availability) return;
    if (selectedSlot && !availability.slots.some(
      (s) => s.startTime === selectedSlot.startTime && s.available,
    )) {
      setSelectedSlot(null);
    }
  }, [availability, selectedSlot]);

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    try {
      const r = await create({
        amenityId: amenity.id,
        startTime: selectedSlot.startTime,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      // refresca availability del día por si otros vieron cambios
      invalidateAvailability(amenity.id, selectedDate);
      onSuccess(r);
    } catch (e: any) {
      const msg = e?.message ?? 'No pudimos confirmar tu reserva';
      onError(msg);
      // Re-cargar disponibilidad por si cambió el estado
      invalidateAvailability(amenity.id, selectedDate);
      void fetchAvailability(amenity.id, selectedDate, { force: true });
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeightRatio={0.92}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Reservar {amenity.title}</Text>
          <Text style={styles.subtitle}>Elige fecha y horario</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Feather name="x" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <DatePickerStrip
        selectedDate={selectedDate}
        onSelect={(d) => {
          setSelectedDate(d);
          setSelectedSlot(null);
        }}
        timezone={tz}
        daysAhead={amenity.bookingHorizonDays ?? 14}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>Horarios disponibles</Text>
        <SlotGrid
          slots={availability?.slots ?? []}
          loading={loadingAvailability && !availability}
          selectedStart={selectedSlot?.startTime ?? null}
          onSelect={(s) => setSelectedSlot(s)}
          timezone={tz}
        />

        <View style={styles.notesBlock}>
          <Text style={styles.sectionLabel}>Notas (opcional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="¿Algo que el administrador deba saber?"
            placeholderTextColor="#94a3b8"
            style={styles.notesInput}
            maxLength={500}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerLabel}>Tu reserva</Text>
          <Text style={styles.footerValue} numberOfLines={1}>
            {selectedSlot
              ? `${formatTime12h(new Date(selectedSlot.startTime), tz)} · ${formatTimeRange(
                  selectedSlot.startTime,
                  selectedSlot.endTime,
                  tz,
                )}`
              : 'Selecciona un horario'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.cta,
            (!selectedSlot || creating) && styles.ctaDisabled,
          ]}
          disabled={!selectedSlot || creating}
          onPress={handleConfirm}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Confirmar</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    maxHeight: 360,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesBlock: {
    marginTop: 24,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text.primary,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  footerLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  cta: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.brand.tealDark,
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    backgroundColor: '#cbd5e1',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
