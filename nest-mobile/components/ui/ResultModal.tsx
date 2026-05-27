import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

type Variant = 'success' | 'error' | 'info';

interface ResultModalProps {
  visible: boolean;
  variant: Variant;
  title: string;
  message?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onClose: () => void;
}

function variantConfig(v: Variant) {
  switch (v) {
    case 'success':
      return { icon: 'check-circle' as const, color: '#10b981', bg: '#ecfdf5' };
    case 'error':
      return { icon: 'alert-triangle' as const, color: '#dc2626', bg: '#fef2f2' };
    default:
      return { icon: 'info' as const, color: COLORS.brand.tealDark, bg: '#f0fdfa' };
  }
}

export function ResultModal({
  visible,
  variant,
  title,
  message,
  primaryLabel = 'Listo',
  onPrimary,
  secondaryLabel,
  onSecondary,
  onClose,
}: ResultModalProps) {
  const cfg = variantConfig(variant);

  const handlePrimary = () => {
    if (onPrimary) onPrimary();
    else onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon} size={32} color={cfg.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.row}>
            {secondaryLabel ? (
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={onSecondary ?? onClose}
              >
                <Text style={[styles.btnText, styles.btnSecondaryText]}>
                  {secondaryLabel}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[
                styles.btn,
                { backgroundColor: cfg.color },
              ]}
              onPress={handlePrimary}
            >
              <Text style={[styles.btnText, styles.btnPrimaryText]}>{primaryLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.ui.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: { backgroundColor: '#f1f5f9' },
  btnText: { fontSize: 15, fontWeight: '700' },
  btnPrimaryText: { color: '#fff' },
  btnSecondaryText: { color: COLORS.text.primary },
});
