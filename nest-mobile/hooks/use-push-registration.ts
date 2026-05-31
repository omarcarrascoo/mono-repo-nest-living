import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { configurePushHandler, registerForPushNotificationsAsync } from '@/lib/push';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationsStore } from '@/stores/notifications-store';

/**
 * Hook que se monta en el RootLayout. Cuando el usuario está autenticado:
 *  1. Configura el handler de foreground.
 *  2. Solicita permisos + obtiene Expo Push Token.
 *  3. Lo manda al backend (idempotente vía store).
 *  4. Suscribe al evento "tap" para deep-linking a /reservation/:id.
 */
export function usePushRegistration() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const registerToken = useNotificationsStore((s) => s.registerToken);
  const registeredToken = useNotificationsStore((s) => s.registeredToken);

  useEffect(() => {
    configurePushHandler();
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (registeredToken) return;

    let cancelled = false;
    void (async () => {
      const result = await registerForPushNotificationsAsync();
      if (cancelled) return;
      if (!result.token) return;

      const platform =
        Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web'
          ? Platform.OS
          : 'unknown';
      const deviceName = Device.deviceName ?? Device.modelName ?? undefined;

      await registerToken(result.token, platform, deviceName ?? undefined);
    })();

    return () => {
      cancelled = true;
    };
  }, [status, registeredToken, registerToken]);

  // Foreground listener: cuando llega un push con la app abierta, refresca el
  // inbox + badge para que el icono del bell y la pantalla /notifications se
  // actualicen sin tener que jalar manualmente.
  useEffect(() => {
    if (status !== 'authenticated') return;
    const sub = Notifications.addNotificationReceivedListener(() => {
      const store = useNotificationsStore.getState();
      void store.fetchUnreadCount();
      if (store.loadedAt) void store.refreshInbox();
    });
    return () => sub.remove();
  }, [status]);

  // Listener de taps → deep link + mark-as-read
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data ?? {};
      const notificationId =
        typeof data.notificationId === 'string' ? data.notificationId : undefined;
      const reservationId =
        typeof data.reservationId === 'string' ? data.reservationId : undefined;
      const amenityId =
        typeof data.amenityId === 'string' ? data.amenityId : undefined;
      const orderId =
        typeof data.orderId === 'string' ? data.orderId : undefined;
      const postId =
        typeof data.postId === 'string' ? data.postId : undefined;

      if (notificationId) {
        void useNotificationsStore.getState().markRead(notificationId);
      }

      if (reservationId) {
        router.push(`/reservation/${reservationId}`);
      } else if (orderId) {
        router.push(`/orders/${orderId}`);
      } else if (postId) {
        router.push(`/post/${postId}`);
      } else if (amenityId) {
        router.push(`/amenity/${amenityId}`);
      } else {
        router.push('/notifications');
      }
    });
    return () => sub.remove();
  }, [router]);
}
