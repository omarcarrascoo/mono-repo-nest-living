import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';
import { ResidentLease } from '@/types/user';
import SectionHeader from '../ui/FormHeader';

interface LeaseInfoProps {
  lease: ResidentLease;
}

export default function LeaseInfo({ lease }: LeaseInfoProps) {
  return (
    <View style={styles.card}>
      <SectionHeader title="Detalles del Contrato" icon="file-text" />
      <View style={styles.leaseContainer}>
        <View style={styles.leaseRow}>
          <Text style={styles.leaseLabel}>Inicio</Text>
          <Text style={styles.leaseValue}>{lease.startDate}</Text>
        </View>
        <View style={styles.leaseRow}>
          <Text style={styles.leaseLabel}>Fin</Text>
          <Text style={styles.leaseValue}>{lease.endDate}</Text>
        </View>
        <View style={[styles.leaseRow, { marginTop: 8 }]}>
          <Text style={styles.leaseLabel}>Renta Mensual</Text>
          <Text style={[styles.leaseValue, { color: COLORS.brand.tealDark }]}>
            {lease.rentAmount}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    card: { backgroundColor: COLORS.light.card, borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: COLORS.light.border },
    leaseContainer: { backgroundColor: COLORS.light.backgroundSecondary, borderRadius: 12, padding: 16 },
    leaseRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    leaseLabel: { color: COLORS.text.label, fontSize: 14 },
    leaseValue: { color: COLORS.text.primary, fontWeight: '600', fontSize: 14 },
});