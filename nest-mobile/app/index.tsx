import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Dimensions,
  LayoutAnimation,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';

import { COLORS, GRADIENTS } from '@/constants/theme';
import { styles } from './styles';
import { useAuthStore } from '@/stores/auth-store';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);

  const isButtonDisabled = useMemo(
    () => loading || !email.trim() || !password.trim(),
    [loading, email, password]
  );

  const handleFocus = (field: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveInput(field);
  };

  const handleBlur = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveInput(null);
  };

  async function handleSubmit() {
    if (isButtonDisabled) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert(
        'No pudimos iniciar sesión',
        e?.status === 401
          ? 'Correo o contraseña incorrectos.'
          : e?.message ?? 'Intenta de nuevo en un momento.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* FONDO IMAGEN (Limpio, sin logos encima) */}
      <View style={styles.fixedBackground}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=2070&auto=format&fit=crop' }} // Imagen más minimalista/nórdica
          style={styles.backgroundImage}
          contentFit="cover"
        />
        {/* Overlay muy suave */}
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)']}
          style={styles.backgroundOverlay}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Spacer */}
          <View style={{ height: height * 0.38 }} />

          {/* BOTTOM SHEET MINIMALISTA */}
          <View style={styles.bottomSheet}>
            
            {/* Cabecera Limpia */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Hola de nuevo.</Text>
              <Text style={styles.subtitle}>Bienvenido a tu espacio.</Text>
            </View>

            <View style={styles.formContainer}>
              
              {/* INPUT EMAIL (Diseño limpio: Icono libre + Fondo sutil) */}
              <TouchableWithoutFeedback onPress={() => emailRef.current?.focus()}>
                <View style={[
                  styles.inputContainer,
                  activeInput === 'email' && styles.inputContainerActive
                ]}>
                  <Feather 
                    name="mail" 
                    size={20} 
                    color={activeInput === 'email' ? COLORS.brand.teal : COLORS.text.label}
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    ref={emailRef}
                    value={email}
                    onChangeText={setEmail}
                    style={styles.textInput}
                    placeholder="Correo electrónico"
                    placeholderTextColor={COLORS.text.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => handleFocus('email')}
                    onBlur={handleBlur}
                  />
                </View>
              </TouchableWithoutFeedback>

              {/* INPUT PASSWORD */}
              <TouchableWithoutFeedback onPress={() => passwordRef.current?.focus()}>
                <View style={[
                  styles.inputContainer,
                  activeInput === 'password' && styles.inputContainerActive
                ]}>
                  <Feather 
                    name="lock" 
                    size={20} 
                    color={activeInput === 'password' ? COLORS.brand.teal : COLORS.text.label} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={passwordRef}
                    value={password}
                    onChangeText={setPassword}
                    style={styles.textInput}
                    placeholder="Contraseña"
                    placeholderTextColor={COLORS.text.placeholder}
                    secureTextEntry={!showPwd}
                    onFocus={() => handleFocus('password')}
                    onBlur={handleBlur}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPwd(!showPwd)} 
                    style={styles.eyeButton}
                  >
                     <Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color={COLORS.text.label} />
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>

              {/* OPCIONES (Más espaciadas) */}
              <View style={styles.optionsRow}>
                <TouchableOpacity 
                  style={styles.rememberRow} 
                  activeOpacity={0.7}
                  onPress={() => setRemember(!remember)}
                >
                  <Switch
                    value={remember}
                    onValueChange={setRemember}
                    trackColor={{ false: '#f1f5f9', true: COLORS.brand.teal }}
                    thumbColor="#fff"
                    ios_backgroundColor="#f1f5f9" // Gris muy claro para iOS desactivado
                    style={{ transform: [{ scale: 0.7 }] }}
                  />
                  <Text style={styles.optionText}>Recordarme</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.forgotText}>Recuperar clave</Text>
                </TouchableOpacity>
              </View>

              {/* BOTÓN (Menos sombra pesada, más elegante) */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isButtonDisabled}
                activeOpacity={0.9}
                style={[
                  styles.buttonContainer,
                  isButtonDisabled && styles.buttonDisabled
                ]}
              >
                <LinearGradient
                  colors={isButtonDisabled ? [...GRADIENTS.buttonDisabled] : [...GRADIENTS.buttonPrimary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Entrar</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* FOOTER SIMPLE */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                   <Text style={styles.footerLink}>Crear cuenta</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}