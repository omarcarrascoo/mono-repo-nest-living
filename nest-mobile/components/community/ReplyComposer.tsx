import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

interface ReplyComposerProps {
  /** When set, input is in "responding to X" mode. */
  replyingToName?: string | null;
  onCancelReply?: () => void;
  onSubmit: (content: string) => Promise<void>;
  posting: boolean;
  placeholder?: string;
}

export const ReplyComposer: React.FC<ReplyComposerProps> = ({
  replyingToName,
  onCancelReply,
  onSubmit,
  posting,
  placeholder = 'Escribe un comentario…',
}) => {
  const [text, setText] = useState('');

  const canSend = text.trim().length > 0 && !posting;

  const handleSend = async () => {
    if (!canSend) return;
    const value = text.trim();
    try {
      await onSubmit(value);
      setText('');
    } catch {
      // Error surface left to caller; keep text so the user can retry.
    }
  };

  return (
    <View style={styles.wrap}>
      {replyingToName ? (
        <View style={styles.replyingPill}>
          <Feather name="corner-down-right" size={12} color={COLORS.brand.tealDark} />
          <Text style={styles.replyingText} numberOfLines={1}>
            Respondiendo a{' '}
            <Text style={styles.replyingName}>{replyingToName}</Text>
          </Text>
          {onCancelReply ? (
            <TouchableOpacity onPress={onCancelReply} hitSlop={8}>
              <Feather name="x" size={14} color={COLORS.brand.tealDark} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.placeholder}
          style={styles.input}
          multiline
          maxLength={2000}
          editable={!posting}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.85}
        >
          {posting ? (
            <ActivityIndicator color={COLORS.ui.white} />
          ) : (
            <Feather name="send" size={18} color={COLORS.ui.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.ui.white,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
    gap: 10,
  },
  replyingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.promotions.pillBg,
    maxWidth: '100%',
  },
  replyingText: {
    fontSize: 12,
    color: COLORS.brand.tealDark,
    fontWeight: '600',
    flexShrink: 1,
  },
  replyingName: { fontWeight: '800' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: COLORS.light.backgroundSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.brand.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
