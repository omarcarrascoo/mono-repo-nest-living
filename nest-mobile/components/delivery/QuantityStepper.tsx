import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  /** 'compact' = 32px (carrito), 'large' = 44px (detalle de producto). */
  size?: 'compact' | 'large';
}

/**
 * Stepper +/- reutilizable. Maneja sus propios límites para que el padre
 * no tenga que duplicar la validación en cada call site.
 */
export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  min = 1,
  max = 99,
  onChange,
  size = 'compact',
}) => {
  const dim = size === 'large' ? 44 : 32;
  const fontSize = size === 'large' ? 18 : 14;
  const iconSize = size === 'large' ? 20 : 16;

  const dec = () => value > min && onChange(value - 1);
  const inc = () => value < max && onChange(value + 1);

  return (
    <View style={[styles.container, { height: dim }]}>
      <TouchableOpacity
        onPress={dec}
        disabled={value <= min}
        style={[styles.btn, { width: dim, height: dim }, value <= min && styles.btnDisabled]}
        hitSlop={8}
      >
        <Feather
          name="minus"
          size={iconSize}
          color={value <= min ? COLORS.text.label : COLORS.text.primary}
        />
      </TouchableOpacity>
      <Text style={[styles.value, { fontSize, minWidth: dim }]}>{value}</Text>
      <TouchableOpacity
        onPress={inc}
        disabled={value >= max}
        style={[styles.btn, { width: dim, height: dim }, value >= max && styles.btnDisabled]}
        hitSlop={8}
      >
        <Feather
          name="plus"
          size={iconSize}
          color={value >= max ? COLORS.text.label : COLORS.text.primary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ui.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    paddingHorizontal: 4,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  value: {
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
});
