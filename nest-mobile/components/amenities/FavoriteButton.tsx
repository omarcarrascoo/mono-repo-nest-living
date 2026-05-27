import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFavoritesStore } from '@/stores/favorites-store';

interface Props {
  amenityId: string;
  size?: number;
  /** Estilos visuales: 'overlay' (sobre imagen) o 'inline' (sobre fondo claro). */
  variant?: 'overlay' | 'inline';
}

export function FavoriteButton({ amenityId, size = 22, variant = 'overlay' }: Props) {
  const isFav = useFavoritesStore((s) => s.ids.has(amenityId));
  const pending = useFavoritesStore((s) => !!s.pending[amenityId]);
  const toggle = useFavoritesStore((s) => s.toggle);

  const onPress = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await toggle(amenityId);
    } catch {
      // Error silencioso — el store hace rollback. La UI ya refleja el estado.
    }
  };

  const iconColor = isFav ? '#ef4444' : variant === 'overlay' ? '#000' : '#475569';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={pending}
      style={[
        styles.btn,
        variant === 'overlay' ? styles.overlay : styles.inline,
      ]}
      activeOpacity={0.7}
      hitSlop={8}
    >
      {pending ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <Ionicons
          name={isFav ? 'heart' : 'heart-outline'}
          size={size}
          color={iconColor}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inline: {
    backgroundColor: '#f1f5f9',
  },
});
