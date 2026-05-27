import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { FeedComposer } from '@/components/feed/FeedComposer';
import { FeaturedCard } from '@/components/feed/FeaturedCard';
import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { CommunityCTA } from '@/components/community/CommunityCta';
import { COLORS, THEME } from '@/constants/theme';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FeaturedPostData, FeedPostData } from '@/types/feed';
import { DashboardHeader } from '@/components/ui/DashboardHeader';
import { useNotificationsStore } from '@/stores/notifications-store';



// --- MOCK DATA ---
const FEATURED_DATA: FeaturedPostData[] = [
  {
    id: '1',
    author: { name: 'Admin Office', avatar: 'https://ui-avatars.com/api/?name=Admin&background=000&color=fff', role: 'Community Manager' },
    badgeIcon: 'shield',
    title: 'Festival de Verano 2025',
    preview: '¡Es esa época del año otra vez! Estamos emocionados de anunciar...',
    image: '',
  },
  {
    id: '2',
    author: { name: 'Seguridad', avatar: 'https://ui-avatars.com/api/?name=Sec&background=000&color=fff', role: 'Staff' },
    badgeIcon: 'lock',
    title: 'Nuevos Protocolos',
    preview: 'Los anfitriones ahora pueden programar accesos QR desde la app...',
    image: '',
  },
];

const FEED_DATA: FeedPostData[] = [
  {
    id: '101',
    author: { name: 'Sienna Miller', handle: '@sienna · Super Neighbor', avatar: 'https://i.pravatar.cc/150?u=sienna' },
    tag: 'Ayuda con Reservas',
    title: '¿Dónde edito las "variables"?',
    content: '¿Cómo se organizan con múltiples propiedades? Es un reto llevar el control...',
    time: '45 min · Torre B',
    likes: 24,
    replies: 15,
    reactions: ['❤️', '👍', '😊'],
  },
  {
    id: '102',
    author: { name: 'Aeron Smith', handle: '@aeron · Level 2', avatar: 'https://i.pravatar.cc/150?u=aeron' },
    tag: 'Consejo sobre Espacios',
    title: 'Nuevo en el vecindario',
    content: 'Somos nuevos en este fraccionamiento y agradeceríamos su feedback...',
    time: '1 hr · Torre A',
    likes: 12,
    replies: 4,
    reactions: ['👋', '🏠'],
  },
];

export default function FeedUnifiedScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Todos');

  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationsStore((s) => s.fetchUnreadCount);

  useEffect(() => {
    void fetchUnreadCount();
  }, [fetchUnreadCount]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* 1. Header Global */}
        <DashboardHeader
            avatarUrl="https://i.pravatar.cc/150?u=a042581f4e29026024d"
            hasUnread={unreadCount > 0}
            onMenuPress={() => router.push('/notifications' as never)}
            variant="standard"
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            
            {/* 2. Hero Section & Toggles */}
            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Bienvenido al{'\n'}Muro Vecinal</Text>
                <ToggleRow 
                    tabs={['Todos', 'Administración']}
                    activeTab={activeTab}
                    onTabPress={setActiveTab}
                />
            </View>

            {/* 3. Composer Section */}
            <SectionHeader 
                title="Conversaciones" 
                rightAction={
                    <TouchableOpacity style={styles.filterChip}>
                        <Text style={styles.filterChipText}>Top</Text>
                        <Feather name="chevron-down" size={14} color={COLORS.text.primary} />
                    </TouchableOpacity>
                }
            />
            <FeedComposer avatarUrl="https://i.pravatar.cc/150?u=a042581f4e29026024d" />

            {/* 4. Featured Carousel */}
            <SectionHeader 
                title="Destacados" 
                rightAction={
                    <View style={styles.arrowsRow}>
                         <View style={styles.arrowCircle}><Feather name="chevron-left" size={18} color="#222" /></View>
                         <View style={[styles.arrowCircle, {marginLeft: 8}]}><Feather name="chevron-right" size={18} color="#222" /></View>
                    </View>
                }
            />
            
            <FlatList 
                horizontal
                data={FEATURED_DATA}
                renderItem={({ item }) => <FeaturedCard item={item} />}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
                snapToInterval={styles.featuredSnap.width} // Usando valor calculado aproximado
                decelerationRate="fast"
            />

            {/* 5. Feed List */}
            <View style={{ marginTop: 24 }}>
                {FEED_DATA.map(post => (
                    <FeedPostCard 
                        key={post.id} 
                        item={post} 
                        onLike={() => console.log('Like', post.id)}
                    />
                ))}
            </View>

            {/* 6. Footer CTA */}
            {/* <CommunityCTA /> */}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ui.white },
  heroSection: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 30 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: COLORS.text.primary, lineHeight: 38, marginBottom: 24 },
  
  // Helpers locales para el header section
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#EBEBEB' },
  filterChipText: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary },
  arrowsRow: { flexDirection: 'row' },
  arrowCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' },
  
  // Helper para snap
  featuredSnap: { width: 0 }, // Placeholder, logic handled in props
});