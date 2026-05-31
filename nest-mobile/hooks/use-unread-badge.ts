import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationsStore } from '@/stores/notifications-store';

/**
 * Mantiene el `unreadCount` actualizado en cada tab que lo monta:
 * - Al volver el foco a la pantalla (tab switch).
 * - Cuando la app vuelve del background → foreground.
 *
 * Solo dispara peticiones si el user está autenticado, así que es seguro
 * llamarlo desde cualquier tab sin condiciones adicionales.
 */
export function useUnreadBadge() {
  const status = useAuthStore((s) => s.status);
  const fetchUnreadCount = useNotificationsStore((s) => s.fetchUnreadCount);

  useFocusEffect(() => {
    if (status === 'authenticated') {
      void fetchUnreadCount();
    }
    return () => {};
  });

  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (next: AppStateStatus) => {
        if (next === 'active' && status === 'authenticated') {
          void fetchUnreadCount();
        }
      },
    );
    return () => sub.remove();
  }, [status, fetchUnreadCount]);
}
