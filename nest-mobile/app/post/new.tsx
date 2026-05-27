import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';
import { useCommunityStore } from '@/stores/community-store';
import { CommunityPostType, CreatePostRequest } from '@/types/api';

const TAG_SUGGESTIONS_RESIDENT = [
  'Ayuda',
  'Pregunta',
  'Recomendación',
  'Espacios',
  'Mascotas',
  'Eventos',
];

const TAG_SUGGESTIONS_ADMIN = [
  'Mantenimiento',
  'Seguridad',
  'Pagos',
  'Eventos',
  'Servicios',
  'Importante',
];

export default function NewPostScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const createPost = useCommunityStore((s) => s.createPost);

  const [type, setType] = useState<CommunityPostType>(
    isAdmin ? 'announcement' : 'post',
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('');
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tagSuggestions = isAdmin ? TAG_SUGGESTIONS_ADMIN : TAG_SUGGESTIONS_RESIDENT;

  const canSubmit =
    title.trim().length >= 3 && content.trim().length >= 3 && !submitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload: CreatePostRequest = {
        type,
        title: title.trim(),
        content: content.trim(),
        tag: tag.trim() || undefined,
        pinned: isAdmin ? pinned : undefined,
      };
      const created = await createPost(payload);
      router.replace(`/post/${created.id}` as never);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No pudimos publicar');
      setSubmitting(false);
    }
  }, [canSubmit, type, title, content, tag, pinned, isAdmin, createPost, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          hitSlop={8}
        >
          <Feather name="x" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva publicación</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[
            styles.submitBtn,
            !canSubmit && styles.submitBtnDisabled,
          ]}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.ui.white} />
          ) : (
            <Text style={styles.submitText}>Publicar</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {isAdmin ? (
            <View style={styles.typeRow}>
              <TypeChip
                active={type === 'announcement'}
                icon="bell"
                label="Aviso oficial"
                onPress={() => setType('announcement')}
              />
              <TypeChip
                active={type === 'post'}
                icon="message-circle"
                label="Publicación"
                onPress={() => setType('post')}
              />
            </View>
          ) : null}

          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.titleInput}
            placeholder={
              type === 'announcement'
                ? 'Ej: Mantenimiento de elevadores'
                : 'Ej: ¿Alguien recomienda un plomero?'
            }
            placeholderTextColor={COLORS.text.placeholder}
            value={title}
            onChangeText={setTitle}
            maxLength={140}
            multiline
          />

          <Text style={styles.label}>Mensaje</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="Escribe lo que quieres compartir con tu comunidad…"
            placeholderTextColor={COLORS.text.placeholder}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={5000}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Etiqueta (opcional)</Text>
          <TextInput
            style={styles.tagInput}
            placeholder="Ej: Ayuda, Mantenimiento…"
            placeholderTextColor={COLORS.text.placeholder}
            value={tag}
            onChangeText={setTag}
            maxLength={32}
          />
          <View style={styles.tagSuggestions}>
            {tagSuggestions.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTag(t)}
                style={[
                  styles.tagSuggestion,
                  tag === t && styles.tagSuggestionActive,
                ]}
              >
                <Text
                  style={[
                    styles.tagSuggestionText,
                    tag === t && styles.tagSuggestionTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isAdmin && type === 'announcement' ? (
            <TouchableOpacity
              style={[styles.pinRow, pinned && styles.pinRowActive]}
              onPress={() => setPinned((p) => !p)}
              activeOpacity={0.85}
            >
              <View style={styles.pinIconWrap}>
                <Feather
                  name="bookmark"
                  size={16}
                  color={pinned ? COLORS.brand.tealDark : COLORS.text.label}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pinTitle}>Anclar al inicio</Text>
                <Text style={styles.pinSubtitle}>
                  El aviso aparecerá hasta arriba del muro hasta que lo desancles.
                </Text>
              </View>
              <View
                style={[styles.toggle, pinned && styles.toggleOn]}
              >
                <View
                  style={[
                    styles.toggleDot,
                    pinned && styles.toggleDotOn,
                  ]}
                />
              </View>
            </TouchableOpacity>
          ) : null}

          {type === 'announcement' && isAdmin ? (
            <View style={styles.disclaimer}>
              <Feather name="shield" size={14} color={COLORS.brand.tealDark} />
              <Text style={styles.disclaimerText}>
                Este aviso se enviará como notificación a todos los vecinos.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

interface TypeChipProps {
  active: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}

const TypeChip: React.FC<TypeChipProps> = ({ active, icon, label, onPress }) => (
  <TouchableOpacity
    style={[styles.typeChip, active && styles.typeChipActive]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Feather
      name={icon}
      size={14}
      color={active ? COLORS.ui.white : COLORS.brand.tealDark}
    />
    <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ui.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 18,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  submitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: COLORS.brand.tealDark,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: COLORS.ui.white, fontWeight: '800', fontSize: 13 },

  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.brand.tealDark,
    backgroundColor: COLORS.ui.white,
  },
  typeChipActive: {
    backgroundColor: COLORS.brand.tealDark,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brand.tealDark,
  },
  typeChipTextActive: { color: COLORS.ui.white },

  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 14,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.light.backgroundSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    minHeight: 48,
  },
  contentInput: {
    fontSize: 15,
    color: COLORS.text.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.light.backgroundSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    minHeight: 160,
    lineHeight: 22,
  },
  tagInput: {
    fontSize: 14,
    color: COLORS.text.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.light.backgroundSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    minHeight: 44,
  },
  tagSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagSuggestion: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    backgroundColor: COLORS.ui.white,
  },
  tagSuggestionActive: {
    backgroundColor: COLORS.promotions.pillBg,
    borderColor: COLORS.brand.tealDark,
  },
  tagSuggestionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  tagSuggestionTextActive: { color: COLORS.brand.tealDark },

  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    backgroundColor: COLORS.ui.white,
  },
  pinRowActive: {
    borderColor: COLORS.brand.tealDark,
    backgroundColor: COLORS.promotions.pillBg,
  },
  pinIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.light.backgroundSecondary,
  },
  pinTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text.primary },
  pinSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  toggle: {
    width: 36,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.light.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: COLORS.brand.tealDark },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.ui.white,
  },
  toggleDotOn: { transform: [{ translateX: 14 }] },

  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.promotions.pillBg,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brand.tealDark,
  },
});
