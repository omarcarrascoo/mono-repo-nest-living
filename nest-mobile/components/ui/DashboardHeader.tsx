import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { COLORS, THEME } from '@/constants/theme';
import { useRouter } from 'expo-router';

type HeaderVariant = 'minimal' | 'standard';

interface DashboardHeaderProps {
  avatarUrl: string;
  variant?: HeaderVariant;
  userName?: string;
  location?: string;
  hasUnread?: boolean;
  onMenuPress: () => void;
  onAvatarPress?: () => void;
  style?: ViewStyle;
}

// CONSTANTES COMUNES PARA ASEGURAR PROPORCIÓN
const SIZES = {
  avatar: 44,
  borderRadius: 16,
  paddingY: 16,
  iconSize: 22,
  greetingSize: 16,
  locationSize: 12,
};

export const DashboardHeader = ({ 
  avatarUrl, 
  variant = 'minimal',
  userName = "Vecino",
  location = "Torre B",
  hasUnread = false, 
  onMenuPress, 
  onAvatarPress,
  style 
}: DashboardHeaderProps) => {
  const router = useRouter();

  const handleAvatarPress = () => {
    onAvatarPress ? onAvatarPress() : router.push('/profile/me');
  };

  const isStandard = variant === 'standard';

  return (
    <View style={[
      isStandard ? styles.containerStandard : styles.containerMinimal, 
      style
    ]}>
      <View style={styles.leftSection}>
        <TouchableOpacity 
          style={isStandard ? styles.avatarWrapperStandard : styles.avatarWrapperMinimal} 
          onPress={handleAvatarPress}
        >
           <Image 
             source={{ uri: avatarUrl }} 
             style={isStandard ? styles.avatarStandard : styles.avatarMinimal} 
           />
           {/* Badge visible en ambos para consistencia */}
           <View style={styles.onlineBadge} />
        </TouchableOpacity>

        <View style={styles.textContainer}>
          <Text style={isStandard ? styles.greetingStandard : styles.greetingMinimal}>
            Hola, {userName}
          </Text>
          
          {/* Contenedor de ubicación: Píldora vs Texto Glass */}
          <View style={isStandard ? styles.locationPill : styles.locationRowMinimal}>
            <Feather 
              name="map-pin" 
              size={SIZES.locationSize} 
              color={isStandard ? COLORS.brand.tealDark : COLORS.text.inverse} 
              style={!isStandard && { opacity: 0.8 }}
            />
            <Text style={isStandard ? styles.locationTextStandard : styles.locationTextMinimal}>
              {location}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={isStandard ? styles.btnStandard : styles.btnGlass} 
        onPress={onMenuPress}
      >
         <Feather 
           name="bell" 
           size={SIZES.iconSize} 
           color={isStandard ? COLORS.text.primary : COLORS.text.title} 
         />
         {hasUnread && <View style={styles.dot} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // --- ELEMENTOS COMUNES ---
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    justifyContent: 'center',
    gap: 2, // Pequeña separación uniforme
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.status.success,
    borderWidth: 2,
    borderColor: COLORS.ui.white, // Ojo: en Minimal se verá un borde blanco sobre el avatar, lo cual está bien para contraste
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.status.error,
    borderWidth: 1.5,
    borderColor: COLORS.ui.white,
  },

  // --- STANDARD (Fondo Blanco) ---
  containerStandard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: SIZES.paddingY, // 16
    backgroundColor: COLORS.ui.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  avatarWrapperStandard: {
    shadowColor: THEME.shadows.default.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarStandard: {
    width: SIZES.avatar, // 44
    height: SIZES.avatar, // 44
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.background.dark,
  },
  greetingStandard: {
    fontSize: SIZES.greetingSize, // 16
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.promotions.pillBg, 
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  locationTextStandard: {
    fontSize: SIZES.locationSize, // 12
    fontWeight: '700',
    color: COLORS.brand.tealDark,
  },
  btnStandard: {
    width: SIZES.avatar, // 44
    height: SIZES.avatar, // 44
    borderRadius: 14,
    backgroundColor: COLORS.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- MINIMAL (Transparente) ---
  containerMinimal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: SIZES.paddingY, // 16 (Igual que standard)
  },
  avatarWrapperMinimal: {
    // Sin sombra externa para minimalismo
  },
  avatarMinimal: {
    width: SIZES.avatar, // 44 (Igual que standard)
    height: SIZES.avatar, // 44
    borderRadius: SIZES.borderRadius,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  greetingMinimal: {
    fontSize: SIZES.greetingSize, // 16 (Igual que standard)
    fontWeight: '700', // Subido de 600 a 700 para igualar peso visual
    color: COLORS.text.title,
    opacity: 0.95,
  },
  locationRowMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    // Hack visual: añadimos padding aunque sea transparente para que 
    // ocupe el mismo espacio vertical que la "píldora" del standard
    paddingVertical: 3, 
    paddingHorizontal: 0,
  },
  locationTextMinimal: {
    fontSize: SIZES.locationSize, // 12
    fontWeight: '600',
    color: COLORS.text.title,
    opacity: 0.9,
  },
  btnGlass: {
    width: SIZES.avatar, // 44
    height: SIZES.avatar, // 44
    borderRadius: 14,
    backgroundColor: COLORS.ui.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});