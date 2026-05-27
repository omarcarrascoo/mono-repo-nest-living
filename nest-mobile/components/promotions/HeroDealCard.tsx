import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, THEME } from '@/constants/theme';

export const HeroDealCard = () => (
  <TouchableOpacity activeOpacity={0.9} style={styles.card}>
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop' }}
      style={styles.image}
      imageStyle={{ borderRadius: 24 }}
    >
      <LinearGradient
        // Conversión manual para satisfacer el tipo readonly de LinearGradient si TS se queja
        colors={[...GRADIENTS.bottomFade]} 
        style={styles.gradient}
      >
        <View style={styles.exclusiveTag}>
          <Feather name="star" size={12} color={COLORS.text.inverse} />
          <Text style={styles.exclusiveText}>Exclusivo Residentes</Text>
        </View>
        
        <View>
          <Text style={styles.merchant}>Bistro 88</Text>
          <Text style={styles.title}>Cena para dos con 30% de descuento</Text>
          <View style={styles.footer}>
            <View style={styles.timeBadge}>
              <Feather name="clock" size={14} color={COLORS.text.light} />
              <Text style={styles.timeText}>Termina hoy</Text>
            </View>
            <View style={styles.btn}>
              <Text style={styles.btnText}>Ver Cupón</Text>
              <Feather name="arrow-right" size={16} color={COLORS.brand.tealDark} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    height: 220,
    width: '100%',
    borderRadius: 24,
    backgroundColor: COLORS.ui.white,
    shadowColor: THEME.shadows.card.shadowColor,
    shadowOffset: THEME.shadows.card.shadowOffset,
    shadowOpacity: THEME.shadows.card.shadowOpacity,
    shadowRadius: THEME.shadows.card.shadowRadius,
    elevation: THEME.shadows.card.elevation,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  gradient: {
    padding: 20,
    borderRadius: 24,
    height: '100%',
    justifyContent: 'flex-end',
  },
  exclusiveTag: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.promotions.overlayGlass,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.promotions.overlayBorder,
  },
  exclusiveText: {
    color: COLORS.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  merchant: {
    color: COLORS.text.light,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: COLORS.text.inverse,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    lineHeight: 28,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: COLORS.text.light,
    fontSize: 13,
    fontWeight: '500',
  },
  btn: {
    backgroundColor: COLORS.ui.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    color: COLORS.brand.tealDark,
    fontSize: 13,
    fontWeight: '700',
  },
});