import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, THEME } from '@/constants/theme';
import { DashboardHeader } from '@/components/ui/DashboardHeader';
import { CategoryRail } from '@/components/delivery/CategoryRail';
import { FeaturedProductCard } from '@/components/delivery/FeaturedProductCard';
import { ProductCard } from '@/components/delivery/ProductCard';
import { CartFAB } from '@/components/delivery/CartFAB';
import { AdminDeliveryView } from '@/components/admin/AdminDeliveryView';
import { useDeliveryStore } from '@/stores/delivery-store';
import { cartSelectors, useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationsStore } from '@/stores/notifications-store';

export default function DeliveryScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const products = useDeliveryStore((s) => s.products);
  const categories = useDeliveryStore((s) => s.categories);
  const featured = useDeliveryStore((s) => s.featured);
  const loading = useDeliveryStore((s) => s.loading);
  const refreshing = useDeliveryStore((s) => s.refreshing);
  const error = useDeliveryStore((s) => s.error);
  const fetchAll = useDeliveryStore((s) => s.fetchAll);
  const refresh = useDeliveryStore((s) => s.refresh);
  const setQuery = useDeliveryStore((s) => s.setQuery);

  const itemCount = useCartStore(cartSelectors.itemCount);
  const cartTotal = useCartStore(cartSelectors.total);
  const addProduct = useCartStore((s) => s.addProduct);

  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationsStore((s) => s.fetchUnreadCount);

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (isAdmin) {
      void fetchUnreadCount();
      return;
    }
    void fetchAll();
    void fetchUnreadCount();
  }, [isAdmin, fetchAll, fetchUnreadCount]);

  useEffect(() => {
    if (isAdmin) return;
    const handle = setTimeout(() => {
      setQuery({
        q: searchText.trim() ? searchText.trim() : undefined,
        category: activeCategoryId ?? undefined,
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [isAdmin, searchText, activeCategoryId, setQuery]);

  const handleSelectCategory = (id: string | null) => {
    setActiveCategoryId(id);
    setQuery({
      q: searchText.trim() ? searchText.trim() : undefined,
      category: id ?? undefined,
    });
  };

  const handleQuickAdd = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    addProduct(product, {}, 1);
  };

  if (isAdmin) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.ui.white} />
        <SafeAreaView style={{ flex: 1 }}>
          <DashboardHeader
            avatarUrl={user?.avatar ?? 'https://i.pravatar.cc/150?u=a042581f4e29026024d'}
            userName={user?.fullName?.split(' ')[0] ?? 'Admin'}
            location="Cocina y pedidos"
            hasUnread={unreadCount > 0}
            onMenuPress={() => router.push('/notifications' as never)}
            variant="standard"
          />
          <View style={styles.adminHeroBlock}>
            <Text style={styles.heroEyebrow}>Operación</Text>
            <Text style={styles.adminHeroTitle}>Pedidos en vivo</Text>
            <Text style={styles.adminHeroSubtitle}>
              Avanza el estado de cada pedido y mantén tu menú al día.
            </Text>
          </View>
          <AdminDeliveryView />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.ui.white} />
      <SafeAreaView style={{ flex: 1 }}>
        <DashboardHeader
          avatarUrl="https://i.pravatar.cc/150?u=a042581f4e29026024d"
          hasUnread={unreadCount > 0}
          onMenuPress={() => router.push('/notifications' as never)}
          variant="standard"
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={COLORS.brand.tealDark}
            />
          }
        >
          {/* Header copy */}
          <View style={styles.heroBlock}>
            <Text style={styles.heroEyebrow}>Tu residencia</Text>
            <Text style={styles.heroTitle}>¿Qué se te antoja{'\n'}hoy?</Text>
          </View>

          {/* Search */}
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color={COLORS.text.placeholder} />
            <TextInput
              placeholder="Busca productos, categorías…"
              placeholderTextColor={COLORS.text.placeholder}
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
            {searchText.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchText('')} hitSlop={8}>
                <Feather name="x" size={16} color={COLORS.text.placeholder} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Mis pedidos shortcut */}
          <TouchableOpacity
            style={styles.myOrdersLink}
            activeOpacity={0.85}
            onPress={() => router.push('/orders' as never)}
          >
            <View style={styles.myOrdersIcon}>
              <Feather name="shopping-bag" size={16} color={COLORS.brand.tealDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.myOrdersTitle}>Mis pedidos</Text>
              <Text style={styles.myOrdersBody}>Sigue el avance de tus órdenes</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.text.label} />
          </TouchableOpacity>

          {/* Categorías */}
          {categories.length > 0 ? (
            <View style={styles.categoriesBlock}>
              <CategoryRail
                categories={categories}
                activeId={activeCategoryId}
                onSelect={handleSelectCategory}
              />
            </View>
          ) : null}

          {/* Destacado del día */}
          {featured ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Destacado del día</Text>
              <FeaturedProductCard
                featured={featured}
                onPress={() => router.push(`/delivery/${featured.productId}` as never)}
              />
            </View>
          ) : null}

          {/* Lista */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeCategoryId
                  ? categories.find((c) => c.id === activeCategoryId)?.name ?? 'Productos'
                  : 'Todos los productos'}
              </Text>
              <Text style={styles.sectionCount}>
                {products.length} {products.length === 1 ? 'producto' : 'productos'}
              </Text>
            </View>

            {loading && products.length === 0 ? (
              <View style={styles.statePad}>
                <ActivityIndicator color={COLORS.brand.tealDark} />
              </View>
            ) : error && products.length === 0 ? (
              <View style={styles.statePad}>
                <Feather name="alert-circle" size={28} color={COLORS.status.error} />
                <Text style={styles.stateTitle}>No pudimos cargar el menú</Text>
                <Text style={styles.stateBody}>{error}</Text>
              </View>
            ) : products.length === 0 ? (
              <View style={styles.statePad}>
                <Feather name="search" size={28} color={COLORS.text.label} />
                <Text style={styles.stateTitle}>
                  {searchText.trim() || activeCategoryId
                    ? 'Nada coincide con tu búsqueda'
                    : 'Sin productos por ahora'}
                </Text>
                <Text style={styles.stateBody}>
                  {searchText.trim() || activeCategoryId
                    ? 'Prueba con otra categoría o término.'
                    : 'Vuelve más tarde para ver el menú del día.'}
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onPress={() => router.push(`/delivery/${p.id}` as never)}
                    onQuickAdd={() => handleQuickAdd(p.id)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <CartFAB
          itemCount={itemCount}
          total={cartTotal}
          onPress={() => router.push('/delivery/cart' as never)}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light.backgroundSecondary },
  scrollContent: { paddingBottom: 200 },
  heroBlock: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text.label,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text.primary,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  adminHeroBlock: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  adminHeroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  adminHeroSubtitle: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 24,
    marginBottom: 18,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.ui.white,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    shadowColor: THEME.shadows.default.shadowColor,
    shadowOffset: THEME.shadows.default.shadowOffset,
    shadowOpacity: THEME.shadows.default.shadowOpacity,
    shadowRadius: THEME.shadows.default.shadowRadius,
    elevation: THEME.shadows.default.elevation,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
    height: '100%',
  },
  myOrdersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.ui.white,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  myOrdersIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.promotions.pillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myOrdersTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  myOrdersBody: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  categoriesBlock: {
    paddingVertical: 6,
    marginBottom: 8,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.label,
  },
  list: { gap: 12 },
  statePad: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  stateBody: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
