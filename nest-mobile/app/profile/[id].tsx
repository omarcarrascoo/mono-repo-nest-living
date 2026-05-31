import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { COLORS } from '@/constants/theme';
import {
  ResidentContact,
  ResidentDocument,
  ResidentLease,
  ResidentStats,
  UserProfile,
} from '@/types/user';

import ProfileHeader from '@/components/profile/ProfileHeader';
import SectionHeader from '@/components/ui/FormHeader';
import LeaseInfo from '@/components/profile/LeaseInfo';
import DocumentsList from '@/components/profile/DocumentList';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useAuthStore } from '@/stores/auth-store';
import { AuthUser } from '@/types/api';
import { apiFetch } from '@/lib/api/client';

const EMPTY_STATS: ResidentStats = {
  balanceOwed: 0,
  delinquencyRate: 0,
  lastPaymentDate: '—',
};

const EMPTY_LEASE: ResidentLease = {
  startDate: '—',
  endDate: '—',
  rentAmount: '—',
  securityDeposit: '—',
  daysLeft: 0,
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toProfile(u: AuthUser, unitNumber?: string): UserProfile {
  return {
    id: u.id,
    fullName: u.fullName,
    unitNumber: unitNumber ?? 'Sin unidad',
    email: u.email,
    phone: '—',
    status: (u.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as
      | 'ACTIVE'
      | 'INACTIVE',
    avatar: u.avatar ?? '',
    stats: { ...EMPTY_STATS },
    lease: { ...EMPTY_LEASE },
    contacts: [] as ResidentContact[],
    documents: [] as ResidentDocument[],
  };
}

interface InfoRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}

const InfoRow = ({ icon, label, value }: InfoRowProps) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconBox}>
      <Feather name={icon} size={18} color={COLORS.text.label} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

function formatDOBInput(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export default function UserProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const logout = useAuthStore((s) => s.logout);
  const memberships = useAuthStore((s) => s.memberships);
  const activeClubId = useAuthStore((s) => s.activeClubId);
  const activeMembership = memberships.find(
    (m) => m.clubId === activeClubId && m.status === 'active',
  );

  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const prefs = user?.notificationPreferences;
  const [reservationReminders, setReservationReminders] = useState(true);
  const [reservationUpdates, setReservationUpdates] = useState(true);
  const [adminAlerts, setAdminAlerts] = useState(true);
  const [savingPref, setSavingPref] = useState<string | null>(null);

  // Sync local toggles with backend prefs whenever they change.
  useEffect(() => {
    if (!prefs) return;
    setReservationReminders(prefs.reservationReminders ?? true);
    setReservationUpdates(prefs.reservationUpdates ?? true);
    setAdminAlerts(prefs.adminAlerts ?? true);
  }, [prefs]);

  useEffect(() => {
    let cancelled = false;
    setRefreshing(true);
    refreshUser()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const startEdit = () => {
    if (!user) return;
    setEditName(user.fullName ?? '');
    setEditDob(user.dateOfBirth ?? '');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditName('');
    setEditDob('');
  };

  const saveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Falta el nombre', 'El nombre no puede estar vacío.');
      return;
    }
    if (editDob && !ISO_DATE_RE.test(editDob)) {
      Alert.alert(
        'Fecha inválida',
        'Usa el formato YYYY-MM-DD (ej. 1995-08-15).',
      );
      return;
    }
    setSavingProfile(true);
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: {
          fullName: editName.trim(),
          dateOfBirth: editDob ? editDob : null,
        },
      });
      await refreshUser();
      setEditing(false);
    } catch (e: any) {
      Alert.alert(
        'No se pudo guardar',
        e?.message ?? 'Intenta de nuevo en un momento.',
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const togglePref = async (
    key: 'reservationReminders' | 'reservationUpdates' | 'adminAlerts',
    next: boolean,
  ) => {
    // Optimistic
    if (key === 'reservationReminders') setReservationReminders(next);
    if (key === 'reservationUpdates') setReservationUpdates(next);
    if (key === 'adminAlerts') setAdminAlerts(next);
    setSavingPref(key);
    try {
      await apiFetch('/users/me/notification-preferences', {
        method: 'PATCH',
        body: { [key]: next },
      });
      await refreshUser();
    } catch (e: any) {
      // Rollback
      if (key === 'reservationReminders') setReservationReminders(!next);
      if (key === 'reservationUpdates') setReservationUpdates(!next);
      if (key === 'adminAlerts') setAdminAlerts(!next);
      Alert.alert(
        'No se pudo actualizar',
        e?.message ?? 'Intenta de nuevo.',
      );
    } finally {
      setSavingPref(null);
    }
  };

  const onLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        // No navegamos manualmente — el AuthGate detecta status='unauthenticated'
        // y manda al login. Así evitamos "navigate before mounting" cuando esta
        // pantalla se desmonta antes de que router.replace() ejecute.
        onPress: () => void logout(),
      },
    ]);
  };

  // Importante: TODOS los hooks deben correr antes de cualquier early-return,
  // si no React lanza "Rendered fewer hooks than expected" cuando logout()
  // pone el user en null y se desmonta este árbol.
  const dobLabel = useMemo(() => {
    if (!user?.dateOfBirth) return 'Sin registrar';
    return user.dateOfBirth;
  }, [user?.dateOfBirth]);

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={COLORS.brand.teal} />
      </View>
    );
  }

  const profile = toProfile(user, activeMembership?.unitNumber);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background.base} />

      <ProfileHeader user={profile} />

      <View style={styles.sheetContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.card, styles.avatarCard]}>
              <ImageUploader
                variant="avatar"
                kind="avatar"
                value={user.avatar || undefined}
                onChange={async (url) => {
                  try {
                    await apiFetch('/users/me', {
                      method: 'PATCH',
                      body: { avatar: url },
                    });
                    await refreshUser();
                  } catch (e: any) {
                    Alert.alert(
                      'No se pudo guardar',
                      e?.message ?? 'Intenta de nuevo.',
                    );
                  }
                }}
              />
              <Text style={styles.avatarCaption}>{user.fullName}</Text>
              <Text style={styles.avatarCaptionSub}>{profile.email}</Text>
            </View>

            {/* Mis Datos — editable */}
            <View style={styles.card}>
              <SectionHeader
                title="Mis Datos"
                icon="user"
                action={
                  editing
                    ? 'Cancelar'
                    : refreshing
                      ? 'Actualizando…'
                      : 'Editar'
                }
                onActionPress={() => {
                  if (editing) cancelEdit();
                  else startEdit();
                }}
              />

              {editing ? (
                <View style={{ gap: 12, paddingTop: 4 }}>
                  <View>
                    <Text style={styles.fieldLabel}>Nombre completo</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Nombre completo"
                      placeholderTextColor={COLORS.text.label}
                      autoCapitalize="words"
                      maxLength={120}
                    />
                  </View>
                  <View>
                    <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editDob}
                      onChangeText={(v: string) => setEditDob(formatDOBInput(v))}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={COLORS.text.label}
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                  </View>
                  <View>
                    <Text style={styles.fieldLabel}>Correo</Text>
                    <View style={styles.readOnlyField}>
                      <Text style={styles.readOnlyText}>{user.email}</Text>
                      <Feather
                        name="lock"
                        size={13}
                        color={COLORS.text.label}
                      />
                    </View>
                    <Text style={styles.helperText}>
                      El correo no se puede editar desde aquí.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      savingProfile && { opacity: 0.6 },
                    ]}
                    onPress={saveProfile}
                    disabled={savingProfile}
                    activeOpacity={0.85}
                  >
                    {savingProfile ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <InfoRow
                    icon="user"
                    label="Nombre"
                    value={user.fullName}
                  />
                  <View style={styles.separator} />
                  <InfoRow
                    icon="mail"
                    label="Correo"
                    value={user.email}
                  />
                  <View style={styles.separator} />
                  <InfoRow
                    icon="calendar"
                    label="Nacimiento"
                    value={dobLabel}
                  />
                  <View style={styles.separator} />
                  <InfoRow
                    icon="home"
                    label="Club activo"
                    value={activeMembership?.club?.name ?? '—'}
                  />
                  {activeMembership?.unitNumber ? (
                    <>
                      <View style={styles.separator} />
                      <InfoRow
                        icon="hash"
                        label="Unidad"
                        value={activeMembership.unitNumber}
                      />
                    </>
                  ) : null}
                </>
              )}
            </View>

            {/* Notificaciones — conectado real */}
            <View style={styles.card}>
              <SectionHeader title="Notificaciones" icon="bell" />
              <PreferenceRow
                label="Recordatorios de reservas"
                description="Aviso 15 min antes de tu reserva"
                value={reservationReminders}
                loading={savingPref === 'reservationReminders'}
                onValueChange={(v) => togglePref('reservationReminders', v)}
              />
              <View style={styles.separator} />
              <PreferenceRow
                label="Cambios en reservas"
                description="Cuando se confirma, modifica o cancela"
                value={reservationUpdates}
                loading={savingPref === 'reservationUpdates'}
                onValueChange={(v) => togglePref('reservationUpdates', v)}
              />
              <View style={styles.separator} />
              <PreferenceRow
                label="Avisos del club"
                description="Mensajes del administrador"
                value={adminAlerts}
                loading={savingPref === 'adminAlerts'}
                onValueChange={(v) => togglePref('adminAlerts', v)}
              />
            </View>

            {/* Próximamente — features moqueadas */}
            <View style={[styles.card, styles.comingSoonCard]}>
              <View style={styles.comingSoonHeader}>
                <View style={styles.comingSoonBadge}>
                  <Feather name="clock" size={12} color={COLORS.brand.tealDark} />
                  <Text style={styles.comingSoonBadgeText}>Próximamente</Text>
                </View>
              </View>
              <Text style={styles.comingSoonTitle}>
                Más datos de tu residencia
              </Text>
              <Text style={styles.comingSoonBody}>
                Estamos trabajando en estas funciones:
              </Text>
              <View style={styles.comingSoonList}>
                <ComingSoonItem icon="dollar-sign" label="Estado de cuenta y pagos" />
                <ComingSoonItem icon="file-text" label="Contrato de arrendamiento" />
                <ComingSoonItem icon="folder" label="Documentos personales" />
                <ComingSoonItem icon="phone" label="Contactos de emergencia" />
              </View>
            </View>

            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
              <Feather name="log-out" size={16} color="#991b1b" />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>
              NestQuest · en desarrollo activo
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

function PreferenceRow({
  label,
  description,
  value,
  loading,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  loading: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.prefRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefDescription}>{description}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.brand.teal} />
      ) : (
        <Switch
          trackColor={{ false: '#cbd5e1', true: COLORS.brand.teal }}
          thumbColor="#fff"
          onValueChange={onValueChange}
          value={value}
        />
      )}
    </View>
  );
}

function ComingSoonItem({
  icon,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.comingSoonItem}>
      <Feather name={icon} size={14} color={COLORS.text.label} />
      <Text style={styles.comingSoonItemText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.base },
  center: { alignItems: 'center', justifyContent: 'center' },
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.light.backgroundSecondary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    overflow: 'hidden',
  },
  scrollContent: { padding: 24, paddingBottom: 60 },
  avatarCard: {
    alignItems: 'center',
    gap: 6,
  },
  avatarCaption: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: 8,
  },
  avatarCaptionSub: {
    fontSize: 13,
    color: COLORS.text.label,
  },
  card: {
    backgroundColor: COLORS.light.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.text.label, marginBottom: 2 },
  infoValue: { fontSize: 15, color: COLORS.text.primary, fontWeight: '500' },
  separator: {
    height: 1,
    backgroundColor: COLORS.light.border,
    marginVertical: 12,
    marginLeft: 56,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  readOnlyText: {
    fontSize: 15,
    color: COLORS.text.label,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.text.label,
    marginTop: 4,
  },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.brand.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 16,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  prefDescription: {
    fontSize: 12,
    color: COLORS.text.label,
    marginTop: 2,
  },

  comingSoonCard: {
    backgroundColor: '#F8FAFC',
  },
  comingSoonHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: COLORS.brand.tealDark,
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brand.tealDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  comingSoonBody: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  comingSoonList: {
    gap: 8,
  },
  comingSoonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  comingSoonItemText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },

  logoutBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: { color: '#991b1b', fontWeight: '700', fontSize: 14 },
  versionText: {
    textAlign: 'center',
    color: COLORS.text.label,
    fontSize: 12,
    marginTop: 24,
  },
});
