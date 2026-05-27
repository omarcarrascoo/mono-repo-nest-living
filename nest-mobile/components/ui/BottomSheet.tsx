import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  /** % de la altura del viewport que ocupa máximo el sheet (0-1). */
  maxHeightRatio?: number;
}

const { height: SCREEN_H } = Dimensions.get('window');

/**
 * BottomSheet básico, animado y accesible.
 * Cierra con tap en backdrop o swipe-down (no implementado aún — Pressable backdrop).
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  contentStyle,
  maxHeightRatio = 0.85,
}: BottomSheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdrop]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdrop },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kb}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: SCREEN_H * maxHeightRatio, transform: [{ translateY }] },
            contentStyle,
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <SafeAreaView edges={['bottom']} style={styles.inner}>
            {children}
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  kb: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.ui.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 24,
  },
  handleWrap: {
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: 'center',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  inner: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
});
