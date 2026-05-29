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
import { Amenity, AmenityStatus, DaySchedule, WeeklySchedule } from '@/types/api';
import { useAmenitiesStore } from '@/stores/amenities-store';
import { useCategoriesStore } from '@/stores/categories-store';
import { adminService } from '@/services/admin.service';

interface AdminAmenitiesManagerProps {
  visible: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: { key: AmenityStatus; label: string; color: string }[] = [
  { key: 'available', label: 'Disponible', color: '#16a34a' },
  { key: 'busy', label: 'Ocupada', color: '#f59e0b' },
  { key: 'maintenance', label: 'Mantenimiento', color: '#ef4444' },
];

export function AdminAmenitiesManager({ visible, onClose }: AdminAmenitiesManagerProps) {
  const items = useAmenitiesStore((s) => s.items);
  const loading = useAmenitiesStore((s) => s.loading);
  const fetchAll = useAmenitiesStore((s) => s.fetchAll);
  const refresh = useAmenitiesStore((s) => s.refresh);

  const [editing, setEditing] = useState<Amenity | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible) {
      void fetchAll({ force: true });
    }
  }, [visible, fetchAll]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalTitle}>Amenidades</Text>
            <Text style={styles.modalSubtitle}>
              {items.length} {items.length === 1 ? 'espacio' : 'espacios'} en tu residencia
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
              <Text style={styles.createLabel}>Agregar amenidad</Text>
              <Text style={styles.createSub}>Crea un nuevo espacio reservable</Text>
            </View>
          </TouchableOpacity>

          {loading && items.length === 0 ? (
            <View style={styles.statePad}>
              <ActivityIndicator color={COLORS.brand.tealDark} />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.statePad}>
              <Feather name="grid" size={28} color={COLORS.text.label} />
              <Text style={styles.stateTitle}>Aún no tienes amenidades</Text>
              <Text style={styles.stateBody}>
                Agrega un espacio para que tus residentes puedan reservarlo.
              </Text>
            </View>
          ) : (
            items.map((amenity) => (
              <AmenityListItem
                key={amenity.id}
                amenity={amenity}
                onEdit={() => setEditing(amenity)}
                onDelete={async () => {
                  Alert.alert(
                    'Eliminar amenidad',
                    `Esto borrará "${amenity.title}" de tu residencia. ¿Continuar?`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await adminService.deleteAmenity(amenity.id);
                            await refresh();
                          } catch (e: any) {
                            Alert.alert('No se pudo eliminar', e?.message ?? 'Intenta de nuevo.');
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

      <AmenityForm
        visible={creating || !!editing}
        amenity={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={async () => {
          setCreating(false);
          setEditing(null);
          await refresh();
        }}
      />
    </Modal>
  );
}

function AmenityListItem({
  amenity,
  onEdit,
  onDelete,
}: {
  amenity: Amenity;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = STATUS_OPTIONS.find((s) => s.key === amenity.status) ?? STATUS_OPTIONS[0];

  return (
    <View style={styles.amenityCard}>
      {amenity.image ? (
        <Image source={{ uri: amenity.image }} style={styles.amenityImage} />
      ) : (
        <View style={[styles.amenityImage, styles.imagePlaceholder]}>
          <Feather name="image" size={20} color={COLORS.text.label} />
        </View>
      )}
      <View style={styles.amenityBody}>
        <Text style={styles.amenityTitle} numberOfLines={1}>
          {amenity.title}
        </Text>
        {amenity.location ? (
          <Text style={styles.amenityLocation} numberOfLines={1}>
            <Feather name="map-pin" size={11} color={COLORS.text.label} /> {amenity.location}
          </Text>
        ) : null}
        <View style={styles.amenityMetaRow}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={styles.statusText}>{status.label}</Text>
          {amenity.capacity ? (
            <Text style={styles.metaText}>· cap. {amenity.capacity}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.amenityActions}>
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

interface AmenityFormProps {
  visible: boolean;
  amenity: Amenity | null;
  onClose: () => void;
  onSaved: () => void;
}

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: 'mon', label: 'Lunes', short: 'L' },
  { key: 'tue', label: 'Martes', short: 'M' },
  { key: 'wed', label: 'Miércoles', short: 'X' },
  { key: 'thu', label: 'Jueves', short: 'J' },
  { key: 'fri', label: 'Viernes', short: 'V' },
  { key: 'sat', label: 'Sábado', short: 'S' },
  { key: 'sun', label: 'Domingo', short: 'D' },
];

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function defaultDay(): DaySchedule {
  return { open: '08:00', close: '22:00', closed: false };
}

function defaultSchedule(): WeeklySchedule {
  return {
    mon: defaultDay(),
    tue: defaultDay(),
    wed: defaultDay(),
    thu: defaultDay(),
    fri: defaultDay(),
    sat: defaultDay(),
    sun: defaultDay(),
  };
}

/** Auto-formato del input al teclear: "1234" → "12:34", "9" → "9", "9:" mantiene. */
function formatTimeInput(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** Devuelve true si todos los días tienen el mismo horario (incluyendo `closed`). */
function isUniformSchedule(s: WeeklySchedule): boolean {
  const ref = s.mon;
  return DAYS.every(({ key }) => {
    const d = s[key];
    return (
      d.open === ref.open &&
      d.close === ref.close &&
      d.closed === ref.closed
    );
  });
}

function AmenityForm({ visible, amenity, onClose, onSaved }: AmenityFormProps) {
  const categories = useCategoriesStore((s) => s.items);
  const fetchCategories = useCategoriesStore((s) => s.fetchAll);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState<AmenityStatus>('available');
  const [capacity, setCapacity] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<WeeklySchedule>(defaultSchedule);
  const [scheduleMode, setScheduleMode] = useState<'uniform' | 'custom'>('uniform');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      void fetchCategories();
    }
  }, [visible, fetchCategories]);

  useEffect(() => {
    if (visible) {
      setTitle(amenity?.title ?? '');
      setDescription(amenity?.description ?? '');
      setLocation(amenity?.location ?? '');
      setImage(amenity?.image ?? '');
      setStatus(amenity?.status ?? 'available');
      setCapacity(amenity?.capacity ? String(amenity.capacity) : '');
      setCategoryId(amenity?.categoryId ?? null);
      const initial = amenity?.schedule ?? defaultSchedule();
      setSchedule(initial);
      setScheduleMode(isUniformSchedule(initial) ? 'uniform' : 'custom');
    }
  }, [visible, amenity]);

  const updateDay = (day: DayKey, patch: Partial<DaySchedule>) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  const updateAllDays = (patch: Partial<DaySchedule>) => {
    setSchedule((prev) => {
      const next = { ...prev };
      for (const { key } of DAYS) {
        next[key] = { ...next[key], ...patch };
      }
      return next;
    });
  };

  const validateSchedule = (s: WeeklySchedule): string | null => {
    for (const { key, label } of DAYS) {
      const d = s[key];
      if (d.closed) continue;
      if (!HHMM_RE.test(d.open) || !HHMM_RE.test(d.close)) {
        return `${label}: usa el formato HH:mm (ej. 08:00).`;
      }
      if (d.open >= d.close) {
        return `${label}: la hora de cierre debe ser mayor a la de apertura.`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Falta el título', 'Por favor da un nombre a la amenidad.');
      return;
    }
    const scheduleError = validateSchedule(schedule);
    if (scheduleError) {
      Alert.alert('Horario inválido', scheduleError);
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<Amenity> = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        image: image.trim(),
        status,
        schedule,
      };
      if (capacity.trim()) {
        const n = Number(capacity.trim());
        if (Number.isFinite(n) && n > 0) payload.capacity = n;
      }
      if (categoryId) payload.categoryId = categoryId;

      if (amenity) {
        await adminService.updateAmenity(amenity.id, payload);
      } else {
        await adminService.createAmenity(payload);
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
          <Text style={styles.formTitle}>{amenity ? 'Editar amenidad' : 'Nueva amenidad'}</Text>
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
              placeholder="Ej. Salón de eventos"
              placeholderTextColor={COLORS.text.label}
              value={title}
              onChangeText={setTitle}
            />
          </FormField>

          <FormField label="Descripción">
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Una breve descripción para tus residentes"
              placeholderTextColor={COLORS.text.label}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </FormField>

          <FormField label="Ubicación">
            <TextInput
              style={styles.input}
              placeholder="Ej. Planta baja, Torre A"
              placeholderTextColor={COLORS.text.label}
              value={location}
              onChangeText={setLocation}
            />
          </FormField>

          <FormField label="URL de imagen">
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={COLORS.text.label}
              value={image}
              onChangeText={setImage}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </FormField>

          <FormField label="Capacidad">
            <TextInput
              style={styles.input}
              placeholder="Número de personas"
              placeholderTextColor={COLORS.text.label}
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="numeric"
            />
          </FormField>

          <FormField label="Horario">
            <View style={styles.scheduleModeRow}>
              <TouchableOpacity
                style={[
                  styles.scheduleModeBtn,
                  scheduleMode === 'uniform' && styles.scheduleModeBtnActive,
                ]}
                onPress={() => {
                  // Al cambiar a uniform, copia mon a todos los días para que
                  // el toggle no pierda info inadvertidamente.
                  if (scheduleMode !== 'uniform') {
                    updateAllDays(schedule.mon);
                  }
                  setScheduleMode('uniform');
                }}
                activeOpacity={0.85}
              >
                <Feather
                  name="clock"
                  size={14}
                  color={
                    scheduleMode === 'uniform' ? '#fff' : COLORS.text.primary
                  }
                />
                <Text
                  style={[
                    styles.scheduleModeText,
                    scheduleMode === 'uniform' && styles.scheduleModeTextActive,
                  ]}
                >
                  Mismo horario todos los días
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.scheduleModeBtn,
                  scheduleMode === 'custom' && styles.scheduleModeBtnActive,
                ]}
                onPress={() => setScheduleMode('custom')}
                activeOpacity={0.85}
              >
                <Feather
                  name="calendar"
                  size={14}
                  color={
                    scheduleMode === 'custom' ? '#fff' : COLORS.text.primary
                  }
                />
                <Text
                  style={[
                    styles.scheduleModeText,
                    scheduleMode === 'custom' && styles.scheduleModeTextActive,
                  ]}
                >
                  Por día
                </Text>
              </TouchableOpacity>
            </View>

            {scheduleMode === 'uniform' ? (
              <View style={styles.uniformRow}>
                <TimeInput
                  label="Abre"
                  value={schedule.mon.open}
                  onChangeText={(v) =>
                    updateAllDays({ open: formatTimeInput(v) })
                  }
                />
                <Feather name="arrow-right" size={16} color={COLORS.text.label} />
                <TimeInput
                  label="Cierra"
                  value={schedule.mon.close}
                  onChangeText={(v) =>
                    updateAllDays({ close: formatTimeInput(v) })
                  }
                />
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {DAYS.map(({ key, label }) => {
                  const d = schedule[key];
                  return (
                    <View
                      key={key}
                      style={[
                        styles.dayRow,
                        d.closed && styles.dayRowClosed,
                      ]}
                    >
                      <View style={styles.dayHeader}>
                        <Text style={styles.dayLabel}>{label}</Text>
                        <TouchableOpacity
                          onPress={() => updateDay(key, { closed: !d.closed })}
                          style={[
                            styles.openClosedToggle,
                            d.closed && styles.openClosedToggleClosed,
                          ]}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.openClosedToggleText,
                              d.closed && styles.openClosedToggleTextClosed,
                            ]}
                          >
                            {d.closed ? 'Cerrado' : 'Abierto'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {!d.closed ? (
                        <View style={styles.dayTimeRow}>
                          <TimeInput
                            label="Abre"
                            value={d.open}
                            onChangeText={(v) =>
                              updateDay(key, { open: formatTimeInput(v) })
                            }
                          />
                          <Feather
                            name="arrow-right"
                            size={14}
                            color={COLORS.text.label}
                          />
                          <TimeInput
                            label="Cierra"
                            value={d.close}
                            onChangeText={(v) =>
                              updateDay(key, { close: formatTimeInput(v) })
                            }
                          />
                          <TouchableOpacity
                            onPress={() => updateAllDays({ ...d })}
                            style={styles.applyAllBtn}
                            activeOpacity={0.85}
                            hitSlop={6}
                          >
                            <Feather
                              name="copy"
                              size={14}
                              color={COLORS.brand.tealDark}
                            />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
                <Text style={styles.scheduleHint}>
                  Toca el icono de copiar (📋) para aplicar el horario de un día
                  a toda la semana.
                </Text>
              </View>
            )}
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
                      style={[
                        styles.statusChipText,
                        active && { color: '#fff' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FormField>

          {categories.length > 0 ? (
            <FormField label="Categoría">
              <View style={styles.categoryRow}>
                {categories.map((c) => {
                  const active = categoryId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setCategoryId(active ? null : c.id)}
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
              </View>
            </FormField>
          ) : null}
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
              <Text style={styles.primaryBtnText}>{amenity ? 'Guardar' : 'Crear'}</Text>
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

function TimeInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  const valid = value === '' || HHMM_RE.test(value);
  return (
    <View style={styles.timeInputBox}>
      <Text style={styles.timeInputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.timeInput,
          !valid && { borderColor: '#ef4444', color: '#ef4444' },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder="08:00"
        placeholderTextColor={COLORS.text.label}
        keyboardType="number-pad"
        maxLength={5}
      />
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

  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  amenityImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
  },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  amenityBody: { flex: 1, gap: 4 },
  amenityTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text.primary },
  amenityLocation: { fontSize: 12, color: COLORS.text.secondary },
  amenityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600', color: COLORS.text.label },
  metaText: { fontSize: 11, color: COLORS.text.label },
  amenityActions: { flexDirection: 'row', gap: 6 },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statePad: {
    paddingTop: 48,
    alignItems: 'center',
    gap: 8,
  },
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

  scheduleModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  scheduleModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.light.card,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  scheduleModeBtnActive: {
    backgroundColor: COLORS.brand.tealDark,
    borderColor: COLORS.brand.tealDark,
  },
  scheduleModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  scheduleModeTextActive: { color: '#fff' },

  uniformRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  timeInputBox: { flex: 1, gap: 4 },
  timeInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  timeInput: {
    backgroundColor: COLORS.light.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    textAlign: 'center',
    letterSpacing: 1,
  },

  dayRow: {
    backgroundColor: COLORS.light.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    gap: 10,
  },
  dayRowClosed: {
    opacity: 0.7,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  openClosedToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  openClosedToggleClosed: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  openClosedToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  openClosedToggleTextClosed: { color: '#b91c1c' },
  dayTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  applyAllBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.brand.tealDark,
    marginBottom: 0,
  },
  scheduleHint: {
    fontSize: 11,
    color: COLORS.text.label,
    paddingHorizontal: 4,
    marginTop: 4,
  },

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
  categoryChipActive: {
    backgroundColor: COLORS.brand.tealDark,
    borderColor: COLORS.brand.tealDark,
  },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: COLORS.text.primary },
  categoryChipTextActive: { color: '#fff' },

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
