export type AmenityStatus = 'available' | 'busy' | 'maintenance';

export interface AmenityFeature {
  icon: string; 
  label: string;
}

export interface AmenityDetail {
  id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  status: AmenityStatus;
  nextSlot: string; // El próximo inmediato (informativo)
  availableSlots: string[]; // <--- NUEVO: Lista para elegir
  capacity: number;
  features: AmenityFeature[];
  rules: string[];
}