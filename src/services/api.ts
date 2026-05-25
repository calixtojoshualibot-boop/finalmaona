import { Cap, SellerContact, UserAccount, Order } from '../types/Cap';

const AUTH_KEY = 'cap_admin';
const API_URL = '/api';

export const api = {
  async login(email: string, pw: string): Promise<UserAccount | null> {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw })
      });
      if (!res.ok) return null;
      const user = await res.json();
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return user;
    } catch (err) {
      console.error('Login error', err);
      return null;
    }
  },

  async register(name: string, email: string, pw: string): Promise<UserAccount | null> {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pw })
      });
      if (!res.ok) return null;
      return res.json();
    } catch (err) {
      console.error('Register error', err);
      return null;
    }
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
  },

  getUser(): UserAccount | null {
    const s = localStorage.getItem(AUTH_KEY);
    return s ? JSON.parse(s) : null;
  },

  isLoggedIn(): boolean {
    return !!this.getUser();
  },

  isAdmin(): boolean {
    return this.getUser()?.role === 'admin';
  },

  async getAll(): Promise<Cap[]> {
    try {
      const res = await fetch(`${API_URL}/caps`);
      if (!res.ok) return [];
      return res.json();
    } catch (err) {
      console.error('Get all caps error', err);
      return [];
    }
  },

  async create(data: Omit<Cap, 'id'>): Promise<Cap | null> {
    try {
      const res = await fetch(`${API_URL}/caps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) return null;
      return res.json();
    } catch (err) {
      console.error('Create cap error', err);
      return null;
    }
  },

  async update(id: string, data: Partial<Cap>): Promise<Cap | null> {
    try {
      const res = await fetch(`${API_URL}/caps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) return null;
      return res.json();
    } catch (err) {
      console.error('Update cap error', err);
      return null;
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await fetch(`${API_URL}/caps/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Delete cap error', err);
    }
  },

  async getContact(): Promise<SellerContact> {
    try {
      const res = await fetch(`${API_URL}/contact`);
      if (!res.ok) return { shopName: '', ownerName: '', phone: '', email: '', address: '', facebook: '', instagram: '', messengerUsername: '', bio: '' };
      return res.json();
    } catch (err) {
      console.error('Get contact error', err);
      return { shopName: '', ownerName: '', phone: '', email: '', address: '', facebook: '', instagram: '', messengerUsername: '', bio: '' };
    }
  },

  async saveContact(data: SellerContact): Promise<SellerContact | null> {
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) return null;
      return res.json();
    } catch (err) {
      console.error('Save contact error', err);
      return null;
    }
  },

  async getOrders(): Promise<Order[]> {
    try {
      const res = await fetch(`${API_URL}/orders`);
      if (!res.ok) return [];
      return res.json();
    } catch (err) {
      console.error('Get orders error', err);
      return [];
    }
  },

  async createOrder(data: Omit<Order, 'id' | 'date'>): Promise<Order | null> {
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) return null;
      return res.json();
    } catch (err) {
      console.error('Create order error', err);
      return null;
    }
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) return null;
      return res.json();
    } catch (err) {
      console.error('Update order status error', err);
      return null;
    }
  },

  async getUsers(): Promise<UserAccount[]> {
    try {
      const res = await fetch(`${API_URL}/users`);
      if (!res.ok) return [];
      return res.json();
    } catch (err) {
      console.error('Get users error', err);
      return [];
    }
  },
};
