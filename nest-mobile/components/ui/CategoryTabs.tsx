import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS } from '@/constants/theme';

export interface CategoryChip {
  id: string;
  name: string;
}

interface CategoryFilterProps {
  /**
   * Acepta strings (modo legacy/local) o CategoryChip (modo backend, con id).
   */
  categories: (string | CategoryChip)[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  /** Texto del chip "todos" (default: "Todos"). null para ocultarlo. */
  allLabel?: string | null;
}

function chipKey(c: string | CategoryChip): string {
  return typeof c === 'string' ? c : c.id;
}
function chipName(c: string | CategoryChip): string {
  return typeof c === 'string' ? c : c.name;
}

export const CategoryFilter = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  allLabel = 'Todos',
}: CategoryFilterProps) => {
  return (
    <View style={styles.categoriesContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
      >
        {allLabel ? (
          <TouchableOpacity
            onPress={() => onSelectCategory(null)}
            style={[
              styles.catPill,
              activeCategoryId === null && styles.catPillActive,
            ]}
          >
            <Text
              style={[
                styles.catText,
                activeCategoryId === null && styles.catTextActive,
              ]}
            >
              {allLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
        {categories.map((cat) => {
          const id = chipKey(cat);
          const isActive = activeCategoryId === id;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => onSelectCategory(id)}
              style={[styles.catPill, isActive && styles.catPillActive]}
            >
              <Text style={[styles.catText, isActive && styles.catTextActive]}>
                {chipName(cat)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  categoriesContainer: {
    marginBottom: 24,
    height: 38,
  },
  catPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  catPillActive: {
    backgroundColor: COLORS.background.base,
  },
  catText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  catTextActive: {
    color: '#FFF',
  },
});
