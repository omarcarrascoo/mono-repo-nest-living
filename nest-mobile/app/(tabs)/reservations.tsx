import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { useReservationsStore } from '@/stores/reservations-store';
import { ReservationCard } from '@/components/reservations/ReservationCard';
import { AdminReservationsView } from '@/components/admin/AdminReservationsView';
import { getUserTimezone } from '@/lib/datetime';
import { useAuthStore } from '@/stores/auth-store';

type FilterKey = 'upcoming' | 'past' | 'cancelled';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'upcoming', label: 'Próximas' },
  { key: 'past', label: 'Pasadas' },
  { key: 'cancelled', label: 'Canceladas' },
];

export default function ReservationsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tz = user?.timezone ?? getUserTimezone();
  const activeMembershipRole = useAuthStore((s) => s.activeMembershipRole); const isAdmin = activeMembershipRole === 'admin';

  const [activeFilter, setActiveFilter] = React.useState<FilterKey>('upcoming');

  const byId = useReservationsStore((s) => s.byId);
  const pages = useReservationsStore((s) => s.pages);
  const fetchPage = useReservationsStore((s) => s.fetchPage);

  const page = pages[activeFilter];

  useEffect(() => {
    if (isAdmin) return;
    if (!page.loaded && !page.loading) {
      void fetchPage(activeFilter);
    }
  }, [isAdmin, activeFilter, page.loaded, page.loading, fetchPage]);

  if (isAdmin) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background.base} />
        <View style={styles.topSection}>
          <SafeAreaView>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>Operaciones</Text>
                <Text style={styles.title}>Reservas</Text>
              </View>
            </View>
            <Text style={styles.heroSubtitle}>
              Estadísticas en tiempo real, reservas activas y catálogo de amenidades.
            </Text>
          </SafeAreaView>
        </View>
        <View style={styles.bottomSheet}>
          <AdminReservationsView timezone={tz} />
        </View>
      </View>
    );
  }

  const data = page.ids.map((id) => byId[id]).filter(Boolean);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background.base} />

      <View style={styles.topSection}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Mis reservas</Text>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push('/(tabs)')}
              hitSlop={8}
            >
              <Feather name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setActiveFilter(f.key)}
                  style={[styles.tab, isActive && styles.tabActive]}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.bottomSheet}>
        {page.loading && data.length === 0 ? (
          <View style={styles.statePad}>
            <ActivityIndicator color={COLORS.brand.tealDark} />
          </View>
        ) : page.error && data.length === 0 ? (
          <View style={styles.statePad}>
            <Text style={styles.stateTitle}>No pudimos cargar tus reservas</Text>
            <Text style={styles.stateBody}>{page.error}</Text>
            <TouchableOpacity
              onPress={() => void fetchPage(activeFilter, { refresh: true })}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.statePad}>
            <Feather name="calendar" size={32} color="#94a3b8" />
            <Text style={styles.stateTitle}>
              {activeFilter === 'upcoming'
                ? 'No tienes reservas próximas'
                : activeFilter === 'past'
                  ? 'Sin reservas pasadas'
                  : 'Sin reservas canceladas'}
            </Text>
            <Text style={styles.stateBody}>
              {activeFilter === 'upcoming'
                ? 'Reserva una amenidad y aparecerá aquí.'
                : 'Tus reservas aparecerán aquí cuando ocurran.'}
            </Text>
            {activeFilter === 'upcoming' && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)')}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>Explorar amenidades</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(r) => r.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => (
              <ReservationCard
                reservation={item}
                timezone={tz}
                onPress={() => router.push(`/reservation/${item.id}`)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={page.refreshing}
                onRefresh={() => void fetchPage(activeFilter, { refresh: true })}
                tintColor={COLORS.brand.tealDark}
              />
            }
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (page.cursor && !page.loadingMore) {
                void fetchPage(activeFilter, { append: true });
              }
            }}
            ListFooterComponent={
              page.loadingMore ? (
                <View style={{ padding: 16 }}>
                  <ActivityIndicator color={COLORS.brand.tealDark} />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.base },
  topSection: { backgroundColor: COLORS.background.base, paddingBottom: 24 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.title,
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.subtitle,
  },
  tabTextActive: {
    color: COLORS.brand.tealDark,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: COLORS.ui.lightSheet,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  statePad: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 64,
    alignItems: 'center',
    gap: 8,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  stateBody: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.brand.tealDark,
    marginTop: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand.teal,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroSubtitle: {
    paddingHorizontal: 24,
    paddingTop: 6,
    fontSize: 14,
    color: COLORS.text.subtitle,
    lineHeight: 20,
  },
});
