import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

interface HeroSearchProps {
  title: string;
  searchValue: string;
  onSearchChange: (text: string) => void;
}

export const HeroSearch = ({ title, searchValue, onSearchChange }: HeroSearchProps) => {
  return (
    <View style={styles.heroContainer}>
       <Text style={styles.heroTitle}>{title}</Text>
       
       <View style={styles.searchBar}>
          <Feather name="search" size={18} color={COLORS.text.subtitle} style={{ marginRight: 12 }} />
          <TextInput 
              style={styles.searchInput}
              placeholder="¿Qué quieres hacer hoy?"
              placeholderTextColor={COLORS.text.subtitle}
              value={searchValue}
              onChangeText={onSearchChange}
          />
       </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.text.title,
    lineHeight: 40,
    marginBottom: 20,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: COLORS.ui.glass,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text.title,
    fontSize: 15,
    fontWeight: '500',
  },
});