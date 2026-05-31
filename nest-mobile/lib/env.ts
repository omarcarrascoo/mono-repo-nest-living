import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Default backend del proyecto (deploy en Render).
 * Se usa cuando no hay `EXPO_PUBLIC_API_URL` ni host de Expo en LAN.
 */
const DEFAULT_API_URL = 'https://mono-repo-nest-living.onrender.com';

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
  // 1. Env explícita gana siempre (ej. para apuntar a un backend local).
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  // 2. En web (Expo web) usamos el deploy directo.
  if (Platform.OS === 'web') return DEFAULT_API_URL;

  // 3. Si Expo está sirviendo desde LAN y NO hay env explícita, asumimos
  //    desarrollo local con `npm run start:dev` en la misma máquina.
  //    OJO: esto solo aplica cuando alguien borra el .env y corre Expo
  //    contra un backend local; en producción la env del .env manda.
  const host = detectDevHost();
  if (host && host !== 'localhost') return `http://${host}:3000`;

  // 4. Último fallback: el deploy.
  return DEFAULT_API_URL;
}

export const ENV = {
  API_URL: resolveApiUrl(),
};
