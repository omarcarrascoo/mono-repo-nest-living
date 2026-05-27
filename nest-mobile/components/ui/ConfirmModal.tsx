import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '@/constants/theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={[styles.btnText, styles.btnCancelText]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                destructive ? styles.btnDanger : styles.btnPrimary,
                loading && styles.btnDisabled,
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.btnText, styles.btnPrimaryText]}>{confirmText}</Text>
              )}
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
    gap: 12,
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
    marginTop: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#f1f5f9',
  },
  btnPrimary: {
    backgroundColor: COLORS.brand.tealDark,
  },
  btnDanger: {
    backgroundColor: '#dc2626',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 15, fontWeight: '700' },
  btnCancelText: { color: COLORS.text.primary },
  btnPrimaryText: { color: '#fff' },
});
