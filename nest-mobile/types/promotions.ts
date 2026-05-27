import { Feather } from '@expo/vector-icons';

export interface PromoCategory {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

export interface PromoMerchant {
  name: string;
  logo: string;
}

export interface PromoDeal {
  id: string;
  merchant: PromoMerchant;
  image: string;
  title: string;
  discount: string;
  expiry: string;
  category: string;
  distance?: string;
  isExclusive?: boolean;
}