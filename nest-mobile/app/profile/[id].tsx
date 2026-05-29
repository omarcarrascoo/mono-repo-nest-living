import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Text,
  Switch,
  ActivityIndicator,
  Alert,
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
    // Si no hay avatar real, lo dejamos vacío y el `<Avatar>` dibuja iniciales.
    avatar: u.avatar ?? '',
    // Stats / lease / contacts / documents ya no viven en User — son datos
    // que un día el club tendrá scope-ado por Membership. Por ahora mostramos
    // valores vacíos para no romper la UI.
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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

  const onLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={COLORS.brand.teal} />
      </View>
    );
  }

  const profile = toProfile(user, activeMembership?.unitNumber);
  const hasContacts = profile.contacts.length > 0;
  const hasDocs = profile.documents.length > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background.base} />

      <ProfileHeader user={profile} />

      <View style={styles.sheetContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
            <Text style={styles.avatarCaption}>
              {user.fullName}
            </Text>
            <Text style={styles.avatarCaptionSub}>{profile.email}</Text>
          </View>

          <View style={styles.card}>
            <SectionHeader
              title="Mis Datos"
              icon="user"
              action={refreshing ? 'Actualizando…' : 'Actualizar'}
              onActionPress={() => {
                setRefreshing(true);
                refreshUser().finally(() => setRefreshing(false));
              }}
            />
            <InfoRow icon="mail" label="Correo Electrónico" value={profile.email} />
            <View style={styles.separator} />
            <InfoRow
              icon="home"
              label="Club activo"
              value={activeMembership?.club?.name ?? '—'}
            />
          </View>

          <LeaseInfo lease={profile.lease} />

          {hasDocs ? <DocumentsList documents={profile.documents} /> : null}

          {hasContacts ? (
            <View style={styles.card}>
              <SectionHeader title="Emergencia" icon="shield" />
              {profile.contacts.map((contact, index) => (
                <View key={contact.id ?? index}>
                  <View style={styles.contactRow}>
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>
                        {contact.name?.charAt(0) ?? '?'}
                      </Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactRelation}>
                        {contact.relation} • {contact.phone}
                      </Text>
                    </View>
                  </View>
                  {index < profile.contacts.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.infoIconBox, { backgroundColor: '#f1f5f9' }]}>
                  <Feather name="bell" size={18} color={COLORS.text.primary} />
                </View>
                <Text style={styles.infoValue}>Notificaciones</Text>
              </View>
              <Switch
                trackColor={{ false: '#cbd5e1', true: COLORS.brand.teal }}
                thumbColor="#fff"
                onValueChange={setNotificationsEnabled}
                value={notificationsEnabled}
              />
            </View>
          </View>

          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>v2.4.0 • Build 1502</Text>
        </ScrollView>
      </View>
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
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitials: { color: '#0369a1', fontWeight: '700', fontSize: 16 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '600', color: COLORS.text.primary },
  contactRelation: { fontSize: 13, color: COLORS.text.secondary },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutBtn: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  logoutText: { color: '#991b1b', fontWeight: '600', fontSize: 15 },
  versionText: {
    textAlign: 'center',
    color: COLORS.text.label,
    fontSize: 12,
    marginTop: 24,
  },
});
