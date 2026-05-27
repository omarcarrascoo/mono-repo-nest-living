import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

interface PostComposerTriggerProps {
  avatarUrl?: string;
  isAdmin: boolean;
  onPress: () => void;
}

/**
 * Composer "fake input" card. Doesn't actually capture text — taps it to push
 * the dedicated `/post/new` screen, where we get a proper editor.
 */
export const PostComposerTrigger: React.FC<PostComposerTriggerProps> = ({
  avatarUrl,
  isAdmin,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Feather name="user" size={18} color={COLORS.text.label} />
        </View>
      )}
      <View style={styles.bubble}>
        <Text style={styles.placeholder}>
          {isAdmin
            ? 'Publica un aviso o conversa con tus vecinos…'
            : 'Comparte una pregunta o consejo…'}
        </Text>
      </View>
      <View style={styles.action}>
        <Feather name="edit-3" size={18} color={COLORS.brand.tealDark} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.ui.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light.backgroundSecondary,
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  bubble: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.light.backgroundSecondary,
    borderRadius: 22,
  },
  placeholder: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  action: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.promotions.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
