import Constants from 'expo-constants';
import { Platform } from 'react-native';

function detectDevHost(): string | null {
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants.expoGoConfig as any)?.debuggerHost ??
    (Constants.manifest as any)?.debuggerHost ??
    null;
  if (!hostUri) return null;
  const host = String(hostUri).split(':')[0];
  return host || null;
}

function resolveApiUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  if (Platform.OS === 'web') return 'http://localhost:3000';

  const host = detectDevHost();
  if (host) return `http://${host}:3000`;

  return 'http://localhost:3000';
}

export const ENV = {
  API_URL: resolveApiUrl(),
};
