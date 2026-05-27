import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
// 1. Importamos THEME
import { COLORS, THEME } from '@/constants/theme';

export const PromoSearchBar = () => (
  <View style={styles.container}>
    <Feather name="search" size={20} color={COLORS.text.placeholder} style={styles.icon} />
    <TextInput 
      placeholder="Buscar restaurantes, gimnasios..." 
      placeholderTextColor={COLORS.text.placeholder}
      style={styles.input}
    />
    <TouchableOpacity style={styles.filterBtn}>
        <Feather name="sliders" size={18} color={COLORS.text.primary} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ui.white,
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    
    // 2. CORRECCIÓN: Usamos THEME.shadows.default
    shadowColor: THEME.shadows.default.shadowColor,
    shadowOffset: THEME.shadows.default.shadowOffset,
    shadowOpacity: THEME.shadows.default.shadowOpacity,
    shadowRadius: THEME.shadows.default.shadowRadius,
    elevation: THEME.shadows.default.elevation,
  },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
    height: '100%',
  },
  filterBtn: { padding: 8 },
});