import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

interface Transaction {
  id: string;
  title: string;
  date: string;
  amount: string;
  icon: any;
  type: string;
}

export const TransactionList = ({ transactions }: { transactions: Transaction[] }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Actividad Reciente</Text>
      {transactions.map((t) => (
        <View key={t.id} style={styles.row}>
          <View style={[
            styles.iconBox,
            { backgroundColor: t.type === 'income' ? COLORS.status.success : COLORS.light.backgroundSecondary }
          ]}>
            <Feather
              name={t.icon}
              size={18}
              color={t.type === 'income' ? COLORS.brand.emerald : COLORS.text.label}
            />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.date}>{t.date}</Text>
          </View>
          <Text style={[
            styles.amount,
            t.type === 'income' && { color: COLORS.brand.emerald }
          ]}>
            {t.amount}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  date: {
    fontSize: 13,
    color: COLORS.text.label,
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
});