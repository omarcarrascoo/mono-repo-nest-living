import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '@/constants/theme';
import { AvailabilitySlot } from '@/types/api';
import { formatTime12h } from '@/lib/datetime';

interface SlotGridProps {
  slots: AvailabilitySlot[];
  loading?: boolean;
  selectedStart?: string | null;
  onSelect: (slot: AvailabilitySlot) => void;
  timezone: string;
}

export function SlotGrid({
  slots,
  loading,
  selectedStart,
  onSelect,
  timezone,
}: SlotGridProps) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.brand.tealDark} />
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Sin horarios</Text>
        <Text style={styles.emptyBody}>Este día no tiene horarios disponibles.</Text>
      </View>
    );
  }

  // Si todos están no-disponibles, mostramos mensaje contextual
  const anyAvailable = slots.some((s) => s.available);

  return (
    <View>
      {!anyAvailable && (
        <View style={styles.allTakenBox}>
          <Text style={styles.allTakenText}>
            Todos los horarios de hoy ya están reservados o cerrados. Prueba otro día.
          </Text>
        </View>
      )}
      <View style={styles.grid}>
        {slots.map((s) => {
          const isSelected = selectedStart === s.startTime;
          const label = formatTime12h(new Date(s.startTime), timezone);
          return (
            <TouchableOpacity
              key={s.startTime}
              style={[
                styles.chip,
                !s.available && styles.chipUnavailable,
                isSelected && styles.chipSelected,
              ]}
              disabled={!s.available}
              onPress={() => onSelect(s)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  !s.available && styles.chipUnavailableText,
                  isSelected && styles.chipSelectedText,
                ]}
              >
                {label}
              </Text>
              {s.capacity > 1 && s.available ? (
                <Text style={styles.chipMeta}>
                  {Math.max(0, s.capacity - s.takenCount)} libre{s.capacity - s.takenCount === 1 ? '' : 's'}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  emptyBody: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  allTakenBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  allTakenText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    minWidth: 88,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  chipUnavailable: {
    backgroundColor: '#f8fafc',
    opacity: 0.55,
  },
  chipSelected: {
    backgroundColor: '#ccfbf1',
    borderColor: COLORS.brand.tealDark,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  chipUnavailableText: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  chipSelectedText: {
    color: COLORS.brand.tealDark,
  },
  chipMeta: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
});
