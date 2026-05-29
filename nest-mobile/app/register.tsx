import React, { useMemo, useState } from 'react';
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
  KeyboardTypeOptions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { COLORS, GRADIENTS } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatDOBInput(input: string): string {
  // Allow only digits, auto-insert dashes after 4 and 7 chars: YYYY-MM-DD.
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function isAdult(iso: string): boolean {
  if (!ISO_DATE_RE.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const dob = new Date(y, m - 1, d);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 13 && age < 120;
}

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const dobValid = useMemo(() => dob === '' || isAdult(dob), [dob]);

  const disabled = useMemo(
    () =>
      loading ||
      !fullName.trim() ||
      !email.trim() ||
      password.length < 6 ||
      !dobValid,
    [loading, fullName, email, password, dobValid],
  );

  async function handleSubmit() {
    if (disabled) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        dateOfBirth: dob.trim() ? dob.trim() : undefined,
      });
      // Tras registro+login: si el user no tiene clubs, lo mandamos al join screen.
      // El _layout decide la navegación apropiada según activeClubId.
      router.replace('/clubs/join');
    } catch (e: any) {
      Alert.alert(
        'No pudimos crear la cuenta',
        e?.message ?? 'Intenta de nuevo en un momento.',
      );
    } finally {
      setLoading(false);
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={COLORS.text.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>
              Solo unos datos. Después te unes a tu club con un código.
            </Text>
          </View>

          <Field
            icon="user"
            placeholder="Nombre completo"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <Field
            icon="mail"
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            icon="lock"
            placeholder="Contraseña (mín. 6)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPwd}
            right={
              <TouchableOpacity onPress={() => setShowPwd((v) => !v)} style={{ padding: 8 }}>
                <Feather
                  name={showPwd ? 'eye-off' : 'eye'}
                  size={18}
                  color={COLORS.text.label}
                />
              </TouchableOpacity>
            }
          />
          <Field
            icon="calendar"
            placeholder="Fecha de nacimiento (YYYY-MM-DD)"
            value={dob}
            onChangeText={(v) => setDob(formatDOBInput(v))}
            keyboardType="number-pad"
            autoCapitalize="none"
            invalid={!dobValid}
          />
          {!dobValid ? (
            <Text style={styles.helperError}>
              Fecha inválida o demasiado joven (mín. 13 años).
            </Text>
          ) : (
            <Text style={styles.helper}>
              Opcional. Algunos clubs lo piden para verificar tu identidad.
            </Text>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
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
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Crear cuenta</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={styles.footerLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

interface FieldProps {
  icon: keyof typeof Feather.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  right?: React.ReactNode;
  invalid?: boolean;
}

function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  right,
  invalid,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = invalid
    ? '#ef4444'
    : focused
      ? COLORS.brand.teal
      : '#E2E8F0';
  return (
    <View
      style={[
        styles.input,
        {
          borderColor,
          backgroundColor: focused || invalid ? '#fff' : '#F8FAFC',
        },
      ]}
    >
      <Feather
        name={icon}
        size={20}
        color={
          invalid
            ? '#ef4444'
            : focused
              ? COLORS.brand.teal
              : COLORS.text.label
        }
        style={{ marginRight: 14 }}
      />
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={COLORS.text.placeholder}
        style={styles.inputText}
      />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ui.white },
  scroll: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  header: { marginBottom: 32 },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.light.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.light.textSecondary,
    fontWeight: '400',
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
  },
  helper: {
    color: COLORS.light.textSecondary,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 14,
    paddingHorizontal: 4,
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
    marginTop: 16,
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
  footer: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: { color: COLORS.light.textSecondary, fontSize: 14 },
  footerLink: {
    color: COLORS.brand.teal,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
});
