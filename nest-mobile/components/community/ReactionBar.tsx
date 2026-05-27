import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { REACTION_EMOJIS, ReactionSummary } from '@/types/api';

interface ReactionBarProps {
  reactions: ReactionSummary;
  myReaction: string | null;
  onToggle: (emoji: string) => void;
  style?: ViewStyle;
  /** Optional compact mode: shows only emojis with counts inline. */
  compact?: boolean;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({
  reactions,
  myReaction,
  onToggle,
  style,
  compact = false,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const total = Object.values(reactions).reduce((sum, n) => sum + (n ?? 0), 0);
  const activeEmojis = REACTION_EMOJIS.filter((e) => (reactions[e] ?? 0) > 0);

  if (compact) {
    return (
      <View style={[styles.compactRow, style]}>
        {activeEmojis.length > 0 ? (
          <View style={styles.compactBubble}>
            {activeEmojis.slice(0, 3).map((e) => (
              <Text key={e} style={styles.compactEmoji}>
                {e}
              </Text>
            ))}
            <Text style={styles.compactCount}>{total}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.actionBtn, myReaction ? styles.actionBtnActive : null]}
          onPress={() => setPickerOpen((v) => !v)}
          activeOpacity={0.85}
        >
          {myReaction ? (
            <Text style={styles.activeEmoji}>{myReaction}</Text>
          ) : (
            <Feather
              name="smile"
              size={16}
              color={COLORS.text.primary}
            />
          )}
          <Text style={styles.actionLabel}>
            {myReaction ? 'Reaccionaste' : 'Reaccionar'}
          </Text>
        </TouchableOpacity>

        {activeEmojis.length > 0 ? (
          <View style={styles.summaryRow}>
            {activeEmojis.slice(0, 4).map((e) => (
              <View key={e} style={styles.summaryChip}>
                <Text style={styles.summaryEmoji}>{e}</Text>
                <Text style={styles.summaryCount}>{reactions[e] ?? 0}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {pickerOpen ? (
        <View style={styles.picker}>
          {REACTION_EMOJIS.map((e) => {
            const isMine = myReaction === e;
            return (
              <TouchableOpacity
                key={e}
                style={[styles.pickerItem, isMine && styles.pickerItemActive]}
                onPress={() => {
                  onToggle(e);
                  setPickerOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerEmoji}>{e}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  actionBtnActive: {
    backgroundColor: COLORS.promotions.pillBg,
    borderColor: COLORS.promotions.pillBg,
  },
  actionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text.primary },
  activeEmoji: { fontSize: 16 },
  summaryRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: COLORS.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  summaryEmoji: { fontSize: 13 },
  summaryCount: { fontSize: 12, fontWeight: '700', color: COLORS.text.primary },
  picker: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: COLORS.ui.white,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  pickerItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemActive: { backgroundColor: COLORS.promotions.pillBg },
  pickerEmoji: { fontSize: 22 },
  compactRow: { flexDirection: 'row', alignItems: 'center' },
  compactBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.light.backgroundSecondary,
  },
  compactEmoji: { fontSize: 13 },
  compactCount: { fontSize: 11, fontWeight: '700', color: COLORS.text.primary, marginLeft: 4 },
});
