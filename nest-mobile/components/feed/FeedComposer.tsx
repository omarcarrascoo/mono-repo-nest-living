import { COLORS, THEME } from '@/constants/theme';
import React from 'react';
import { View, Text, StyleSheet, Image as RNImage } from 'react-native'; // Usamos RN Image para avatars simples o expo-image

interface FeedComposerProps {
  avatarUrl: string;
  placeholder?: string;
}

export const FeedComposer: React.FC<FeedComposerProps> = ({ 
  avatarUrl, 
  placeholder = "Inicia una conversación..." 
}) => {
  return (
    <View style={styles.container}>
      <RNImage source={{ uri: avatarUrl }} style={styles.avatar} />
      <View style={styles.inputBox}>
        <Text style={styles.placeholder}>{placeholder}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
  inputBox: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.ui.white,
    borderRadius: 25,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: .2,
    borderColor: COLORS.text.secondary,
  },
  placeholder: { color: COLORS.text.secondary, fontSize: 15 },
});