import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '@/constants/theme';

interface PaymentData {
  amount: string;
  daysLeft: number;
  totalDays: number;
  label: string;
  dueDate: string;
}

export const PaymentWidget = ({ data }: { data: PaymentData }) => {
  const progressPercent = (data.daysLeft / data.totalDays) * 100;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Feather name="alert-circle" size={18} color={COLORS.brand.tealDark} />
        </View>
        <Text style={styles.title}>Próximo Vencimiento</Text>
        <Text style={styles.dateTag}>{data.dueDate}</Text>
      </View>

      <Text style={styles.amount}>{data.amount}</Text>
      <Text style={styles.concept}>{data.label}</Text>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={GRADIENTS.buttonPrimary as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${100 - progressPercent}%` }]}
          />
        </View>
        <Text style={styles.progressText}>Faltan {data.daysLeft} días</Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Pagar Ahora</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.light.card,
    borderRadius: 24,
    padding: 20,
    // Soft Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: { marginRight: 8 },
  title: {
    fontSize: 14,
    color: COLORS.text.label,
    fontWeight: '600',
    flex: 1,
  },
  dateTag: {
    fontSize: 12,
    color: COLORS.brand.tealDark,
    fontWeight: '700',
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  concept: {
    fontSize: 14,
    color: COLORS.text.label,
    marginBottom: 20,
  },
  progressContainer: { marginBottom: 20 },
  progressBarBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressBarFill: { height: 6, borderRadius: 3 },
  progressText: {
    fontSize: 11,
    color: COLORS.text.label,
    textAlign: 'right',
  },
  button: {
    backgroundColor: COLORS.text.primary, // Dark button
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});