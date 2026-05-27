import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, THEME } from '@/constants/theme';

export const CommunityCTA: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Únete a tu Club de Residentes</Text>
      <Text style={styles.subtitle}>No hagas vida solo, hay toda una comunidad aquí para ayudarte.</Text>
      
      <View style={styles.facepile}>
        {[1, 2, 3, 4, 5].map((_, i) => (
          <Image 
            key={i}
            source={{ uri: `https://i.pravatar.cc/150?u=${i + 20}` }} 
            style={[styles.avatar, { transform: [{ translateX: -15 * i }] }]} 
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 30 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8, color: COLORS.text.primary },
  subtitle: { fontSize: 15, color: COLORS.text.secondary, textAlign: 'center', marginBottom: 24 },
  facepile: { flexDirection: 'row', paddingLeft: 30 },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#FFF' }
});