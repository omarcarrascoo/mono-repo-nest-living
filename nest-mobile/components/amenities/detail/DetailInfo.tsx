import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { AmenityDetail } from '@/types/amenity';

interface DetailInfoProps {
  data: AmenityDetail;
}

export const DetailInfo = ({ data }: DetailInfoProps) => {
  return (
    <View style={styles.container}>
      
      {/* --- HEADER SECTION --- */}
      <View style={styles.section}>
        <Text style={styles.title}>{data.title}</Text>
        
        <View style={styles.subHeader}>
             <Feather name="star" size={14} color={COLORS.text.primary} />
             <Text style={styles.rating}>{data.rating} ({data.reviews} reseñas)</Text>
             <Text style={styles.dot}>•</Text>
             <Text style={styles.location}>{data.location}</Text>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, data.status === 'available' ? styles.statusAvail : styles.statusBusy]}>
            <View style={[styles.statusDot, { backgroundColor: data.status === 'available' ? COLORS.brand.emerald : '#f59e0b' }]} />
            <Text style={styles.statusText}>
                {data.status === 'available' ? 'Disponible ahora' : `Ocupado hasta ${data.nextSlot}`}
            </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* --- FEATURES GRID --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lo que ofrece este espacio</Text>
        <View style={styles.featuresGrid}>
            {data.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                    <Feather name={feature.icon as any} size={20} color={COLORS.text.secondary} />
                    <Text style={styles.featureText}>{feature.label}</Text>
                </View>
            ))}
        </View>
      </View>

      <View style={styles.divider} />

      {/* --- DESCRIPTION --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acerca del espacio</Text>
        <Text style={styles.description}>{data.description}</Text>
      </View>

      <View style={styles.divider} />

      {/* --- RULES --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reglas de uso</Text>
        {data.rules.map((rule, idx) => (
            <View key={idx} style={styles.ruleRow}>
                <Feather name="check-circle" size={16} color={COLORS.brand.tealDark} />
                <Text style={styles.ruleText}>{rule}</Text>
            </View>
        ))}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100, // Space for sticky footer
    backgroundColor: COLORS.ui.white,
    borderTopLeftRadius: 32, // Integrating the "Sheet" look
    borderTopRightRadius: 32,
    marginTop: -24, // Pull up over the image slightly
  },
  section: {
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 24,
  },
  // Header Styles
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 4,
  },
  dot: {
    marginHorizontal: 6,
    color: COLORS.text.secondary,
  },
  location: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textDecorationLine: 'underline',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  statusAvail: { backgroundColor: '#ecfdf5' },
  statusBusy: { backgroundColor: '#fffbeb' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600', color: COLORS.text.primary },

  // Features
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureItem: {
    width: '47%', // 2 columns
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  // Description
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.text.secondary,
  },

  // Rules
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ruleText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
});