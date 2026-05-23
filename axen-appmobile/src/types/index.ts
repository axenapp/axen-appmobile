export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'partner' | 'admin';
  createdAt: string;
}

export interface Partner {
  id: string;
  userId: string;
  name: string;
  description?: string;
  address?: string;
  lat?: number;
  lng?: number;
  status: 'draft' | 'active' | 'suspended';
  cancelWindowHours: number;
  createdAt: string;
}

export interface Service {
  id: string;
  partnerId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}

export interface Slot {
  id: string;
  serviceId: string;
  partnerId: string;
  datetime: string;
  status: 'free' | 'reserved' | 'blocked';
}

export interface Booking {
  id: string;
  userId: string;
  slotId: string;
  serviceId: string;
  status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | 'failed';
  reminderSent: boolean;
  cancelledAt?: string;
  completedAt?: string;
  createdAt: string;
  slot?: Slot;
  service?: Service & { partner?: Partner };
}

export interface Review {
  id: string;
  bookingId: string;
  userId: string;
  partnerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
