import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, THEME } from '@/constants/theme';
import { Product } from '@/types/api';
import { formatMXN } from '@/lib/currency';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onQuickAdd?: () => void;
}

/**
 * Card horizontal de producto. Layout estilo Rappi/UberEats:
 * imagen 100x100, info principal, precio + botón "+" para agregar
 * cuando el producto no tiene opciones obligatorias.
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onQuickAdd,
}) => {
  const isSoldOut = product.status === 'sold_out';
  const hasRequiredOptions = product.optionGroups.some((g) => g.required);
  const canQuickAdd = !!onQuickAdd && !hasRequiredOptions && !isSoldOut;
  const hasOffer =
    typeof product.originalPrice === 'number' && product.originalPrice > product.price;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.container, isSoldOut && styles.containerSoldOut]}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        <Image
          source={product.image ? { uri: product.image } : undefined}
          style={styles.image}
        />
        {hasOffer ? (
          <View style={styles.offerBadge}>
            <Text style={styles.offerText}>OFERTA</Text>
          </View>
        ) : null}
        {isSoldOut ? (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>Agotado</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text numberOfLines={1} style={styles.title}>
            {product.name}
          </Text>
          {product.rating ? (
            <View style={styles.ratingRow}>
              <Feather name="star" size={11} color={COLORS.status.warning} />
              <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {product.description ? (
          <Text numberOfLines={2} style={styles.desc}>
            {product.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {product.prepTime ? (
            <View style={styles.metaItem}>
              <Feather name="clock" size={11} color={COLORS.text.label} />
              <Text style={styles.metaText}>{product.prepTime}</Text>
            </View>
          ) : null}
          {product.tags && product.tags.length > 0 ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{product.tags[0]}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatMXN(product.price)}</Text>
            {hasOffer ? (
              <Text style={styles.priceOriginal}>
                {formatMXN(product.originalPrice as number)}
              </Text>
            ) : null}
          </View>
          {canQuickAdd ? (
            <TouchableOpacity
              onPress={onQuickAdd}
              style={styles.addBtn}
              hitSlop={8}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={18} color={COLORS.ui.white} />
            </TouchableOpacity>
          ) : (
            <Feather name="chevron-right" size={20} color={COLORS.text.label} />
          )}
        </View>
      </View>
    </TouchableOpacity>
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
    shadowColor: THEME.shadows.default.shadowColor,
    shadowOffset: THEME.shadows.default.shadowOffset,
    shadowOpacity: THEME.shadows.default.shadowOpacity,
    shadowRadius: THEME.shadows.default.shadowRadius,
    elevation: THEME.shadows.default.elevation,
  },
  containerSoldOut: {
    opacity: 0.7,
  },
  imageWrap: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.light.backgroundSecondary,
  },
  image: { width: '100%', height: '100%' },
  offerBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.status.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offerText: {
    color: COLORS.ui.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutText: {
    color: COLORS.ui.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  body: { flex: 1, gap: 4 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  desc: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.text.label,
    fontWeight: '500',
  },
  tag: {
    backgroundColor: COLORS.promotions.badgeSuccessBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: COLORS.brand.tealDark,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  priceOriginal: {
    fontSize: 12,
    color: COLORS.text.label,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.brand.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
