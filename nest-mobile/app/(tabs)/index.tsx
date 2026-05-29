import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/theme';

import { AmenityCard, AmenityItem } from '@/components/amenities/AmenityCard';
import { CategoryFilter, CategoryChip } from '@/components/ui/CategoryTabs';
import { HeroSearch } from '@/components/ui/SearchBar';
import { DashboardHeader } from '@/components/ui/DashboardHeader';
import { AdminResidentsView } from '@/components/admin/AdminResidentsView';
import { useAmenitiesStore } from '@/stores/amenities-store';
import { useAuthStore } from '@/stores/auth-store';
import { useCategoriesStore } from '@/stores/categories-store';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useNotificationsStore } from '@/stores/notifications-store';
import { Amenity } from '@/types/api';

function toCard(item: Amenity): AmenityItem {
  return {
    id: item.id,
    title: item.title,
    location: item.location ?? '',
    status: item.status,
    nextSlot: item.nextSlot ?? '—',
    rating: item.rating,
    image: item.image ?? '',
  };
}

export default function UnifiedAmenitiesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeMembershipRole = useAuthStore((s) => s.activeMembershipRole); const isAdmin = activeMembershipRole === 'admin';

  const items = useAmenitiesStore((s) => s.items);
  const loading = useAmenitiesStore((s) => s.loading);
  const refreshing = useAmenitiesStore((s) => s.refreshing);
  const error = useAmenitiesStore((s) => s.error);
  const fetchAll = useAmenitiesStore((s) => s.fetchAll);
  const setQuery = useAmenitiesStore((s) => s.setQuery);
  const refresh = useAmenitiesStore((s) => s.refresh);

  const categories = useCategoriesStore((s) => s.items);
  const fetchCategories = useCategoriesStore((s) => s.fetchAll);

  const favoritesLoaded = useFavoritesStore((s) => s.loaded);
  const hydrateFavorites = useFavoritesStore((s) => s.hydrate);

  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationsStore((s) => s.fetchUnreadCount);

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const adminScrollY = useRef(new Animated.Value(0)).current;
  const sheetTranslate = adminScrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -28],
    extrapolate: 'clamp',
  });
  const heroOpacity = adminScrollY.interpolate({
    inputRange: [0, 80, 140],
    outputRange: [1, 0.6, 0],
    extrapolate: 'clamp',
  });
  const heroTranslate = adminScrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [0, -16],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (isAdmin) {
      void fetchUnreadCount();
      return;
    }
    void fetchAll();
    void fetchCategories();
    if (!favoritesLoaded) void hydrateFavorites();
    void fetchUnreadCount();
  }, [
    isAdmin,
    fetchAll,
    fetchCategories,
    favoritesLoaded,
    hydrateFavorites,
    fetchUnreadCount,
  ]);

  useEffect(() => {
    if (isAdmin) return;
    const handle = setTimeout(() => {
      setQuery({
        q: searchText.trim() ? searchText.trim() : undefined,
        category: activeCategoryId ?? undefined,
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [isAdmin, searchText, setQuery, activeCategoryId]);

  const handleSelectCategory = (id: string | null) => {
    setActiveCategoryId(id);
    setQuery({
      q: searchText.trim() ? searchText.trim() : undefined,
      category: id ?? undefined,
    });
  };

  const chips: CategoryChip[] = useMemo(
    () => categories.map((c) => ({ id: c.id, name: c.name })),
    [categories],
  );

  const handleNavigation = (id: string) => {
    router.push(`../amenity/${id}`);
  };

  if (isAdmin) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background.base} />
        <View style={styles.topSection}>
          <SafeAreaView>
            <DashboardHeader
              avatarUrl={
                user?.avatar ??
                'https://i.pravatar.cc/150?u=a042581f4e29026024d'
              }
              userName={user?.fullName?.split(' ')[0] ?? 'Admin'}
              location="Panel de administración"
              hasUnread={unreadCount > 0}
              onMenuPress={() => router.push('/notifications' as never)}
            />
            <Animated.View
              style={[
                styles.adminHero,
                {
                  opacity: heroOpacity,
                  transform: [{ translateY: heroTranslate }],
                },
              ]}
            >
              <Text style={styles.adminHeroEyebrow}>Residencia</Text>
              <Text style={styles.adminHeroTitle}>Tu comunidad</Text>
              <Text style={styles.adminHeroSubtitle}>
                Gestiona residentes, busca por nombre o unidad y mándales avisos directos.
              </Text>
            </Animated.View>
          </SafeAreaView>
        </View>
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: sheetTranslate }] },
          ]}
        >
          <AdminResidentsView scrollY={adminScrollY} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background.base} />

      <View style={styles.topSection}>
        <SafeAreaView>
          <DashboardHeader
            avatarUrl={
              user?.avatar ??
              'https://i.pravatar.cc/150?u=a042581f4e29026024d'
            }
            userName={user?.fullName?.split(' ')[0] ?? 'Vecino'}
            hasUnread={unreadCount > 0}
            onMenuPress={() => router.push('/notifications' as never)}
          />

          <HeroSearch
            title={`Explora tus\nEspacios`}
            searchValue={searchText}
            onSearchChange={setSearchText}
          />
        </SafeAreaView>
      </View>

      <View style={styles.bottomSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={COLORS.brand.teal}
            />
          }
        >
          <CategoryFilter
            categories={chips}
            activeCategoryId={activeCategoryId}
            onSelectCategory={handleSelectCategory}
          />

          {loading && items.length === 0 ? (
            <View style={styles.statePad}>
              <ActivityIndicator color={COLORS.brand.teal} />
            </View>
          ) : error && items.length === 0 ? (
            <View style={styles.statePad}>
              <Text style={styles.stateTitle}>No pudimos cargar las amenidades</Text>
              <Text style={styles.stateBody}>{error}</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.statePad}>
              <Text style={styles.stateTitle}>
                {searchText.trim() || activeCategoryId
                  ? 'Nada coincide con tu búsqueda'
                  : 'Aún no hay amenidades'}
              </Text>
              <Text style={styles.stateBody}>
                {searchText.trim() || activeCategoryId
                  ? 'Prueba otro término o categoría.'
                  : 'Cuando tu administrador agregue espacios, aparecerán aquí.'}
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {items.map((item) => (
                <AmenityCard
                  key={item.id}
                  item={toCard(item)}
                  onPress={() => handleNavigation(item.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.base },
  topSection: { backgroundColor: COLORS.background.base, paddingBottom: 24 },
  bottomSheet: {
    flex: 1,
    backgroundColor: COLORS.ui.lightSheet,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: 'hidden',
  },
  scrollContent: { paddingTop: 24, paddingBottom: 40 },
  listContainer: { paddingHorizontal: 24, gap: 24 },
  statePad: {
    paddingHorizontal: 32,
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  stateBody: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  adminHero: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 6,
  },
  adminHeroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand.teal,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  adminHeroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text.title,
    letterSpacing: -0.5,
  },
  adminHeroSubtitle: {
    fontSize: 14,
    color: COLORS.text.subtitle,
    lineHeight: 20,
    marginTop: 2,
  },
});
