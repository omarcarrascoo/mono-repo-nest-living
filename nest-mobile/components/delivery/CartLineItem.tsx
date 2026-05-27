import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { CartItem } from '@/types/api';
import { formatMXN } from '@/lib/currency';
import { QuantityStepper } from './QuantityStepper';

interface CartLineItemProps {
  item: CartItem;
  onChangeQuantity: (q: number) => void;
  onRemove: () => void;
}

export const CartLineItem: React.FC<CartLineItemProps> = ({
  item,
  onChangeQuantity,
  onRemove,
}) => {
  const modifiersLine = item.modifiers
    .filter((m) => m.priceDelta !== 0 || true) // mostramos todas para que el usuario vea su selección
    .map((m) => m.optionName)
    .join(' · ');

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text numberOfLines={1} style={styles.title}>
            {item.name}
          </Text>
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Feather name="trash-2" size={16} color={COLORS.text.label} />
          </TouchableOpacity>
        </View>

        {modifiersLine ? (
          <Text numberOfLines={2} style={styles.modifiers}>
            {modifiersLine}
          </Text>
        ) : null}

        {item.notes ? (
          <Text numberOfLines={1} style={styles.notes}>
            “{item.notes}”
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.price}>{formatMXN(item.lineTotal)}</Text>
          <QuantityStepper
            value={item.quantity}
            min={1}
            onChange={onChangeQuantity}
            size="compact"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.ui.white,
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: COLORS.light.backgroundSecondary,
  },
  body: { flex: 1, gap: 4 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  modifiers: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 16,
  },
  notes: {
    fontSize: 12,
    color: COLORS.text.label,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
});
