import { COLORS } from '@/constants/theme';
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface SectionHeaderProps {
  title: string;
  rightAction?: React.ReactNode; // Permite pasar cualquier componente (botones, flechas)
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, rightAction, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
});