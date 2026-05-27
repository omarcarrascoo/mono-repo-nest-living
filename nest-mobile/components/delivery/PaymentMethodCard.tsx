import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

type FeatherIconName = keyof typeof Feather.glyphMap;

interface PaymentMethodCardProps {
  icon: FeatherIconName;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Feather
          name={icon}
          size={20}
          color={selected ? COLORS.ui.white : COLORS.brand.tealDark}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.ui.white,
    borderWidth: 2,
    borderColor: COLORS.light.border,
  },
  cardSelected: {
    borderColor: COLORS.brand.tealDark,
    backgroundColor: '#ecfdf5',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: COLORS.brand.tealDark,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.text.label,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.brand.tealDark,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand.tealDark,
  },
});
