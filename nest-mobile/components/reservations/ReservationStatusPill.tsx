import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReservationStatus } from '@/types/api';

interface Props {
  status: ReservationStatus;
  isPast?: boolean;
}

export function ReservationStatusPill({ status, isPast }: Props) {
  let label = 'Confirmada';
  let bg = '#dcfce7';
  let fg = '#166534';

  if (status === 'cancelled') {
    label = 'Cancelada';
    bg = '#fee2e2';
    fg = '#991b1b';
  } else if (status === 'completed' || (status === 'confirmed' && isPast)) {
    label = 'Completada';
    bg = '#e0e7ff';
    fg = '#3730a3';
  } else if (status === 'no_show') {
    label = 'No asistió';
    bg = '#fef3c7';
    fg = '#78350f';
  }

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});
