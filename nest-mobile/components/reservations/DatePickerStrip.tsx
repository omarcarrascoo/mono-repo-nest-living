import React, { useMemo } from 'react';
import { ScrollView, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';
import { addDays, formatDateKey, getWeekdayIndex } from '@/lib/datetime';

const DAY_LABELS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface DatePickerStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  daysAhead?: number;
  timezone: string;
}

export function DatePickerStrip({
  selectedDate,
  onSelect,
  daysAhead = 14,
  timezone,
}: DatePickerStripProps) {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: daysAhead }).map((_, i) => {
      const d = addDays(today, i);
      const key = formatDateKey(d, timezone);
      const dayNum = Number(key.split('-')[2]);
      const weekday = DAY_LABELS_ES[getWeekdayIndex(d, timezone)];
      return { key, dayNum, weekday };
    });
  }, [daysAhead, timezone]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {days.map(({ key, dayNum, weekday }) => {
        const isActive = key === selectedDate;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.day, isActive && styles.dayActive]}
            onPress={() => onSelect(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dow, isActive && styles.dowActive]}>{weekday}</Text>
            <Text style={[styles.num, isActive && styles.numActive]}>{dayNum}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 10,
  },
  day: {
    width: 56,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayActive: {
    backgroundColor: COLORS.brand.tealDark,
    borderColor: COLORS.brand.tealDark,
  },
  dow: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  dowActive: { color: '#d1fae5' },
  num: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  numActive: { color: '#fff' },
});
