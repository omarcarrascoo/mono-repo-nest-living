import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Alert,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { COLORS, GRADIENTS } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';
import { clubsService } from '@/services/clubs.service';

const CODE_RE = /^[A-Z0-9]{4,12}$/;

export default function JoinClubScreen() {
  const router = useRouter();
  const memberships = useAuthStore((s) => s.memberships);
  const refreshMemberships = useAuthStore((s) => s.refreshMemberships);
  const switchClub = useAuthStore((s) => s.switchClub);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [code, setCode] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void refreshMemberships();
  }, [refreshMemberships]);

  const activeMemberships = useMemo(
    () => memberships.filter((m) => m.status === 'active'),
    [memberships],
  );
  const pendingMemberships = useMemo(
    () => memberships.filter((m) => m.status === 'pending'),
    [memberships],
  );

  const codeValid = code.length === 0 || CODE_RE.test(code);
  const disabled = submitting || !CODE_RE.test(code);

  async function handleJoin() {
    if (disabled) return;
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      const res = await clubsService.join({
        joinCode: code.trim(),
        unitNumber: unitNumber.trim() || undefined,
      });
      await refreshMemberships();
      if (res.status === 'active') {
        await switchClub(res.clubId);
        router.replace('/(tabs)');
      } else {
        // Pending — esperar aprobación del admin.
        router.replace({
          pathname: '/clubs/pending',
          params: { clubName: res.club.name },
        });
      }
    } catch (e: any) {
      Alert.alert(
        'No pudimos unirte al club',
        e?.status === 404
          ? 'Ese código no existe. Pídele al admin uno nuevo.'
          : e?.status === 409
            ? 'Ya eres miembro de este club.'
            : e?.message ?? 'Intenta de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEnterClub(clubId: string) {
    try {
      await switchClub(clubId);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('No se pudo entrar al club', e?.message ?? 'Intenta de nuevo.');
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Feather name="key" size={22} color={COLORS.brand.teal} />
            </View>
            <TouchableOpacity onPress={() => void logout()} hitSlop={10}>
              <Text style={styles.logoutLink}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Únete a tu club</Text>
            <Text style={styles.subtitle}>
              {user?.fullName ? `Hola, ${user.fullName.split(' ')[0]}. ` : ''}
              Tu administrador te dio un código. Pégalo aquí para entrar a tu
              fraccionamiento.
            </Text>
          </View>

          <View
            style={[
              styles.input,
              {
                borderColor: !codeValid
                  ? '#ef4444'
                  : code
                    ? COLORS.brand.teal
                    : '#E2E8F0',
                backgroundColor: code ? '#fff' : '#F8FAFC',
              },
            ]}
          >
            <Feather
              name="hash"
              size={20}
              color={code ? COLORS.brand.teal : COLORS.text.label}
              style={{ marginRight: 14 }}
            />
            <TextInput
              placeholder="Código del club (ej. KX9P-2A4M)"
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase().replace(/\s+/g, ''))}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholderTextColor={COLORS.text.placeholder}
              style={styles.inputText}
              maxLength={12}
            />
          </View>
          {!codeValid ? (
            <Text style={styles.helperError}>
              El código solo lleva letras y números (4-12 chars).
            </Text>
          ) : null}

          <View
            style={[
              styles.input,
              {
                borderColor: unitNumber ? COLORS.brand.teal : '#E2E8F0',
                backgroundColor: unitNumber ? '#fff' : '#F8FAFC',
              },
            ]}
          >
            <Feather
              name="home"
              size={20}
              color={unitNumber ? COLORS.brand.teal : COLORS.text.label}
              style={{ marginRight: 14 }}
            />
            <TextInput
              placeholder="Unidad (ej. A-101) — opcional"
              value={unitNumber}
              onChangeText={setUnitNumber}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholderTextColor={COLORS.text.placeholder}
              style={styles.inputText}
              maxLength={16}
            />
          </View>

          <TouchableOpacity
            onPress={handleJoin}
            disabled={disabled}
            activeOpacity={0.9}
            style={[styles.btn, disabled && { opacity: 0.6 }]}
          >
            <LinearGradient
              colors={[...GRADIENTS.buttonPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGrad}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Unirme al club</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {activeMemberships.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tus clubs</Text>
              {activeMemberships.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.clubCard}
                  onPress={() => handleEnterClub(m.clubId)}
                  activeOpacity={0.85}
                >
                  <View style={styles.clubAvatar}>
                    <Feather name="home" size={20} color={COLORS.brand.teal} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clubName} numberOfLines={1}>
                      {m.club?.name ?? m.clubId}
                    </Text>
                    <Text style={styles.clubMeta}>
                      {m.role === 'admin' ? 'Admin' : 'Residente'}
                      {m.unitNumber ? ` · ${m.unitNumber}` : ''}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={COLORS.text.label} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {pendingMemberships.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>En espera de aprobación</Text>
              {pendingMemberships.map((m) => (
                <View key={m.id} style={[styles.clubCard, styles.clubCardPending]}>
                  <View style={[styles.clubAvatar, { backgroundColor: '#fef3c7' }]}>
                    <Feather name="clock" size={20} color="#92400e" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clubName} numberOfLines={1}>
                      {m.club?.name ?? m.clubId}
                    </Text>
                    <Text style={styles.clubMeta}>
                      Esperando que un admin apruebe tu solicitud.
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 24,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLink: {
    color: COLORS.text.label,
    fontSize: 14,
    fontWeight: '600',
  },
  header: { marginBottom: 28 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.light.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.light.textSecondary,
    lineHeight: 22,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  inputText: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.light.textPrimary,
    fontWeight: '500',
    letterSpacing: 1,
  },
  helperError: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 14,
    paddingHorizontal: 4,
    fontWeight: '600',
  },
  btn: {
    marginTop: 12,
    borderRadius: 16,
    shadowColor: COLORS.brand.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnGrad: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  section: { marginTop: 36 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  clubCardPending: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  clubAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.light.textPrimary,
  },
  clubMeta: {
    fontSize: 13,
    color: COLORS.light.textSecondary,
    marginTop: 2,
  },
});
