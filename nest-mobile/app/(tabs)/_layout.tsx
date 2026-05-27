import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';
import { COLORS } from '@/constants/theme';

export default function TabLayout() {
  const activeColor = COLORS.brand.tealDark; 
  const inactiveColor = '#94a3b8'; 

  // Calculate margins based on OS to achieve the capsule look
  // iOS: 90% width = 5% margin on each side
  // Android: 95% width = 2.5% margin on each side

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarShowLabel: false,
        
        tabBarStyle: {
          position: 'absolute',
          bottom: 30,
          marginHorizontal: 30,
          
          elevation: 10,
          backgroundColor: '#ffffff',
          borderRadius: 35,
          height: 64,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarHideOnKeyboard: true,
      }}>

      {/* TAB 1: Inicio */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Feather name="search" size={24} color={color} style={{ opacity: focused ? 1 : 0.8 }} />
              {focused && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
            </View>
          ),
        }}
      />

      {/* TAB 2: Explorar */}
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Feather name="message-square" size={24} color={color} style={{ opacity: focused ? 1 : 0.8 }} />
              {focused && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
            </View>
          ),
        }}
      />
      
       {/* TAB 3: Pagos */}
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Pagos',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Feather name="credit-card" size={24} color={color} style={{ opacity: focused ? 1 : 0.8 }} />
              {focused && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
            </View>
          ),
        }}
      />
      
       {/* TAB 4: Reservas */}
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Feather name="calendar" size={24} color={color} style={{ opacity: focused ? 1 : 0.8 }} />
              {focused && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
            </View>
          ),
        }}
      />

       {/* TAB 5: Promociones */}
      <Tabs.Screen
        name="promotions"
        options={{
          title: 'Promociones',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Feather name="gift" size={24} color={color} style={{ opacity: focused ? 1 : 0.8 }} />
              {focused && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: Platform.OS === 'ios' ? 12 : 0, 
    height: '100%',
    width: '100%',
  },
  activeDot: {
    position: 'absolute',
    bottom: -8, 
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});