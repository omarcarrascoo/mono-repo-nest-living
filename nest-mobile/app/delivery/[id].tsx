import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, GRADIENTS, THEME } from '@/constants/theme';
import { useDeliveryStore } from '@/stores/delivery-store';
import { SelectionMap, useCartStore } from '@/stores/cart-store';
import { OptionGroupSection } from '@/components/delivery/OptionGroupSection';
import { QuantityStepper } from '@/components/delivery/QuantityStepper';
import { Product, ProductOptionGroup } from '@/types/api';
import { formatMXN } from '@/lib/currency';

/** Construye la selección inicial respetando los `default: true` de cada grupo. */
function buildInitialSelection(groups: ProductOptionGroup[]): SelectionMap {
  const map: SelectionMap = {};
  for (const g of groups) {
    map[g.id] = g.options.filter((o) => o.default && o.available).map((o) => o.id);
  }
  return map;
}

function selectionUnitPrice(product: Product, selection: SelectionMap): number {
  let price = product.price;
  for (const g of product.optionGroups) {
    for (const optId of selection[g.id] ?? []) {
      const opt = g.options.find((o) => o.id === optId);
      if (opt) price += opt.priceDelta;
    }
  }
  return price;
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cached = useDeliveryStore((s) => (id ? s.byId[id] : undefined));
  const fetchProduct = useDeliveryStore((s) => s.fetchProduct);
  const addProduct = useCartStore((s) => s.addProduct);

  const [product, setProduct] = useState<Product | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const [selection, setSelection] = useState<SelectionMap>(
    cached ? buildInitialSelection(cached.optionGroups) : {},
  );
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (cached) return;
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    fetchProduct(id)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        setSelection(buildInitialSelection(p.optionGroups));
        setLoading(false);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e?.message ?? 'No pudimos cargar el producto');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cached, id, fetchProduct]);

  const unitPrice = useMemo(
    () => (product ? selectionUnitPrice(product, selection) : 0),
    [product, selection],
  );
  const totalPrice = unitPrice * quantity;

  const validation = useMemo(() => {
    if (!product) return { valid: true, missingGroups: [] as string[] };
    const missing = product.optionGroups
      .filter((g) => g.required && (selection[g.id]?.length ?? 0) === 0)
      .map((g) => g.id);
    return { valid: missing.length === 0, missingGroups: missing };
  }, [product, selection]);

  const handleToggle = (group: ProductOptionGroup, optionId: string) => {
    setSelection((prev) => {
      const current = prev[group.id] ?? [];
      if (group.mode === 'single') {
        return { ...prev, [group.id]: [optionId] };
      }
      const isSelected = current.includes(optionId);
      const next = isSelected
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [group.id]: next };
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    setSubmitAttempted(true);
    if (!validation.valid) {
      Alert.alert(
        'Faltan opciones',
        'Selecciona las opciones obligatorias para continuar.',
      );
      return;
    }
    addProduct(product, selection, quantity, notes.trim() || undefined);
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.brand.tealDark} />
      </View>
    );
  }
  if (error || !product) {
    return (
      <View style={[styles.container, styles.center]}>
        <Feather name="alert-circle" size={32} color={COLORS.status.error} />
        <Text style={styles.errorTitle}>Producto no disponible</Text>
        <Text style={styles.errorBody}>{error ?? 'No encontramos este producto.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSoldOut = product.status === 'sold_out';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero image */}
          <View style={styles.hero}>
            <Image
              source={product.image ? { uri: product.image } : undefined}
              style={styles.heroImage}
            />
            <LinearGradient colors={[...GRADIENTS.bottomFade]} style={styles.heroGradient} />

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => router.back()}
              hitSlop={8}
            >
              <Feather name="chevron-left" size={22} color={COLORS.text.primary} />
            </TouchableOpacity>

            {product.tags && product.tags.length > 0 ? (
              <View style={styles.heroTags}>
                {product.tags.map((t) => (
                  <View key={t} style={styles.heroTag}>
                    <Text style={styles.heroTagText}>{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* Info */}
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{product.name}</Text>
              <View style={styles.priceColumn}>
                <Text style={styles.price}>{formatMXN(product.price)}</Text>
                {product.originalPrice && product.originalPrice > product.price ? (
                  <Text style={styles.priceOriginal}>
                    {formatMXN(product.originalPrice)}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.metaRow}>
              {product.rating ? (
                <View style={styles.metaItem}>
                  <Feather name="star" size={13} color={COLORS.status.warning} />
                  <Text style={styles.metaText}>
                    {product.rating.toFixed(1)}
                    {product.reviewCount ? ` · ${product.reviewCount} reseñas` : ''}
                  </Text>
                </View>
              ) : null}
              {product.prepTime ? (
                <View style={styles.metaItem}>
                  <Feather name="clock" size={13} color={COLORS.text.secondary} />
                  <Text style={styles.metaText}>{product.prepTime}</Text>
                </View>
              ) : null}
            </View>

            {product.description ? (
              <Text style={styles.description}>{product.description}</Text>
            ) : null}
          </View>

          {/* Option groups */}
          {product.optionGroups.length > 0 ? (
            <View style={styles.section}>
              {product.optionGroups.map((g) => (
                <OptionGroupSection
                  key={g.id}
                  group={g}
                  selected={selection[g.id] ?? []}
                  onToggle={(optId) => handleToggle(g, optId)}
                  hasError={submitAttempted && validation.missingGroups.includes(g.id)}
                />
              ))}
            </View>
          ) : null}

          {/* Notes */}
          <View style={styles.section}>
            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <Feather name="message-circle" size={16} color={COLORS.text.primary} />
                <Text style={styles.notesTitle}>Comentarios</Text>
                <Text style={styles.notesOptional}>Opcional</Text>
              </View>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Sin cebolla, término medio, etc."
                placeholderTextColor={COLORS.text.placeholder}
                multiline
                style={styles.notesInput}
                maxLength={200}
              />
              <Text style={styles.notesCount}>{notes.length}/200</Text>
            </View>
          </View>

          {/* Quantity */}
          <View style={styles.section}>
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Cantidad</Text>
              <QuantityStepper
                value={quantity}
                min={1}
                max={20}
                onChange={setQuantity}
                size="large"
              />
            </View>
          </View>
        </ScrollView>

        {/* Sticky CTA */}
        <View style={styles.ctaBar}>
          <TouchableOpacity
            style={[styles.ctaBtn, isSoldOut && styles.ctaBtnDisabled]}
            onPress={handleAddToCart}
            disabled={isSoldOut}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>
              {isSoldOut ? 'Agotado' : `Agregar · ${formatMXN(totalPrice)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light.backgroundSecondary },
  center: { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginTop: 8,
  },
  errorBody: { fontSize: 13, color: COLORS.text.secondary, textAlign: 'center' },
  errorBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.brand.tealDark,
  },
  errorBtnText: { color: COLORS.ui.white, fontWeight: '700' },

  scrollContent: { paddingBottom: 140 },
  hero: { position: 'relative', height: 320, backgroundColor: '#000' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.ui.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  heroTags: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    gap: 6,
  },
  heroTag: {
    backgroundColor: COLORS.promotions.overlayGlass,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.promotions.overlayBorder,
  },
  heroTagText: {
    color: COLORS.ui.white,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  body: {
    backgroundColor: COLORS.ui.white,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: -0.4,
  },
  priceColumn: { alignItems: 'flex-end' },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  priceOriginal: {
    fontSize: 13,
    color: COLORS.text.label,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 14,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.text.secondary, fontWeight: '600' },
  description: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },

  section: {
    paddingHorizontal: 24,
    marginTop: 20,
  },

  notesCard: {
    backgroundColor: COLORS.ui.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    gap: 8,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  notesOptional: {
    fontSize: 11,
    color: COLORS.text.label,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  notesInput: {
    minHeight: 70,
    fontSize: 14,
    color: COLORS.text.primary,
    textAlignVertical: 'top',
  },
  notesCount: {
    fontSize: 11,
    color: COLORS.text.label,
    textAlign: 'right',
  },

  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.ui.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  qtyLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
  },

  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    backgroundColor: COLORS.ui.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  ctaBtn: {
    backgroundColor: COLORS.brand.tealDark,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnDisabled: {
    backgroundColor: COLORS.text.label,
  },
  ctaBtnText: {
    color: COLORS.ui.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
