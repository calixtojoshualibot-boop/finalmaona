export interface Cap {
  id: string;
  name: string;
  team: string;
  year: number;
  condition: 'deadstock' | 'near-mint' | 'excellent' | 'good' | 'fair' | 'beater';
  price: number;
  description: string;
  image: string;
  featured: boolean;
}

export interface SellerContact {
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  facebook: string;
  instagram: string;
  bio: string;
  messengerUsername: string;
}

export interface UserAccount {
  id: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  name: string;
  phone?: string;
  address?: string;
}

export interface CartItem {
  capId: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: (Cap & { quantity: number })[];
  total: number;
  status: 'pending' | 'repacking' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  paymentMethod: 'gcash' | 'cash';
  deliveryType: 'cod' | 'pickup';
  address: string;
  phone: string;
  notes?: string;
  paymentProof?: string; // For GCash
  date: string;
}
