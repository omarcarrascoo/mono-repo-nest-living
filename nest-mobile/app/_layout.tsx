import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { usePushRegistration } from '@/hooks/use-push-registration';
import { COLORS } from '@/constants/theme';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const activeClubId = useAuthStore((s) => s.activeClubId);
  const hydrate = useAuthStore((s) => s.hydrate);

  usePushRegistration();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const top = segments[0] as string | undefined;
    const inProtectedGroup =
      top === '(tabs)' ||
      top === 'amenity' ||
      top === 'profile' ||
      top === 'reservation' ||
      top === 'delivery' ||
      top === 'orders' ||
      top === 'notifications' ||
      top === 'post';
    const onAuthScreen =
      segments.length === 0 || top === 'register' || top === 'index';
    const onClubsFlow = top === 'clubs';

    if (status !== 'authenticated' && (inProtectedGroup || onClubsFlow)) {
      router.replace('/');
      return;
    }
    if (status === 'authenticated') {
      // Sin club activo → forzar al flujo de unirse a un club.
      if (!activeClubId && (inProtectedGroup || onAuthScreen)) {
        if (!onClubsFlow) router.replace('/clubs/join');
        return;
      }
      // Con club activo y en pantalla de auth → al home.
      if (activeClubId && onAuthScreen && top !== '(tabs)') {
        if (top === undefined || top === 'register' || top === 'index') {
          router.replace('/(tabs)');
        }
      }
    }
  }, [hydrated, status, activeClubId, segments, router]);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.background.base,
        }}
      >
        <ActivityIndicator color={COLORS.brand.teal} />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGate>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false, title: 'Login' }} />
          <Stack.Screen name="register" options={{ headerShown: false, title: 'Crear cuenta' }} />
          <Stack.Screen name="clubs" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="amenity" options={{ headerShown: false }} />
          <Stack.Screen name="reservation" options={{ headerShown: false }} />
          <Stack.Screen name="delivery" options={{ headerShown: false }} />
          <Stack.Screen name="orders" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="post" options={{ headerShown: false }} />
        </Stack>
      </AuthGate>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
