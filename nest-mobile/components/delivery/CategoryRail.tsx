import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { ProductCategory } from '@/types/api';

type FeatherIconName = keyof typeof Feather.glyphMap;

interface RailItem {
  id: string;
  name: string;
  icon: string;
}

interface CategoryRailProps {
  categories: ProductCategory[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  allLabel?: string;
}

const ALL_ID = '__all__';

/**
 * Pills horizontales con icono + nombre. El chip "Todo" siempre va primero.
 * Usa el icon name como string + cast — si el BE manda algo que Feather
 * no conoce, fallback a "tag".
 */
export const CategoryRail: React.FC<CategoryRailProps> = ({
  categories,
  activeId,
  onSelect,
  allLabel = 'Todo',
}) => {
  const data: RailItem[] = [
    { id: ALL_ID, name: allLabel, icon: 'grid' },
    ...categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    >
      {data.map((item) => {
        const isAll = item.id === ALL_ID;
        const isActive = isAll ? activeId === null : activeId === item.id;
        const iconName = (item.icon || 'tag') as FeatherIconName;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelect(isAll ? null : item.id)}
            style={[styles.pill, isActive && styles.pillActive]}
            activeOpacity={0.85}
          >
            <Feather
              name={iconName}
              size={15}
              color={isActive ? COLORS.text.inverse : COLORS.text.secondary}
            />
            <Text style={[styles.text, isActive && styles.textActive]}>{item.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  list: { paddingHorizontal: 24, gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: COLORS.ui.white,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  pillActive: {
    backgroundColor: COLORS.text.primary,
    borderColor: COLORS.text.primary,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  textActive: {
    color: COLORS.text.inverse,
  },
});
