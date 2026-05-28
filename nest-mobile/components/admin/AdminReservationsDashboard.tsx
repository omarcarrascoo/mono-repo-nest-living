import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { AdminReservationStats } from '@/types/api';

interface DashboardProps {
  stats: AdminReservationStats | null;
  loading: boolean;
  error: string | null;
}

function fmtPercent(rate: number) {
  if (!Number.isFinite(rate)) return '0%';
  return `${Math.round(rate * 100)}%`;
}

export function AdminReservationsDashboard({ stats, loading, error }: DashboardProps) {
  const totals = stats?.totals ?? { today: 0, week: 0, month: 0 };
  const top = stats?.topAmenities ?? [];
  const hours = stats?.hourOccupancy ?? Array.from({ length: 24 }, () => 0);
  const cancelRate = stats?.cancellationRate ?? 0;
  const peak = useMemo(
    () => Math.max(1, ...hours),
    [hours],
  );

  if (loading && !stats) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color={COLORS.brand.tealDark} />
      </View>
    );
  }

  if (error && !stats) {
    return (
      <View style={styles.errorState}>
        <Feather name="alert-circle" size={20} color={COLORS.status.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.kpiRow}>
        <KpiCard
          label="Hoy"
          value={String(totals.today)}
          tint="#0f766e"
          bg="#ccfbf1"
          icon="calendar"
        />
        <KpiCard
          label="Semana"
          value={String(totals.week)}
          tint="#1d4ed8"
          bg="#dbeafe"
          icon="trending-up"
        />
        <KpiCard
          label="Mes"
          value={String(totals.month)}
          tint="#9333ea"
          bg="#f3e8ff"
          icon="bar-chart-2"
        />
      </View>

      <View style={styles.cancellationCard}>
        <View style={styles.cancellationLeft}>
          <View style={styles.cancellationIcon}>
            <Feather name="x-octagon" size={18} color="#dc2626" />
          </View>
          <View>
            <Text style={styles.cancellationLabel}>Tasa de cancelación</Text>
            <Text style={styles.cancellationSub}>histórico de la residencia</Text>
          </View>
        </View>
        <Text style={styles.cancellationValue}>{fmtPercent(cancelRate)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Top amenidades · 30 días</Text>
      {top.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Aún no hay reservas en los últimos 30 días.
          </Text>
        </View>
      ) : (
        <View style={styles.topList}>
          {top.map((t, idx) => {
            const pct = top[0]?.count ? t.count / top[0].count : 0;
            return (
              <View key={t.amenityId} style={styles.topRow}>
                <View style={styles.topRank}>
                  <Text style={styles.topRankText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topTitle} numberOfLines={1}>
                    {t.title ?? 'Amenidad sin nombre'}
                  </Text>
                  <View style={styles.topBarBg}>
                    <View
                      style={[
                        styles.topBarFill,
                        { width: `${Math.max(8, pct * 100)}%` },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.topCount}>{t.count}</Text>
              </View>
            );
          })}
        </View>
      )}

      <Text style={styles.sectionTitle}>Ocupación por hora · 30 días</Text>
      <View style={styles.hourCard}>
        <View style={styles.hourGrid}>
          {hours.map((count, hour) => {
            const intensity = count / peak;
            const opacity = count === 0 ? 0.06 : 0.2 + intensity * 0.8;
            return (
              <View key={hour} style={styles.hourCell}>
                <View
                  style={[
                    styles.hourBar,
                    {
                      backgroundColor: `rgba(15, 118, 110, ${opacity.toFixed(2)})`,
                      height: 8 + intensity * 36,
                    },
                  ]}
                />
                {hour % 6 === 0 ? (
                  <Text style={styles.hourLabel}>{`${String(hour).padStart(2, '0')}`}</Text>
                ) : (
                  <Text style={styles.hourLabel}> </Text>
                )}
              </View>
            );
          })}
        </View>
        <View style={styles.hourLegend}>
          <Text style={styles.hourLegendText}>00h</Text>
          <Text style={styles.hourLegendText}>06h</Text>
          <Text style={styles.hourLegendText}>12h</Text>
          <Text style={styles.hourLegendText}>18h</Text>
          <Text style={styles.hourLegendText}>23h</Text>
        </View>
      </View>
    </View>
  );
}

function KpiCard({
  label,
  value,
  tint,
  bg,
  icon,
}: {
  label: string;
  value: string;
  tint: string;
  bg: string;
  icon: keyof typeof Feather.glyphMap;
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

const styles = StyleSheet.create({
  wrapper: { gap: 16 },

  loadingState: { paddingVertical: 32, alignItems: 'center' },
  errorState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: { color: '#7f1d1d', fontSize: 13, flex: 1 },

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
  kpiValue: { fontSize: 24, fontWeight: '800', color: COLORS.text.primary },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  cancellationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.light.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  cancellationLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cancellationIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancellationLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary },
  cancellationSub: { fontSize: 11, color: COLORS.text.label, marginTop: 2 },
  cancellationValue: { fontSize: 22, fontWeight: '800', color: '#dc2626' },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
    marginLeft: 4,
  },
  topList: {
    backgroundColor: COLORS.light.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    gap: 12,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topRank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRankText: { fontSize: 12, fontWeight: '700', color: COLORS.text.primary },
  topTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary, marginBottom: 6 },
  topBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  topBarFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.brand.tealDark },
  topCount: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary, minWidth: 28, textAlign: 'right' },

  emptyCard: {
    backgroundColor: COLORS.light.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  emptyText: { fontSize: 13, color: COLORS.text.secondary, textAlign: 'center' },

  hourCard: {
    backgroundColor: COLORS.light.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    gap: 6,
  },
  hourGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 56,
  },
  hourCell: { flex: 1, alignItems: 'center', gap: 2 },
  hourBar: {
    width: '100%',
    borderRadius: 3,
  },
  hourLabel: { fontSize: 9, color: COLORS.text.label },
  hourLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  hourLegendText: { fontSize: 10, color: COLORS.text.label, fontWeight: '500' },
});
