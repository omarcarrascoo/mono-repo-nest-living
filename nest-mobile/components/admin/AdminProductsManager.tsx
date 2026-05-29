import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import {
  Product,
  ProductCategory,
  ProductOption,
  ProductOptionGroup,
  ProductStatus,
} from '@/types/api';
import { useDeliveryStore } from '@/stores/delivery-store';
import { adminService } from '@/services/admin.service';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface AdminProductsManagerProps {
  visible: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: { key: ProductStatus; label: string; color: string }[] = [
  { key: 'available', label: 'Disponible', color: '#16a34a' },
  { key: 'sold_out', label: 'Agotado', color: '#f59e0b' },
  { key: 'hidden', label: 'Oculto', color: '#64748b' },
];

export function AdminProductsManager({ visible, onClose }: AdminProductsManagerProps) {
  const products = useDeliveryStore((s) => s.products);
  const loading = useDeliveryStore((s) => s.loading);
  const fetchAll = useDeliveryStore((s) => s.fetchAll);
  const refresh = useDeliveryStore((s) => s.refresh);

  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    if (visible) {
      void fetchAll({ force: true });
      adminService
        .listProductCategories()
        .then(setCategories)
        .catch(() => setCategories([]));
    }
  }, [visible, fetchAll]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalTitle}>Productos</Text>
            <Text style={styles.modalSubtitle}>
              {products.length} {products.length === 1 ? 'producto' : 'productos'} en el menú
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Feather name="x" size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setCreating(true)}
            activeOpacity={0.85}
          >
            <View style={styles.createIcon}>
              <Feather name="plus" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.createLabel}>Agregar producto</Text>
              <Text style={styles.createSub}>Crea un nuevo platillo</Text>
            </View>
          </TouchableOpacity>

          {loading && products.length === 0 ? (
            <View style={styles.statePad}>
              <ActivityIndicator color={COLORS.brand.tealDark} />
            </View>
          ) : products.length === 0 ? (
            <View style={styles.statePad}>
              <Feather name="package" size={28} color={COLORS.text.label} />
              <Text style={styles.stateTitle}>Aún no tienes productos</Text>
              <Text style={styles.stateBody}>Agrega un platillo para empezar tu menú.</Text>
            </View>
          ) : (
            products.map((product) => (
              <ProductListItem
                key={product.id}
                product={product}
                onEdit={() => setEditing(product)}
                onDelete={async () => {
                  Alert.alert(
                    'Eliminar producto',
                    `Esto borrará "${product.name}" del menú. ¿Continuar?`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await adminService.deleteProduct(product.id);
                            await refresh();
                          } catch (e: any) {
                            Alert.alert(
                              'No se pudo eliminar',
                              e?.message ?? 'Intenta de nuevo.',
                            );
                          }
                        },
                      },
                    ],
                  );
                }}
              />
            ))
          )}
        </ScrollView>
      </View>

      <ProductForm
        visible={creating || !!editing}
        product={editing}
        categories={categories}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={async () => {
          setCreating(false);
          setEditing(null);
          await refresh();
        }}
        onCategoriesChanged={setCategories}
      />
    </Modal>
  );
}

function ProductListItem({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = STATUS_OPTIONS.find((s) => s.key === product.status) ?? STATUS_OPTIONS[0];
  return (
    <View style={styles.productCard}>
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.imagePlaceholder]}>
          <Feather name="image" size={20} color={COLORS.text.label} />
        </View>
      )}
      <View style={styles.productBody}>
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.productPrice}>${(product.price ?? 0).toFixed(0)}</Text>
        <View style={styles.productMetaRow}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={styles.statusText}>{status.label}</Text>
          {product.featured ? (
            <Text style={styles.featuredText}>· Destacado</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionIconBtn}>
          <Feather name="edit-2" size={16} color={COLORS.brand.tealDark} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionIconBtn}>
          <Feather name="trash-2" size={16} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface ProductFormProps {
  visible: boolean;
  product: Product | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSaved: () => void;
  onCategoriesChanged: (categories: ProductCategory[]) => void;
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function genId(prefix: string) {
  // ID estable suficiente para identificar option groups/options en el cliente.
  // No usamos Date.now() para evitar restricciones del sandbox; encadenamos
  // contadores monotónicos con un salt aleatorio simple.
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}
let idSeq = 0;

function ProductForm({
  visible,
  product,
  categories,
  onClose,
  onSaved,
  onCategoriesChanged,
}: ProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [status, setStatus] = useState<ProductStatus>('available');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [featured, setFeatured] = useState(false);
  const [prepTime, setPrepTime] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroup[]>([]);
  const [saving, setSaving] = useState(false);

  // Crear categoría inline
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(product?.name ?? '');
      setDescription(product?.description ?? '');
      setImage(product?.image ?? '');
      setPrice(product?.price != null ? String(product.price) : '');
      setOriginalPrice(
        product?.originalPrice != null ? String(product.originalPrice) : '',
      );
      setStatus(product?.status ?? 'available');
      setCategoryId(product?.categoryId ?? null);
      setFeatured(!!product?.featured);
      setPrepTime(product?.prepTime ?? '');
      setTags(Array.isArray(product?.tags) ? [...product!.tags!] : []);
      setTagDraft('');
      setOptionGroups(
        Array.isArray(product?.optionGroups)
          ? product!.optionGroups.map((g) => ({
              ...g,
              options: g.options.map((o) => ({ ...o })),
            }))
          : [],
      );
      setCreatingCategory(false);
      setNewCategoryName('');
    }
  }, [visible, product]);

  const addTag = () => {
    const v = tagDraft.trim();
    if (!v) return;
    if (v.length > 30) {
      Alert.alert('Tag muy largo', 'Máximo 30 caracteres por tag.');
      return;
    }
    if (tags.includes(v)) {
      setTagDraft('');
      return;
    }
    setTags((t) => [...t, v]);
    setTagDraft('');
  };

  const removeTag = (t: string) => setTags((arr) => arr.filter((x) => x !== t));

  const addOptionGroup = () => {
    setOptionGroups((groups) => [
      ...groups,
      {
        id: genId('grp'),
        name: '',
        mode: 'single',
        required: false,
        options: [
          { id: genId('opt'), name: '', priceDelta: 0, available: true },
        ],
      },
    ]);
  };

  const updateGroup = (
    idx: number,
    patch: Partial<ProductOptionGroup>,
  ) => {
    setOptionGroups((groups) =>
      groups.map((g, i) => (i === idx ? { ...g, ...patch } : g)),
    );
  };

  const removeGroup = (idx: number) => {
    setOptionGroups((groups) => groups.filter((_, i) => i !== idx));
  };

  const addOption = (groupIdx: number) => {
    setOptionGroups((groups) =>
      groups.map((g, i) =>
        i === groupIdx
          ? {
              ...g,
              options: [
                ...g.options,
                {
                  id: genId('opt'),
                  name: '',
                  priceDelta: 0,
                  available: true,
                },
              ],
            }
          : g,
      ),
    );
  };

  const updateOption = (
    groupIdx: number,
    optIdx: number,
    patch: Partial<ProductOption>,
  ) => {
    setOptionGroups((groups) =>
      groups.map((g, i) =>
        i === groupIdx
          ? {
              ...g,
              options: g.options.map((o, oi) =>
                oi === optIdx ? { ...o, ...patch } : o,
              ),
            }
          : g,
      ),
    );
  };

  const removeOption = (groupIdx: number, optIdx: number) => {
    setOptionGroups((groups) =>
      groups.map((g, i) =>
        i === groupIdx
          ? { ...g, options: g.options.filter((_, oi) => oi !== optIdx) }
          : g,
      ),
    );
  };

  const validateOptionGroups = (): string | null => {
    for (let gi = 0; gi < optionGroups.length; gi++) {
      const g = optionGroups[gi];
      if (!g.name.trim()) {
        return `El grupo #${gi + 1} no tiene nombre.`;
      }
      if (g.options.length === 0) {
        return `El grupo "${g.name}" debe tener al menos una opción.`;
      }
      for (let oi = 0; oi < g.options.length; oi++) {
        const o = g.options[oi];
        if (!o.name.trim()) {
          return `Una opción del grupo "${g.name}" no tiene nombre.`;
        }
        if (!Number.isFinite(o.priceDelta ?? 0)) {
          return `El precio extra de "${o.name}" no es válido.`;
        }
      }
    }
    return null;
  };

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (trimmed.length < 1) {
      Alert.alert('Falta el nombre', 'Dale un nombre a la categoría.');
      return;
    }
    const slug = slugify(trimmed);
    if (!slug) {
      Alert.alert(
        'Nombre inválido',
        'Usa letras o números — el slug interno no se pudo generar.',
      );
      return;
    }
    if (categories.some((c) => c.slug === slug)) {
      Alert.alert(
        'Categoría duplicada',
        'Ya existe una categoría con ese nombre. Selecciónala de la lista.',
      );
      return;
    }
    setSavingCategory(true);
    try {
      const created = await adminService.createProductCategory({
        name: trimmed,
        slug,
        icon: 'package',
      });
      const next = [...categories, created].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      );
      onCategoriesChanged(next);
      setCategoryId(created.id);
      setCreatingCategory(false);
      setNewCategoryName('');
    } catch (e: any) {
      Alert.alert(
        'No se pudo crear',
        e?.message ?? 'Intenta con otro nombre.',
      );
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Por favor da un nombre al producto.');
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      Alert.alert('Precio inválido', 'Captura un precio válido en MXN.');
      return;
    }
    let originalPriceNum: number | undefined;
    if (originalPrice.trim()) {
      const parsed = Number(originalPrice);
      if (!Number.isFinite(parsed) || parsed < 0) {
        Alert.alert(
          'Precio anterior inválido',
          'Si capturas un precio anterior debe ser un número ≥ 0.',
        );
        return;
      }
      if (parsed <= priceNum) {
        Alert.alert(
          'Precio anterior',
          'El precio anterior debe ser mayor al precio actual para mostrar la oferta.',
        );
        return;
      }
      originalPriceNum = parsed;
    }
    if (!categoryId) {
      Alert.alert('Falta categoría', 'Selecciona una categoría para el producto.');
      return;
    }
    const groupErr = validateOptionGroups();
    if (groupErr) {
      Alert.alert('Revisa las opciones', groupErr);
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<Product> = {
        name: name.trim(),
        description: description.trim(),
        image: image.trim(),
        price: priceNum,
        status,
        categoryId,
        featured,
      };
      if (prepTime.trim()) payload.prepTime = prepTime.trim();
      if (originalPriceNum !== undefined) {
        payload.originalPrice = originalPriceNum;
      }
      if (tags.length > 0) payload.tags = tags;
      // Siempre mandamos optionGroups (incluyendo array vacío) si los editamos.
      payload.optionGroups = optionGroups.map((g) => ({
        id: g.id,
        name: g.name.trim(),
        mode: g.mode,
        required: !!g.required,
        ...(g.maxSelections ? { maxSelections: g.maxSelections } : {}),
        options: g.options.map((o) => ({
          id: o.id,
          name: o.name.trim(),
          priceDelta: Number(o.priceDelta ?? 0),
          available: o.available !== false,
          ...(o.default ? { default: true } : {}),
        })),
      }));

      if (product) {
        await adminService.updateProduct(product.id, payload);
      } else {
        await adminService.createProduct(payload);
      }
      onSaved();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e?.message ?? 'Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.formBackdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.formSheet}
      >
        <View style={styles.formHandle} />
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>{product ? 'Editar producto' : 'Nuevo producto'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Feather name="x" size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormField label="Nombre">
            <TextInput
              style={styles.input}
              placeholder="Ej. Pizza margarita"
              placeholderTextColor={COLORS.text.label}
              value={name}
              onChangeText={setName}
            />
          </FormField>

          <FormField label="Descripción">
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Una breve descripción"
              placeholderTextColor={COLORS.text.label}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </FormField>

          <ImageUploader
            label="Imagen"
            value={image || undefined}
            onChange={(url) => setImage(url ?? '')}
            kind="product"
            aspectRatio={4 / 3}
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormField label="Precio (MXN) *">
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={COLORS.text.label}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </FormField>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Antes (oferta)">
                <TextInput
                  style={styles.input}
                  placeholder="opcional"
                  placeholderTextColor={COLORS.text.label}
                  value={originalPrice}
                  onChangeText={setOriginalPrice}
                  keyboardType="decimal-pad"
                />
              </FormField>
            </View>
          </View>

          <FormField label="Tiempo de preparación">
            <TextInput
              style={styles.input}
              placeholder="Ej. 20-30 min"
              placeholderTextColor={COLORS.text.label}
              value={prepTime}
              onChangeText={setPrepTime}
            />
          </FormField>

          <FormField label="Tags">
            <View style={styles.tagsRow}>
              {tags.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.tagChip}
                  onPress={() => removeTag(t)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.tagChipText}>{t}</Text>
                  <Feather name="x" size={12} color={COLORS.brand.tealDark} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tagInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ej. picante, vegano, sin gluten"
                placeholderTextColor={COLORS.text.label}
                value={tagDraft}
                onChangeText={setTagDraft}
                onSubmitEditing={addTag}
                returnKeyType="done"
                maxLength={30}
              />
              <TouchableOpacity
                style={styles.tagAddBtn}
                onPress={addTag}
                disabled={!tagDraft.trim()}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              Toca un tag para borrarlo. Aparecen en la card del producto.
            </Text>
          </FormField>

          <FormField label="Estado">
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((opt) => {
                const active = status === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setStatus(opt.key)}
                    style={[
                      styles.statusChip,
                      active && { backgroundColor: opt.color, borderColor: opt.color },
                    ]}
                  >
                    <Text
                      style={[styles.statusChipText, active && { color: '#fff' }]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FormField>

          <FormField label="Categoría *">
            <View style={styles.categoryRow}>
              {categories.map((c) => {
                const active = categoryId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        active && styles.categoryChipTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {!creatingCategory ? (
                <TouchableOpacity
                  style={styles.newCategoryChip}
                  onPress={() => setCreatingCategory(true)}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={14} color={COLORS.brand.tealDark} />
                  <Text style={styles.newCategoryChipText}>Nueva</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {creatingCategory ? (
              <View style={styles.newCategoryBox}>
                <View style={styles.newCategoryRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Ej. Bebidas, Postres…"
                    placeholderTextColor={COLORS.text.label}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    autoFocus
                    maxLength={60}
                  />
                  <TouchableOpacity
                    onPress={handleCreateCategory}
                    disabled={savingCategory}
                    style={[styles.newCategoryBtn, savingCategory && { opacity: 0.6 }]}
                    activeOpacity={0.85}
                  >
                    {savingCategory ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Feather name="check" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setCreatingCategory(false);
                      setNewCategoryName('');
                    }}
                    disabled={savingCategory}
                    style={styles.newCategoryCancelBtn}
                    activeOpacity={0.85}
                  >
                    <Feather name="x" size={16} color={COLORS.text.label} />
                  </TouchableOpacity>
                </View>
                {newCategoryName.trim() ? (
                  <Text style={styles.newCategoryHint}>
                    Se guardará como “{newCategoryName.trim()}” (slug:{' '}
                    {slugify(newCategoryName.trim())})
                  </Text>
                ) : null}
              </View>
            ) : null}

            {categories.length === 0 && !creatingCategory ? (
              <Text style={styles.newCategoryHint}>
                Aún no tienes categorías. Toca “Nueva” para crear la primera.
              </Text>
            ) : null}
          </FormField>

          <FormField label="Opciones del producto">
            <Text style={styles.helperText}>
              Crea grupos de opciones (ej. tamaño, salsa, extras). En cada grupo
              defines si el residente elige uno o varios.
            </Text>

            {optionGroups.map((g, gi) => (
              <View key={g.id} style={styles.groupBox}>
                <View style={styles.groupHeader}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Nombre del grupo (ej. Tamaño)"
                    placeholderTextColor={COLORS.text.label}
                    value={g.name}
                    onChangeText={(v: string) => updateGroup(gi, { name: v })}
                    maxLength={80}
                  />
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removeGroup(gi)}
                    hitSlop={6}
                    activeOpacity={0.85}
                  >
                    <Feather name="trash-2" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>

                <View style={styles.groupModeRow}>
                  <TouchableOpacity
                    onPress={() => updateGroup(gi, { mode: 'single' })}
                    style={[
                      styles.modeChip,
                      g.mode === 'single' && styles.modeChipActive,
                    ]}
                  >
                    <Feather
                      name="circle"
                      size={12}
                      color={g.mode === 'single' ? '#fff' : COLORS.text.primary}
                    />
                    <Text
                      style={[
                        styles.modeChipText,
                        g.mode === 'single' && styles.modeChipTextActive,
                      ]}
                    >
                      Elige uno
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateGroup(gi, { mode: 'multiple' })}
                    style={[
                      styles.modeChip,
                      g.mode === 'multiple' && styles.modeChipActive,
                    ]}
                  >
                    <Feather
                      name="check-square"
                      size={12}
                      color={
                        g.mode === 'multiple' ? '#fff' : COLORS.text.primary
                      }
                    />
                    <Text
                      style={[
                        styles.modeChipText,
                        g.mode === 'multiple' && styles.modeChipTextActive,
                      ]}
                    >
                      Varios
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateGroup(gi, { required: !g.required })}
                    style={[
                      styles.modeChip,
                      g.required && styles.modeChipActiveAlt,
                    ]}
                  >
                    <Feather
                      name={g.required ? 'check-circle' : 'circle'}
                      size={12}
                      color={g.required ? '#fff' : COLORS.text.primary}
                    />
                    <Text
                      style={[
                        styles.modeChipText,
                        g.required && styles.modeChipTextActive,
                      ]}
                    >
                      Obligatorio
                    </Text>
                  </TouchableOpacity>
                </View>

                {g.mode === 'multiple' ? (
                  <View style={styles.maxSelRow}>
                    <Text style={styles.maxSelLabel}>Máx. selecciones:</Text>
                    <TextInput
                      style={styles.maxSelInput}
                      keyboardType="number-pad"
                      placeholder="∞"
                      placeholderTextColor={COLORS.text.label}
                      value={
                        g.maxSelections != null ? String(g.maxSelections) : ''
                      }
                      onChangeText={(v: string) => {
                        const n = Number(v);
                        updateGroup(gi, {
                          maxSelections:
                            v.trim() && Number.isFinite(n) && n > 0
                              ? n
                              : undefined,
                        });
                      }}
                    />
                  </View>
                ) : null}

                {g.options.map((o, oi) => (
                  <View key={o.id} style={styles.optionRow}>
                    <TouchableOpacity
                      onPress={() =>
                        updateOption(gi, oi, { available: !o.available })
                      }
                      style={[
                        styles.availDot,
                        !o.available && styles.availDotOff,
                      ]}
                      hitSlop={6}
                    >
                      <Feather
                        name={o.available ? 'check' : 'x'}
                        size={11}
                        color="#fff"
                      />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Nombre de la opción"
                      placeholderTextColor={COLORS.text.label}
                      value={o.name}
                      onChangeText={(v: string) => updateOption(gi, oi, { name: v })}
                      maxLength={60}
                    />
                    <TextInput
                      style={[styles.input, styles.priceDeltaInput]}
                      placeholder="+0"
                      placeholderTextColor={COLORS.text.label}
                      value={
                        o.priceDelta != null && o.priceDelta !== 0
                          ? String(o.priceDelta)
                          : ''
                      }
                      onChangeText={(v: string) =>
                        updateOption(gi, oi, {
                          priceDelta: v.trim() ? Number(v) : 0,
                        })
                      }
                      keyboardType="numbers-and-punctuation"
                    />
                    <TouchableOpacity
                      onPress={() => removeOption(gi, oi)}
                      hitSlop={6}
                      style={styles.deleteOptBtn}
                    >
                      <Feather name="x" size={14} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addOptionBtn}
                  onPress={() => addOption(gi)}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={14} color={COLORS.brand.tealDark} />
                  <Text style={styles.addOptionBtnText}>Agregar opción</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addGroupBtn}
              onPress={addOptionGroup}
              activeOpacity={0.85}
            >
              <Feather name="plus-circle" size={16} color="#fff" />
              <Text style={styles.addGroupBtnText}>
                {optionGroups.length === 0
                  ? 'Agregar grupo de opciones'
                  : 'Agregar otro grupo'}
              </Text>
            </TouchableOpacity>
          </FormField>

          <TouchableOpacity
            style={styles.featuredToggle}
            onPress={() => setFeatured(!featured)}
            activeOpacity={0.85}
          >
            <View style={styles.featuredLeft}>
              <View style={[styles.featuredIcon, featured && { backgroundColor: '#fef3c7' }]}>
                <Feather name="star" size={16} color={featured ? '#f59e0b' : COLORS.text.label} />
              </View>
              <View>
                <Text style={styles.featuredTitle}>Destacado del día</Text>
                <Text style={styles.featuredSub}>
                  Aparece en la sección destacada del menú
                </Text>
              </View>
            </View>
            <View style={[styles.toggle, featured && styles.toggleOn]}>
              <View style={[styles.toggleKnob, featured && styles.toggleKnobOn]} />
            </View>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.formFooter}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
            <Text style={styles.secondaryBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{product ? 'Guardar' : 'Crear'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: COLORS.ui.lightSheet },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: COLORS.light.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text.primary },
  modalSubtitle: { fontSize: 12, color: COLORS.text.label, marginTop: 2 },
  modalContent: { padding: 20, gap: 12, paddingBottom: 40 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.brand.tealDark,
  },
  createIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  createSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
  },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productBody: { flex: 1, gap: 4 },
  productName: { fontSize: 15, fontWeight: '600', color: COLORS.text.primary },
  productPrice: { fontSize: 14, fontWeight: '700', color: COLORS.brand.tealDark },
  productMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600', color: COLORS.text.label },
  featuredText: { fontSize: 11, color: '#f59e0b', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 6 },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statePad: { paddingTop: 48, alignItems: 'center', gap: 8 },
  stateTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary },
  stateBody: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  formBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  formSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '92%',
    backgroundColor: COLORS.ui.lightSheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
  },
  formHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginBottom: 12,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  formTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.text.primary },
  formContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },

  field: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  inputMultiline: { minHeight: 84, textAlignVertical: 'top' },

  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  statusChipText: { fontSize: 12, fontWeight: '600', color: COLORS.text.primary },

  categoryRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  categoryChipActive: { backgroundColor: COLORS.brand.tealDark, borderColor: COLORS.brand.tealDark },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: COLORS.text.primary },
  categoryChipTextActive: { color: '#fff' },

  newCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: COLORS.brand.tealDark,
    borderStyle: 'dashed',
  },
  newCategoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand.tealDark,
  },
  newCategoryBox: {
    marginTop: 12,
    gap: 8,
  },
  newCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newCategoryBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.brand.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCategoryCancelBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCategoryHint: {
    fontSize: 12,
    color: COLORS.text.label,
    paddingHorizontal: 4,
  },

  helperText: {
    fontSize: 12,
    color: COLORS.text.label,
    paddingHorizontal: 4,
    marginBottom: 8,
  },

  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: COLORS.brand.tealDark,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brand.tealDark,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  tagAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.brand.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  groupBox: {
    backgroundColor: COLORS.light.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    gap: 10,
    marginBottom: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupModeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  modeChipActive: {
    backgroundColor: COLORS.brand.tealDark,
    borderColor: COLORS.brand.tealDark,
  },
  modeChipActiveAlt: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
  },
  modeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  modeChipTextActive: { color: '#fff' },

  maxSelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  maxSelLabel: {
    fontSize: 12,
    color: COLORS.text.label,
    fontWeight: '600',
  },
  maxSelInput: {
    width: 60,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    textAlign: 'center',
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availDotOff: {
    backgroundColor: '#94a3b8',
  },
  priceDeltaInput: {
    width: 70,
    textAlign: 'center',
  },
  deleteOptBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: COLORS.brand.tealDark,
    borderStyle: 'dashed',
  },
  addOptionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand.tealDark,
  },
  addGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.brand.tealDark,
  },
  addGroupBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  featuredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.light.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  featuredLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  featuredIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  featuredSub: { fontSize: 11, color: COLORS.text.label, marginTop: 2 },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#cbd5e1',
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: COLORS.brand.tealDark },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleKnobOn: { transform: [{ translateX: 18 }] },

  formFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
    backgroundColor: COLORS.light.card,
  },
  secondaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  secondaryBtnText: { color: COLORS.text.primary, fontWeight: '600', fontSize: 14 },
  primaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.brand.tealDark,
    minWidth: 110,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
