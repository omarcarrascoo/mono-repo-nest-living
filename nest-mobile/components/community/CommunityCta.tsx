import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';

const FACEPILE_SEEDS = ['Ana M', 'Luis R', 'Marta G', 'Diego S', 'Iván T'];

export const CommunityCTA: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Únete a tu Club de Residentes</Text>
      <Text style={styles.subtitle}>No hagas vida solo, hay toda una comunidad aquí para ayudarte.</Text>

      <View style={styles.facepile}>
        {FACEPILE_SEEDS.map((name, i) => (
          <View
            key={name}
            style={[styles.avatarWrap, { transform: [{ translateX: -15 * i }] }]}
          >
            <Avatar name={name} size={50} ring />
          </View>
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
  avatarWrap: {},
});