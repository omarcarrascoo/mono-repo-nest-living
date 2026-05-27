import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { PromoCategory } from '@/types/promotions';

interface CategoryPillProps {
  item: PromoCategory;
  isActive: boolean;
  onPress: () => void;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({ item, isActive, onPress }) => (
  <TouchableOpacity 
    style={[styles.container, isActive && styles.activeContainer]} 
    onPress={onPress}
  >
    <Feather 
      name={item.icon} 
      size={16} 
      color={isActive ? COLORS.text.inverse : COLORS.text.secondary} 
    />
    <Text style={[styles.text, isActive && styles.activeText]}>
      {item.label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: COLORS.ui.white,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  activeContainer: {
    backgroundColor: COLORS.text.primary,
    borderColor: COLORS.text.primary,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  activeText: {
    color: COLORS.text.inverse,
  },
});