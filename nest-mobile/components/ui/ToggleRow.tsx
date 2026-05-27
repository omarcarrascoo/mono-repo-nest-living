import { COLORS, THEME } from '@/constants/theme';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ToggleRowProps {
  tabs: string[];
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({ tabs, activeTab, onTabPress }) => {
  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity 
            key={tab}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onTabPress(tab)}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: COLORS.background.glass,
  },
  pillActive: { backgroundColor: COLORS.background.base },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  textActive: { color: COLORS.ui.white },
});