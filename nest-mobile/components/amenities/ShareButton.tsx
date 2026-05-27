import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Share, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Amenity } from '@/types/api';

interface Props {
  amenity: Amenity;
  size?: number;
  variant?: 'overlay' | 'inline';
}

export function ShareButton({ amenity, size = 20, variant = 'overlay' }: Props) {
  const [sharing, setSharing] = useState(false);

  const onPress = async () => {
    if (sharing) return;
    setSharing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const base = `https://nest.app/amenity/${amenity.id}`;
      const message = `${amenity.title}${amenity.location ? ` · ${amenity.location}` : ''}\n${base}`;
      await Share.share(
        Platform.OS === 'ios' ? { url: base, message: amenity.title } : { message },
      );
    } catch {
      // ignore — usuario canceló o falló
    } finally {
      setSharing(false);
    }
  };

  const iconColor = variant === 'overlay' ? '#000' : '#475569';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={sharing}
      style={[
        styles.btn,
        variant === 'overlay' ? styles.overlay : styles.inline,
      ]}
      activeOpacity={0.7}
      hitSlop={8}
    >
      <Feather name="share" size={size} color={iconColor} />
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
