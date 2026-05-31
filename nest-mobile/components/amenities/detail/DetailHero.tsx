import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Amenity } from '@/types/api';
import { FavoriteButton } from '@/components/amenities/FavoriteButton';
import { ShareButton } from '@/components/amenities/ShareButton';

interface DetailHeroProps {
  amenity: Amenity;
  onBack: () => void;
}

const { height } = Dimensions.get('window');

export const DetailHero = ({ amenity, onBack }: DetailHeroProps) => {
  return (
    <View style={styles.container}>
      <Image
        source={amenity.image ? { uri: amenity.image } : undefined}
        style={styles.image}
        contentFit="cover"
        transition={300}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Feather name="arrow-left" size={20} color="#000" />
          </TouchableOpacity>

          <View style={styles.rightBtns}>
            <ShareButton amenity={amenity} variant="overlay" />
            <FavoriteButton amenityId={amenity.id} variant="overlay" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: height * 0.35,
    width: '100%',
    position: 'relative',
    backgroundColor: COLORS.background.dark,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  rightBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
