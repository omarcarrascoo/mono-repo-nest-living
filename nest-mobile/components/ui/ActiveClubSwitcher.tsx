import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

interface ActiveClubSwitcherProps {
  /** "compact" muestra solo nombre + caret en una pill, ideal para headers. */
  variant?: 'compact' | 'full';
}

/**
 * Switcher de club activo. Tap → abre un sheet con todos los clubs del user.
 * Switching dispara `auth-store.switchClub()` que re-emite el JWT y resetea
 * los stores scope-ados, así que el resto de la UI se rehidrata sola.
 */
export function ActiveClubSwitcher({ variant = 'compact' }: ActiveClubSwitcherProps) {
  const router = useRouter();
  const memberships = useAuthStore((s) => s.memberships);
  const activeClubId = useAuthStore((s) => s.activeClubId);
  const switchClub = useAuthStore((s) => s.switchClub);
  const refreshMemberships = useAuthStore((s) => s.refreshMemberships);
  const loading = useAuthStore((s) => s.membershipsLoading);

  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  // Carga memberships una vez al montar para que el pill muestre el nombre del
  // club activo aunque el JWT viva en disk (el `hydrate()` no las llena).
  useEffect(() => {
    if (memberships.length === 0) {
      void refreshMemberships();
    }
  }, [memberships.length, refreshMemberships]);

  // Y refresca cuando el modal se abre — por si cambió algo desde otra pantalla.
  useEffect(() => {
    if (open) void refreshMemberships();
  }, [open, refreshMemberships]);

  const activeMemberships = useMemo(
    () => memberships.filter((m) => m.status === 'active'),
    [memberships],
  );
  const active = useMemo(
    () => activeMemberships.find((m) => m.clubId === activeClubId),
    [activeMemberships, activeClubId],
  );
  const others = useMemo(
    () => activeMemberships.filter((m) => m.clubId !== activeClubId),
    [activeMemberships, activeClubId],
  );

  // Mientras carga la lista por primera vez, no hagas claim de "sin club" —
  // muestra "Cargando…" para evitar flicker desde el activeClubId del JWT.
  const isLoadingFirstTime = loading && memberships.length === 0;
  const label = isLoadingFirstTime
    ? 'Cargando…'
    : active?.club?.name ??
      (activeClubId ? 'Tu club' : 'Sin club activo');

  // Si solo tiene un club, no mostramos switcher (no hay nada que cambiar).
  if (activeMemberships.length <= 1) {
    return (
      <View style={[styles.pill, variant === 'full' && styles.pillFull]}>
        <Feather name="home" size={14} color={COLORS.brand.teal} />
        <Text style={styles.pillText} numberOfLines={1}>
          {label}
        </Text>
      </View>
    );
  }

  async function handleSwitch(clubId: string) {
    if (clubId === activeClubId) {
      setOpen(false);
      return;
    }
    setSwitching(clubId);
    try {
      await switchClub(clubId);
      setOpen(false);
    } catch (e: any) {
      Alert.alert(
        'No se pudo cambiar de club',
        e?.message ?? 'Intenta de nuevo en un momento.',
      );
    } finally {
      setSwitching(null);
    }
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        style={[styles.pill, variant === 'full' && styles.pillFull]}
      >
        <Feather name="home" size={14} color={COLORS.brand.teal} />
        <Text style={styles.pillText} numberOfLines={1}>
          {label}
        </Text>
        <Feather name="chevron-down" size={14} color={COLORS.text.label} />
      </TouchableOpacity>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Cambiar de club</Text>

            {loading && activeMemberships.length === 0 ? (
              <ActivityIndicator color={COLORS.brand.teal} style={{ marginVertical: 24 }} />
            ) : null}

            {active ? (
              <View style={[styles.row, styles.rowActive]}>
                <View style={styles.avatar}>
                  <Feather name="check" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {active.club?.name ?? active.clubId}
                  </Text>
                  <Text style={styles.rowMeta}>
                    Activo · {active.role === 'admin' ? 'Admin' : 'Residente'}
                    {active.unitNumber ? ` · ${active.unitNumber}` : ''}
                  </Text>
                </View>
              </View>
            ) : null}

            {others.map((m) => {
              const isSwitching = switching === m.clubId;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={styles.row}
                  onPress={() => handleSwitch(m.clubId)}
                  disabled={!!switching}
                  activeOpacity={0.85}
                >
                  <View style={[styles.avatar, styles.avatarIdle]}>
                    <Feather name="home" size={18} color={COLORS.brand.teal} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {m.club?.name ?? m.clubId}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {m.role === 'admin' ? 'Admin' : 'Residente'}
                      {m.unitNumber ? ` · ${m.unitNumber}` : ''}
                    </Text>
                  </View>
                  {isSwitching ? (
                    <ActivityIndicator size="small" color={COLORS.brand.teal} />
                  ) : (
                    <Feather name="chevron-right" size={18} color={COLORS.text.label} />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={() => {
                setOpen(false);
                router.push('/clubs/join');
              }}
              style={styles.joinRow}
              activeOpacity={0.85}
            >
              <Feather name="plus-circle" size={20} color={COLORS.brand.teal} />
              <Text style={styles.joinText}>Unirme a otro club</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ccfbf1',
    borderRadius: 999,
    maxWidth: 220,
  },
  pillFull: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brand.teal,
    flexShrink: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.light.textPrimary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 12,
    marginBottom: 6,
  },
  rowActive: {
    backgroundColor: '#ecfdf5',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brand.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIdle: {
    backgroundColor: '#ccfbf1',
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.light.textPrimary,
  },
  rowMeta: {
    fontSize: 12,
    color: COLORS.light.textSecondary,
    marginTop: 2,
  },
  joinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  joinText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.brand.teal,
  },
});
