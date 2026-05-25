import { Cap, SellerContact, UserAccount, Order } from '../types/Cap';

const AUTH_KEY = 'cap_admin';
// Point to the PHP file
const API_URL = '/api';

export const api = {
  async login(email: string, pw: string): Promise<UserAccount | null> {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pw })
    });
    if (res.ok) {
      const user = await res.json();
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  async register(name: string, email: string, pw: string): Promise<UserAccount | null> {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pw })
    });
    if (res.ok) {
      return res.json();
    }
    return null;
  },

  logout() { localStorage.removeItem(AUTH_KEY); },
  
  getUser(): UserAccount | null { 
    const s = localStorage.getItem(AUTH_KEY);
    return s ? JSON.parse(s) : null;
  },

  isLoggedIn() { return !!localStorage.getItem(AUTH_KEY); },

  isAdmin() {
    const u = this.getUser();
    return u?.role === 'admin';
  },

  async getAll(): Promise<Cap[]> {
    const res = await fetch(`${API_URL}/caps`);
    return res.json();
  },

  async create(data: Omit<Cap,'id'>) {
    const res = await fetch(`${API_URL}/caps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async update(id: string, data: Partial<Cap>) {
    const res = await fetch(`${API_URL}/caps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async remove(id: string) {
    await fetch(`${API_URL}/caps/${id}`, { method: 'DELETE' });
  },

  async getContact(): Promise<SellerContact> {
    const res = await fetch(`${API_URL}/contact`);
    return res.json();
  },

  async saveContact(data: SellerContact) {
    const res = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_URL}/orders`);
    return res.json();
  },

  async createOrder(data: Omit<Order, 'id' | 'date'>) {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateOrderStatus(id: string, status: Order['status']) {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async getUsers(): Promise<UserAccount[]> {
    const res = await fetch(`${API_URL}/users`);
    return res.json();
  },
};
