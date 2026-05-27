import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '@/constants/theme'; // Adjust path

export const BalanceSection = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Saldo Disponible</Text>
      <Text style={styles.amount}>$14,250.00</Text>

      {/* Action Grid */}
      <View style={styles.actionGrid}>
        <ActionButton label="Enviar" icon="arrow-up-right" isPrimary />
        <ActionButton label="Recargar" icon="plus" />
        <ActionButton label="Más" icon="more-horizontal" />
      </View>
    </View>
  );
};

// Sub-component for buttons to keep code clean
const ActionButton = ({ label, icon, isPrimary }: { label: string, icon: any, isPrimary?: boolean }) => (
  <TouchableOpacity style={styles.actionBtn}>
    {isPrimary ? (
      <LinearGradient colors={GRADIENTS.buttonPrimary as unknown as readonly [string, string, ...string[]]} style={styles.actionGradient}>
        <Feather name={icon} size={24} color="#FFF" />
      </LinearGradient>
    ) : (
      <View style={styles.secondaryActionIcon}>
        <Feather name={icon} size={24} color={COLORS.text.title} />
      </View>
    )}
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 30,
  },
  label: {
    color: COLORS.text.subtitle,
    fontSize: 14,
    marginBottom: 8,
  },
  amount: {
    color: COLORS.text.inverse,
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 32,
    letterSpacing: -1,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 8,
  },
  actionGradient: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brand.teal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: COLORS.text.subtitle,
    fontSize: 12,
    fontWeight: '500',
  },
});