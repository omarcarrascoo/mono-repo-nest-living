import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { useAdminStore } from '@/stores/admin-store';
import { BroadcastAudience } from '@/types/api';

interface BroadcastComposerProps {
  visible: boolean;
  onClose: () => void;
}

const AUDIENCE_OPTIONS: {
  key: BroadcastAudience;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  {
    key: 'all',
    label: 'Toda la comunidad',
    description: 'Todos los residentes con la app',
    icon: 'users',
  },
  {
    key: 'unit',
    label: 'Por edificio o unidad',
    description: 'Filtra por prefijo de unidad (ej. A, B-2)',
    icon: 'home',
  },
];

export function BroadcastComposer({ visible, onClose }: BroadcastComposerProps) {
  const sendBroadcast = useAdminStore((s) => s.sendBroadcast);
  const broadcasting = useAdminStore((s) => s.broadcasting);

  const [audience, setAudience] = useState<BroadcastAudience>('all');
  const [unitPrefix, setUnitPrefix] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!visible) {
      setAudience('all');
      setUnitPrefix('');
      setTitle('');
      setBody('');
    }
  }, [visible]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Datos faltantes', 'Necesitamos un título y un mensaje.');
      return;
    }
    if (audience === 'unit' && !unitPrefix.trim()) {
      Alert.alert('Falta el filtro', 'Especifica el prefijo de unidad.');
      return;
    }
    try {
      const res = await sendBroadcast({
        title: title.trim(),
        body: body.trim(),
        audience,
        unitPrefix: audience === 'unit' ? unitPrefix.trim() : undefined,
      });
      Alert.alert('Listo', `Notificación enviada a ${res.sent} dispositivo(s).`);
      onClose();
    } catch (e: any) {
      Alert.alert('No se pudo enviar', e?.message ?? 'Intenta de nuevo.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheet}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="send" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Difusión a residentes</Text>
            <Text style={styles.headerSub}>Llega como push y como inbox in-app.</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Feather name="x" size={20} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionLabel}>¿A quién va?</Text>
          <View style={styles.audienceList}>
            {AUDIENCE_OPTIONS.map((opt) => {
              const active = audience === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setAudience(opt.key)}
                  activeOpacity={0.85}
                  style={[styles.audienceCard, active && styles.audienceCardActive]}
                >
                  <View
                    style={[
                      styles.audienceIcon,
                      active && styles.audienceIconActive,
                    ]}
                  >
                    <Feather
                      name={opt.icon}
                      size={16}
                      color={active ? '#fff' : COLORS.brand.tealDark}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.audienceLabel,
                        active && styles.audienceLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={[
                        styles.audienceDesc,
                        active && styles.audienceDescActive,
                      ]}
                    >
                      {opt.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      active && styles.radioActive,
                    ]}
                  >
                    {active ? (
                      <Feather name="check" size={12} color="#fff" />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {audience === 'unit' ? (
            <View style={styles.unitBlock}>
              <Text style={styles.fieldLabel}>Prefijo de unidad</Text>
              <TextInput
                style={styles.unitInput}
                placeholder="ej. A o B-2"
                placeholderTextColor={COLORS.text.label}
                value={unitPrefix}
                onChangeText={setUnitPrefix}
                autoCapitalize="characters"
                maxLength={12}
              />
              <Text style={styles.fieldHint}>
                Coincide con cualquier unidad cuyo número empiece con esto.
              </Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Mensaje</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Título"
            placeholderTextColor={COLORS.text.label}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
          <Text style={styles.charCount}>{title.length}/80</Text>

          <TextInput
            style={styles.bodyInput}
            placeholder="Cuerpo del mensaje"
            placeholderTextColor={COLORS.text.label}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={300}
          />
          <Text style={styles.charCount}>{body.length}/300</Text>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onClose}
            disabled={broadcasting}
          >
            <Text style={styles.secondaryText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, broadcasting && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={broadcasting}
            activeOpacity={0.9}
          >
            {broadcasting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="send" size={14} color="#fff" />
                <Text style={styles.primaryText}>Enviar difusión</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.ui.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.brand.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary },
  headerSub: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.light.backgroundSecondary,
  },

  body: { padding: 20, paddingBottom: 40, gap: 8 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  audienceList: { gap: 10 },
  audienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    backgroundColor: COLORS.light.card,
  },
  audienceCardActive: {
    borderColor: COLORS.brand.tealDark,
    backgroundColor: COLORS.promotions.pillBg,
  },
  audienceIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.promotions.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audienceIconActive: { backgroundColor: COLORS.brand.tealDark },
  audienceLabel: { fontSize: 14, fontWeight: '800', color: COLORS.text.primary },
  audienceLabelActive: { color: COLORS.brand.tealDark },
  audienceDesc: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  audienceDescActive: { color: COLORS.text.primary },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    backgroundColor: COLORS.brand.tealDark,
    borderColor: COLORS.brand.tealDark,
  },

  unitBlock: { marginTop: 14, gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  unitInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    backgroundColor: COLORS.light.card,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  fieldHint: { fontSize: 11, color: COLORS.text.label, fontStyle: 'italic' },

  divider: {
    height: 1,
    backgroundColor: COLORS.light.border,
    marginVertical: 18,
  },

  titleInput: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    backgroundColor: COLORS.light.card,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  bodyInput: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    backgroundColor: COLORS.light.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text.primary,
    textAlignVertical: 'top',
    marginTop: 10,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.text.label,
    alignSelf: 'flex-end',
    marginTop: 4,
  },

  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
    backgroundColor: COLORS.ui.white,
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: COLORS.light.backgroundSecondary,
  },
  secondaryText: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.brand.tealDark,
  },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
