import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  SafeAreaView, 
  StatusBar, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

// Imports de Componentes y Tipos
import { SavingsHeader } from '@/components/promotions/SavingsHeader';
import { PromoSearchBar } from '@/components/promotions/PromoSearchBar';
import { CategoryPill } from '@/components/promotions/CategoryPill';
import { HeroDealCard } from '@/components/promotions/HeroDealCard';
import { RegularDealCard } from '@/components/promotions/RegularDealCard';
import { PromoCategory, PromoDeal } from '@/types/promotions';
import { DashboardHeader } from '@/components/ui/DashboardHeader';

// --- MOCK DATA ---
const CATEGORIES: PromoCategory[] = [
  { id: 'all', label: 'Todo', icon: 'grid' },
  { id: 'food', label: 'Comida', icon: 'coffee' },
  { id: 'wellness', label: 'Wellness', icon: 'activity' },
  { id: 'services', label: 'Servicios', icon: 'tool' },
  { id: 'pets', label: 'Mascotas', icon: 'heart' },
];

const DEALS: PromoDeal[] = [
  {
    id: '1',
    merchant: { name: 'Green Salad Co.', logo: 'https://ui-avatars.com/api/?name=GS&background=10b981&color=fff' },
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop',
    title: '2x1 en Bowls de Quinoa',
    discount: '2x1',
    expiry: 'Vence en 2 días',
    category: 'food',
    distance: '1.2 km',
    isExclusive: true,
  },
  {
    id: '2',
    merchant: { name: 'Zen Yoga Studio', logo: 'https://ui-avatars.com/api/?name=ZY&background=8b5cf6&color=fff' },
    image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=2069&auto=format&fit=crop',
    title: '50% Off Primer Mes',
    discount: '-50%',
    expiry: 'Válido todo Enero',
    category: 'wellness',
    distance: '800 m',
  },
  {
    id: '3',
    merchant: { name: 'VetCare Plus', logo: 'https://ui-avatars.com/api/?name=VC&background=f43f5e&color=fff' },
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=2043&auto=format&fit=crop',
    title: 'Baño y Corte Gratis',
    discount: 'GRATIS',
    expiry: 'Solo nuevos usuarios',
    category: 'pets',
    distance: '2.5 km',
  },
];

export default function PromotionsScreen() {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.ui.white} />
      <SafeAreaView style={{ flex: 1 }}>

        <DashboardHeader 
          avatarUrl="https://i.pravatar.cc/150?u=a042581f4e29026024d"
          onMenuPress={() => console.log('Open Menu')}
          variant="standard"
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <SavingsHeader />
          <PromoSearchBar />

          {/* Categorías */}
          <View style={styles.categoriesContainer}>
            <FlatList
              horizontal
              data={CATEGORIES}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
              renderItem={({ item }) => (
                <CategoryPill 
                  item={item} 
                  isActive={activeCategory === item.id}
                  onPress={() => setActiveCategory(item.id)}
                />
              )}
              keyExtractor={item => item.id}
            />
          </View>

          {/* Sección Destacada */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Destacado del día</Text>
            <HeroDealCard />
          </View>

          {/* Sección Lista */}
          <View style={styles.sectionContainer}>
            <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Cerca de ti</Text>
                <TouchableOpacity>
                    <Text style={styles.linkText}>Ver todos</Text>
                </TouchableOpacity>
            </View>
            
            {DEALS.map(deal => (
                <RegularDealCard key={deal.id} item={deal} />
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.backgroundSecondary,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.ui.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.text.input, // #f1f5f9
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  categoriesContainer: {
    paddingVertical: 10,
  },
  categoriesList: {
    paddingHorizontal: 24, 
    gap: 10,
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.brand.teal,
  },
});