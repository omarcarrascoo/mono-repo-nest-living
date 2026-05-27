// src/types/user.ts

// Tipos para las relaciones anidadas
export interface ResidentStats {
  balanceOwed: number;
  delinquencyRate: number;
  lastPaymentDate: string;
}

export interface ResidentLease {
  startDate: string;
  endDate: string;
  rentAmount: string;
  securityDeposit: string;
  daysLeft: number;
}

export interface ResidentContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface ResidentDocument {
  id: string;
  type: 'LEASE' | 'ID' | 'OTHER'; // Union type para seguridad
  name: string;
  size: string;
}

// Entidad Principal
export interface UserProfile {
  id: string;
  fullName: string;
  unitNumber: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatar: string;
  stats: ResidentStats;
  lease: ResidentLease;
  contacts: ResidentContact[];
  documents: ResidentDocument[];
}