// src/components/profile/SectionHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

// Extraemos el tipo de nombres de iconos válidos de Feather
type IconName = keyof typeof Feather.glyphMap;

interface SectionHeaderProps {
  title: string;
  icon: IconName;
  action?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export default function SectionHeader({ 
  title, 
  icon, 
  action, 
  onActionPress,
  style 
}: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeaderContainer, style]}>
      <View style={styles.sectionTitleRow}>
        <Feather name={icon} size={18} color={COLORS.brand.tealDark} style={{ marginRight: 8 }} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action && (
        <TouchableOpacity onPress={onActionPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  sectionAction: {
    fontSize: 14,
    color: COLORS.brand.tealDark,
    fontWeight: '600',
  },
});