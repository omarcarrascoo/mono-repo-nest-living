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
  const hydrate = useAuthStore((s) => s.hydrate);

  usePushRegistration();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const inProtectedGroup =
      segments[0] === '(tabs)' ||
      segments[0] === 'amenity' ||
      segments[0] === 'profile' ||
      segments[0] === 'reservation';
    const onAuthScreen = segments.length === 0 || segments[0] === 'register' || (segments[0] as string) === 'index';

    if (status !== 'authenticated' && inProtectedGroup) {
      router.replace('/');
    } else if (status === 'authenticated' && onAuthScreen && segments[0] !== '(tabs)') {
      const top = segments[0];
      if (top === undefined || top === 'register') {
        router.replace('/(tabs)');
      }
    }
  }, [hydrated, status, segments, router]);

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
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="amenity" options={{ headerShown: false }} />
          <Stack.Screen name="reservation" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
        </Stack>
      </AuthGate>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
