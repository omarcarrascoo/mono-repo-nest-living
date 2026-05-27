import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { Reservation } from '@/types/api';
import {
  formatRelative,
  formatRelativeDay,
  formatShortDate,
  formatTimeRange,
} from '@/lib/datetime';
import { ReservationStatusPill } from './ReservationStatusPill';

interface ReservationCardProps {
  reservation: Reservation;
  timezone: string;
  onPress?: () => void;
}

function buildContextLine(reservation: Reservation, now: number): string | null {
  const start = new Date(reservation.startTime).getTime();
  const end = new Date(reservation.endTime).getTime();

  if (reservation.status === 'cancelled') {
    if (reservation.cancelledAt) {
      return `Cancelada ${formatRelative(new Date(reservation.cancelledAt), new Date(now))}`;
    }
    return 'Cancelada';
  }
  if (reservation.status === 'no_show') return 'No asististe';
  if (reservation.status === 'completed') return 'Completada';
  if (now >= start && now < end) return 'En curso ahora';
  if (now >= end) return `Terminó ${formatRelative(new Date(end), new Date(now))}`;
  return `Empieza ${formatRelative(new Date(start), new Date(now))}`;
}

export function ReservationCard({ reservation, timezone, onPress }: ReservationCardProps) {
  const now = Date.now();
  const startDate = new Date(reservation.startTime);
  const endDate = new Date(reservation.endTime);
  const isPast = endDate.getTime() < now;
  const isLive =
    reservation.status === 'confirmed' &&
    now >= startDate.getTime() &&
    now < endDate.getTime();

  const relativeDay = formatRelativeDay(startDate, timezone);
  const fullDate = formatShortDate(startDate, timezone);
  const showFullDate = relativeDay !== fullDate; // 'Hoy'/'Mañana' → mostramos ambos
  const range = formatTimeRange(reservation.startTime, reservation.endTime, timezone);
  const contextLine = buildContextLine(reservation, now);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <View style={styles.imgWrap}>
        {reservation.amenityImage ? (
          <Image
            source={{ uri: reservation.amenityImage }}
            style={styles.img}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.img, styles.imgFallback]}>
            <Feather name="calendar" size={22} color={COLORS.brand.tealDark} />
          </View>
        )}
        {isLive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.eyebrow}>Reserva en</Text>
            <Text numberOfLines={1} style={styles.title}>
              {reservation.amenityTitle ?? 'Amenidad'}
            </Text>
          </View>
          <ReservationStatusPill status={reservation.status} isPast={isPast} />
        </View>

        <View style={styles.metaRow}>
          <Feather name="calendar" size={13} color={COLORS.text.secondary} />
          <Text numberOfLines={1} style={styles.metaStrong}>
            {showFullDate ? `${relativeDay} · ${fullDate}` : relativeDay}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Feather name="clock" size={13} color={COLORS.text.secondary} />
          <Text style={styles.meta}>{range}</Text>
        </View>

        {reservation.amenityLocation ? (
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={13} color={COLORS.text.secondary} />
            <Text numberOfLines={1} style={styles.meta}>
              {reservation.amenityLocation}
            </Text>
          </View>
        ) : null}

        {reservation.notes ? (
          <View style={styles.notesRow}>
            <Feather name="message-circle" size={13} color={COLORS.text.secondary} />
            <Text numberOfLines={1} style={styles.notes}>
              {reservation.notes}
            </Text>
          </View>
        ) : null}

        {contextLine ? (
          <View style={styles.footer}>
            <Text
              style={[
                styles.contextText,
                isLive && styles.contextLive,
                reservation.status === 'cancelled' && styles.contextMuted,
              ]}
            >
              {contextLine}
            </Text>
            <Feather name="chevron-right" size={16} color={COLORS.text.secondary} />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.ui.white,
    borderRadius: 18,
    padding: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imgWrap: {
    width: 88,
    height: 88,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  imgFallback: {
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  body: { flex: 1, gap: 4 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  titleWrap: {
    flex: 1,
    gap: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  metaStrong: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  notes: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  contextText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand.tealDark,
  },
  contextLive: {
    color: '#dc2626',
  },
  contextMuted: {
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
});
