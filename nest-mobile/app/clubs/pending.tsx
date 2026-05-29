import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function PendingClubScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clubName?: string }>();
  const memberships = useAuthStore((s) => s.memberships);
  const refreshMemberships = useAuthStore((s) => s.refreshMemberships);
  const switchClub = useAuthStore((s) => s.switchClub);
  const logout = useAuthStore((s) => s.logout);
  const loading = useAuthStore((s) => s.membershipsLoading);

  // Polling cada 10s mientras la pantalla esté abierta para detectar approval.
  useEffect(() => {
    void refreshMemberships();
    const t = setInterval(() => {
      void refreshMemberships();
    }, 10_000);
    return () => clearInterval(t);
  }, [refreshMemberships]);

  const newlyActive = useMemo(
    () => memberships.find((m) => m.status === 'active'),
    [memberships],
  );

  // Auto-redirect cuando se aprueba.
  useEffect(() => {
    if (newlyActive) {
      void (async () => {
        try {
          await switchClub(newlyActive.clubId);
          router.replace('/(tabs)');
        } catch {
          // Si falla el switch, dejamos al user en esta pantalla y el botón de
          // entrar manualmente se lo permite reintentar.
        }
      })();
    }
  }, [newlyActive, switchClub, router]);

  const pending = memberships.filter((m) => m.status === 'pending');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.replace('/clubs/join')} hitSlop={10}>
            <Feather name="arrow-left" size={22} color={COLORS.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void logout()} hitSlop={10}>
            <Text style={styles.logoutLink}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Feather name="clock" size={32} color="#92400e" />
          </View>
        </View>

        <Text style={styles.title}>Solicitud enviada</Text>
        <Text style={styles.subtitle}>
          {params.clubName
            ? `Le pediste acceso a ${params.clubName}. `
            : 'Tu solicitud está en espera. '}
          Un administrador revisará tu solicitud y te dejará entrar pronto.
        </Text>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Feather name="refresh-cw" size={16} color={COLORS.text.label} />
            <Text style={styles.statusText}>
              {loading ? 'Verificando…' : 'Esperando aprobación'}
            </Text>
            {loading ? <ActivityIndicator size="small" color={COLORS.brand.teal} /> : null}
          </View>
          <Text style={styles.statusHint}>
            Revisamos cada 10 segundos. En cuanto te aprueben, entras automáticamente.
          </Text>
        </View>

        {pending.length > 1 ? (
          <View style={styles.listSection}>
            <Text style={styles.listTitle}>Otras solicitudes pendientes</Text>
            {pending.map((m) => (
              <View key={m.id} style={styles.pendingRow}>
                <Feather name="home" size={16} color={COLORS.text.label} />
                <Text style={styles.pendingName} numberOfLines={1}>
                  {m.club?.name ?? m.clubId}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          onPress={() => router.replace('/clubs/join')}
          style={styles.secondaryBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>Probar con otro código</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ui.white },
  scroll: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  logoutLink: {
    color: COLORS.text.label,
    fontSize: 14,
    fontWeight: '600',
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.light.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  statusCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.light.textPrimary,
  },
  statusHint: {
    fontSize: 13,
    color: COLORS.light.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  listSection: {
    marginBottom: 24,
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  pendingName: {
    flex: 1,
    color: COLORS.light.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: COLORS.light.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
