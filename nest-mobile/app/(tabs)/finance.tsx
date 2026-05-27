import React, { useEffect } from 'react';
import { View, ScrollView, StatusBar, SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { DashboardHeader } from '@/components/ui/DashboardHeader';
import { BalanceSection } from '@/components/wallet/BalanceSection';
import { PaymentWidget } from '@/components/wallet/PaymentWidget';
import { TransactionList } from '@/components/wallet/TransactionList';
import { COLORS } from '@/constants/theme';
import { useNotificationsStore } from '@/stores/notifications-store';

// Mock Data (Can be moved to a service later)
const NEXT_PAYMENT = {
  amount: '$3,500.00',
  daysLeft: 5,
  totalDays: 30,
  label: 'Mantenimiento Enero',
  dueDate: '05 Ene'
};

const TRANSACTIONS = [
  { id: '1', title: 'Starbucks', date: 'Hoy, 9:41 AM', amount: '-$85.00', icon: 'coffee', type: 'expense' },
  { id: '2', title: 'Transferencia Recibida', date: 'Ayer, 4:20 PM', amount: '+$1,200.00', icon: 'arrow-down-left', type: 'income' },
  { id: '3', title: 'Pago Mantenimiento', date: '05 Dic', amount: '-$3,500.00', icon: 'home', type: 'expense' },
  { id: '4', title: 'Uber Trip', date: '02 Dic', amount: '-$145.50', icon: 'map-pin', type: 'expense' },
];

export default function SplitSheetWallet() {
  const router = useRouter();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationsStore((s) => s.fetchUnreadCount);

  useEffect(() => {
    void fetchUnreadCount();
  }, [fetchUnreadCount]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background.base} />

      {/* Top Section (Dark) */}
      <View style={styles.topSection}>
        <SafeAreaView>
          <DashboardHeader
            avatarUrl="https://i.pravatar.cc/150?u=a042581f4e29026024d"
            hasUnread={unreadCount > 0}
            onMenuPress={() => router.push('/notifications' as never)}
          />
          <BalanceSection />
        </SafeAreaView>
      </View>

      {/* Bottom Sheet (Light) */}
      <View style={styles.bottomSheet}>
         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Widget */}
            <View style={styles.widgetWrapper}>
                <PaymentWidget data={NEXT_PAYMENT} />
            </View>

            {/* List */}
            <TransactionList transactions={TRANSACTIONS} />

         </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.base,
  },
  topSection: {
    paddingBottom: 30,
    backgroundColor: COLORS.background.base,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: COLORS.light.backgroundSecondary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    paddingTop: 32,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  widgetWrapper: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
});