import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';

interface StickyFooterProps {
  status: 'available' | 'busy' | 'maintenance';
  hint?: string;
  onPress: () => void;
}

export const StickyFooter = ({ status, hint, onPress }: StickyFooterProps) => {
  const isAvailable = status === 'available';

  const ctaText = isAvailable
    ? 'Reservar'
    : status === 'maintenance'
      ? 'En mantenimiento'
      : 'No disponible';

  return (
    <View style={styles.wrapper}>
      <View style={styles.actionContainer}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>
            {isAvailable ? 'Disponible' : 'Estado'}
          </Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {hint ?? (isAvailable ? 'Elige tu horario' : ctaText)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.reserveBtn, !isAvailable && styles.disabledBtn]}
          onPress={onPress}
          disabled={!isAvailable}
          activeOpacity={0.85}
        >
          <Feather name="calendar" size={18} color="#fff" />
          <Text style={styles.btnText}>{ctaText}</Text>
        </TouchableOpacity>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.safeBg} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 100,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  infoCol: { flex: 1, justifyContent: 'center' },
  infoLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: -0.3,
  },
  reserveBtn: {
    backgroundColor: COLORS.brand.tealDark,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: COLORS.brand.tealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  safeBg: { backgroundColor: '#FFF' },
});
