// src/components/profile/ProfileHeader.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { UserProfile } from '@/types/user';
import RowBackHeader from '../ui/RowBackHeader';
interface ProfileHeaderProps {
  user: UserProfile;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <View style={styles.headerBackground}>
      <SafeAreaView>
        
        {/* ✅ Componente Reutilizable Insertado */}
        <RowBackHeader 
            title="Mi Perfil" 
            rightIcon="settings" 
            onRightPress={() => console.log('Ir a ajustes')}
        />

        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            <View style={styles.statusBadge}>
              <Feather name="check" size={12} color="#FFF" />
            </View>
          </View>
          <Text style={styles.userName}>{user.fullName}</Text>
          
          <View style={styles.unitChip}>
            <MaterialCommunityIcons name="home-city-outline" size={14} color={COLORS.text.subtitle} />
            <Text style={styles.unitText}>{user.unitNumber}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Estado</Text>
                <Text style={[styles.statValue, { color: COLORS.status.success }]}>
                    {user.status === 'ACTIVE' ? 'Al día' : 'Inactivo'}
                </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Contrato</Text>
                <Text style={styles.statValue}>{user.lease.daysLeft} días</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Balance</Text>
                <Text style={styles.statValue}>${user.stats.balanceOwed.toFixed(2)}</Text>
            </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
    headerBackground: { backgroundColor: COLORS.background.base, paddingBottom: 40 },
    
    // NOTA: He eliminado navBar, navTitle, e iconBtn de aquí porque ya viven en RowBackHeader
    
    profileHeader: { alignItems: 'center', marginBottom: 24 },
    avatarContainer: { marginBottom: 16 },
    avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: 'rgba(255,255,255,0.1)' },
    statusBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.brand.emerald, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: COLORS.background.base },
    userName: { fontSize: 24, fontWeight: '700', color: COLORS.text.title, marginBottom: 4 },
    unitChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background.glass, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, gap: 6 },
    unitText: { color: COLORS.text.subtitle, fontWeight: '600', fontSize: 14 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, paddingVertical: 16, backgroundColor: COLORS.background.glass, borderRadius: 16, borderWidth: 1, borderColor: COLORS.text.placeholder },
    statItem: { alignItems: 'center', flex: 1 },
    dividerVertical: { width: 1, height: '80%', backgroundColor: 'rgba(255,255,255,0.1)' },
    statLabel: { color: COLORS.text.subtitle, fontSize: 12, marginBottom: 4 },
    statValue: { color: COLORS.text.title, fontSize: 16, fontWeight: '700' },
});