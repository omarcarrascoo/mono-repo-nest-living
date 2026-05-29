import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '@/constants/theme';

interface AvatarProps {
  /** URL real. Si no hay, se dibujan las iniciales sobre el teal de la marca. */
  uri?: string | null;
  /** Nombre completo — se usa para sacar las iniciales. */
  name?: string | null;
  size?: number;
  /** Override de borderRadius (default = circular). */
  rounded?: number;
  style?: ViewStyle;
  /** Si quieres que el card se vea con borde blanco para destacar. */
  ring?: boolean;
}

/**
 * Default avatar minimalista: iniciales blancas sobre teal de marca.
 * Sin URLs externas (no `ui-avatars.com`, no `pravatar.cc`) — todo local,
 * sin flicker en pantallas con muchos avatares.
 */
function initials(name?: string | null): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  uri,
  name,
  size = 44,
  rounded,
  style,
  ring,
}: AvatarProps) {
  const radius = rounded ?? size / 2;
  const fontSize = Math.max(11, Math.round(size * 0.4));
  const ringStyle: ViewStyle | undefined = ring
    ? {
        borderWidth: 2,
        borderColor: '#fff',
      }
    : undefined;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: radius },
          ringStyle as any,
          style as any,
        ]}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius },
        ringStyle,
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#e2e8f0',
  },
  fallback: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand.tealDark,
  },
  initials: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
