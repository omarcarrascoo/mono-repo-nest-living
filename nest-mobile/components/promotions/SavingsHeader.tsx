import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

export const SavingsHeader = () => (
  <View style={styles.container}>
    <View>
      <Text style={styles.label}>Ahorra en promociones</Text>
      <Text style={styles.amount}>Cupones</Text>
    </View>
    <TouchableOpacity style={styles.myCouponsBtn}>
      <Feather name="tag" size={16} color={COLORS.promotions.pillText} />
      <Text style={styles.myCouponsText}>Mis Cupones (4)</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.background.base,
    letterSpacing: -0.5,
  },
  myCouponsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.promotions.pillBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  myCouponsText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.promotions.pillText,
  },
});