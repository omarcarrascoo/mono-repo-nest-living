import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '@/constants/theme';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { AmenityDetail } from '@/types/amenity';
import { Amenity, Reservation } from '@/types/api';
import { DetailHero } from '@/components/amenities/detail/DetailHero';
import { DetailInfo } from '@/components/amenities/detail/DetailInfo';
import { StickyFooter } from '@/components/amenities/detail/StickyFooter';
import { ReserveBottomSheet } from '@/components/reservations/ReserveBottomSheet';
import { ResultModal } from '@/components/ui/ResultModal';
import { useAmenitiesStore } from '@/stores/amenities-store';
import { useFavoritesStore } from '@/stores/favorites-store';
import { formatDateTime, getUserTimezone } from '@/lib/datetime';

function toDetail(a: Amenity): AmenityDetail {
  return {
    id: a.id,
    title: a.title,
    description: a.description ?? '',
    image: a.image ?? '',
    location: a.location ?? '',
    rating: a.rating,
    reviews: a.reviews,
    status: a.status,
    nextSlot: a.nextSlot ?? '—',
    availableSlots: a.availableSlots,
    capacity: a.capacity ?? 0,
    features: a.features,
    rules: a.rules,
  };
}

type ResultState =
  | { kind: 'success'; reservation: Reservation }
  | { kind: 'error'; message: string }
  | null;

export default function AmenityDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = String(params.id ?? '');

  const cached = useAmenitiesStore((s) => (id ? s.byId[id] : undefined));
  const fetchOne = useAmenitiesStore((s) => s.fetchOne);
  const favoritesLoaded = useFavoritesStore((s) => s.loaded);
  const hydrateFavorites = useFavoritesStore((s) => s.hydrate);

  const [data, setData] = useState<Amenity | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [result, setResult] = useState<ResultState>(null);

  useEffect(() => {
    if (!favoritesLoaded) void hydrateFavorites();
  }, [favoritesLoaded, hydrateFavorites]);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchOne(id)
      .then((item) => {
        if (!cancelled) {
          setData(item);
          setLoading(false);
        }
      })
      .catch((e: any) => {
        if (!cancelled) {
          setError(e?.message ?? 'No pudimos cargar la amenidad');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, cached, fetchOne]);

  const handleBack = () => router.back();

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={COLORS.brand.teal} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorTitle}>No pudimos cargar la amenidad</Text>
        {error ? <Text style={styles.errorBody}>{error}</Text> : null}
        <TouchableOpacity onPress={handleBack} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const detail = toDetail(data);
  const tz = data.timezone ?? getUserTimezone();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <DetailHero amenity={data} onBack={handleBack} />
        <DetailInfo data={detail} />
      </ScrollView>

      <StickyFooter
        status={detail.status}
        onPress={() => setSheetVisible(true)}
      />

      <ReserveBottomSheet
        amenity={data}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSuccess={(reservation) => {
          setSheetVisible(false);
          setResult({ kind: 'success', reservation });
        }}
        onError={(message) => {
          setResult({ kind: 'error', message });
        }}
      />

      {result?.kind === 'success' && (
        <ResultModal
          visible
          variant="success"
          title="¡Reserva confirmada!"
          message={`Te esperamos en ${data.title} · ${formatDateTime(
            new Date(result.reservation.startTime),
            tz,
            { use12h: true },
          )}.`}
          primaryLabel="Ver mis reservas"
          onPrimary={() => {
            setResult(null);
            router.push('/reservations');
          }}
          secondaryLabel="Cerrar"
          onSecondary={() => setResult(null)}
          onClose={() => setResult(null)}
        />
      )}

      {result?.kind === 'error' && (
        <ResultModal
          visible
          variant="error"
          title="No pudimos reservar"
          message={result.message}
          primaryLabel="Volver a intentar"
          onPrimary={() => {
            setResult(null);
            setSheetVisible(true);
          }}
          secondaryLabel="Cerrar"
          onSecondary={() => setResult(null)}
          onClose={() => setResult(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ui.white },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  scrollContent: { paddingBottom: 120 },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.brand.teal,
  },
  errorBtnText: { color: '#fff', fontWeight: '700' },
});
