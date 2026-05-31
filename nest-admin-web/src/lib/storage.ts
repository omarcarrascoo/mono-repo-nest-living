/**
 * Persistencia del token en web. El móvil usa expo-secure-store; aquí usamos
 * localStorage. Es síncrono y solo existe en el browser, así que guardamos
 * contra SSR con un check de `typeof window`.
 */
const isBrowser = typeof window !== "undefined";

export const storage = {
  getItem(key: string): string | null {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* quota / private mode — ignoramos */
    }
  },
  removeItem(key: string): void {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};
