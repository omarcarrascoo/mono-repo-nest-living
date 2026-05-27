// src/components/common/RowBackHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { useRouter } from 'expo-router'; // Opcional, para manejo automático de back

type IconName = keyof typeof Feather.glyphMap;

interface RowBackHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightIcon?: IconName;
  onRightPress?: () => void;
}

export default function RowBackHeader({ 
  title, 
  onBackPress, 
  rightIcon, 
  onRightPress 
}: RowBackHeaderProps) {
  const router = useRouter();

  // Si no se pasa onBackPress, usamos el default de router.back()
  const handleBack = onBackPress || (() => router.back());

  return (
    <View style={styles.navBar}>
      {/* Botón Izquierdo (Atrás) */}
      <TouchableOpacity style={styles.iconBtn} onPress={handleBack}>
        <Feather name="arrow-left" size={24} color={COLORS.text.title} />
      </TouchableOpacity>

      {/* Título */}
      <Text style={styles.navTitle}>{title}</Text>

      {/* Botón Derecho (Opcional o Espaciador) */}
      {rightIcon ? (
        <TouchableOpacity style={styles.iconBtn} onPress={onRightPress}>
          <Feather name={rightIcon} size={22} color={COLORS.text.title} />
        </TouchableOpacity>
      ) : (
        // Espaciador invisible para mantener el título centrado
        <View style={styles.placeholderBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  navTitle: {
    color: COLORS.text.title,
    fontSize: 18,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 8,
    // Definir un tamaño mínimo ayuda a la alineación
    width: 40, 
    alignItems: 'center',
  },
  placeholderBtn: {
    width: 40,
  }
});