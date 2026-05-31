import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export interface PushRegistrationResult {
  token: string | null;
  reason?: 'denied' | 'not-supported' | 'no-project-id' | 'error';
  error?: string;
}

let configured = false;

/**
 * Configura cómo se muestran las notifs en foreground (1 vez al inicio).
 * Idempotente.
 */
export function configurePushHandler() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      // Deja que iOS incremente el badge automáticamente; el store reconcilia
      // con el conteo real cuando el user abre la app.
      shouldSetBadge: true,
    } as any),
  });
}

/**
 * Pide permisos y obtiene el Expo Push Token. Para Android crea el canal default.
 */
export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  if (!Device.isDevice && Platform.OS !== 'web') {
    return { token: null, reason: 'not-supported' };
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Reservas',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        lightColor: '#0f766e',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      final = req.status;
    }
    if (final !== 'granted') {
      return { token: null, reason: 'denied' };
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return { token: tokenResponse.data ?? null };
  } catch (e: any) {
    return {
      token: null,
      reason: 'error',
      error: e?.message ?? String(e),
    };
  }
}
