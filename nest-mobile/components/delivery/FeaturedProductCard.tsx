import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, THEME } from '@/constants/theme';
import { FeaturedProduct } from '@/types/api';
import { formatMXN } from '@/lib/currency';

interface FeaturedProductCardProps {
  featured: FeaturedProduct;
  onPress: () => void;
}

/**
 * Hero "destacado del día" — sigue el lenguaje visual de HeroDealCard
 * de cupones para que la consistencia sea inmediata.
 */
export const FeaturedProductCard: React.FC<FeaturedProductCardProps> = ({
  featured,
  onPress,
}) => {
  const { product, headline, subheadline } = featured;
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <ImageBackground
        source={{ uri: product.image }}
        style={styles.image}
        imageStyle={styles.imageInner}
      >
        <LinearGradient colors={[...GRADIENTS.bottomFade]} style={styles.gradient}>
          <View style={styles.tag}>
            <Feather name="zap" size={12} color={COLORS.text.inverse} />
            <Text style={styles.tagText}>Destacado del día</Text>
          </View>

          <View style={styles.bottom}>
            <Text style={styles.eyebrow}>{product.name}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {headline}
            </Text>
            {subheadline ? (
              <Text style={styles.sub} numberOfLines={1}>
                {subheadline}
              </Text>
            ) : null}

            <View style={styles.footer}>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatMXN(product.price)}</Text>
                {product.originalPrice && product.originalPrice > product.price ? (
                  <Text style={styles.priceOriginal}>{formatMXN(product.originalPrice)}</Text>
                ) : null}
              </View>
              <View style={styles.btn}>
                <Text style={styles.btnText}>Pedir ahora</Text>
                <Feather name="arrow-right" size={16} color={COLORS.brand.tealDark} />
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 260,
    width: '100%',
    borderRadius: 24,
    backgroundColor: COLORS.ui.white,
    overflow: 'hidden',
    shadowColor: THEME.shadows.card.shadowColor,
    shadowOffset: THEME.shadows.card.shadowOffset,
    shadowOpacity: THEME.shadows.card.shadowOpacity,
    shadowRadius: THEME.shadows.card.shadowRadius,
    elevation: THEME.shadows.card.elevation,
  },
  image: { flex: 1, justifyContent: 'flex-end' },
  imageInner: { borderRadius: 24 },
  gradient: {
    padding: 20,
    height: '100%',
    justifyContent: 'flex-end',
  },
  tag: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.promotions.overlayGlass,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.promotions.overlayBorder,
  },
  tagText: {
    color: COLORS.text.inverse,
    fontSize: 12,
    fontWeight: '700',
  },
  bottom: { gap: 4 },
  eyebrow: {
    color: COLORS.text.light,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: COLORS.text.inverse,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  sub: {
    color: COLORS.text.light,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: {
    color: COLORS.text.inverse,
    fontSize: 22,
    fontWeight: '800',
  },
  priceOriginal: {
    color: COLORS.text.light,
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  btn: {
    backgroundColor: COLORS.ui.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    color: COLORS.brand.tealDark,
    fontSize: 13,
    fontWeight: '700',
  },
});
