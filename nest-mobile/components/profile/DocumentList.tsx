import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { ResidentDocument } from '@/types/user';
import SectionHeader from '../ui/FormHeader';

interface DocumentsListProps {
  documents: ResidentDocument[];
}

export default function DocumentsList({ documents }: DocumentsListProps) {
  
  // Helper simple para elegir el icono según el tipo de documento
  const getDocIcon = (type: ResidentDocument['type']) => {
    switch (type) {
      case 'LEASE': return 'file-text';
      case 'ID': return 'credit-card';
      default: return 'file';
    }
  };

  return (
    <View style={styles.card}>
      <SectionHeader title="Documentos" icon="folder" />
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}
      >
        {documents.map((doc) => (
          <TouchableOpacity key={doc.id} style={styles.docCard}>
            <View style={styles.docIcon}>
              <Feather 
                name={getDocIcon(doc.type)} 
                size={24} 
                color={COLORS.brand.teal} 
              />
            </View>
            <View>
              <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
              <Text style={styles.docSize}>{doc.size}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.light.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    // Shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  scrollContainer: {
    marginHorizontal: -20, // Para que el scroll llegue al borde de la tarjeta visualmente
  },
  scrollContent: {
    paddingHorizontal: 20, // Padding interno para el primer/último item
  },
  docCard: {
    width: 140,
    padding: 12,
    backgroundColor: COLORS.light.backgroundSecondary,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  docIcon: {
    marginBottom: 12,
  },
  docName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  docSize: {
    fontSize: 11,
    color: COLORS.text.label,
  },
});