"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Fetch con patrón stale-while-revalidate para las pantallas del dashboard.
 *
 * Diseñado para cumplir la regla `react-hooks/set-state-in-effect` de React 19:
 * **ningún `setState` se llama de forma síncrona dentro del effect** — todos
 * ocurren dentro de los callbacks de la promesa (`then`/`catch`/`finally`), que
 * son asíncronos. Al cambiar `load` (p.ej. otro filtro) se refetchea en segundo
 * plano manteniendo los datos previos visibles, sin parpadeo de spinner.
 *
 * `load` debe venir memoizado (useCallback) por el caller; sus dependencias
 * definen cuándo se vuelve a pedir.
 */
export function useAsyncData<T>(load: () => Promise<T>): {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  setError: (msg: string | null) => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    load()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError((e as Error)?.message ?? "Algo salió mal.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [load, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, reload, setError };
}
