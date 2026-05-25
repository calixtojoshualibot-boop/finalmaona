import { useState, useEffect } from 'react';
import { Cap, Order } from '../types/Cap';
import { api } from '../services/api';
import TeamLogo from './TeamLogos';
import { ShoppingCart, Trash2, Package, CreditCard, MapPin } from 'lucide-react';

interface Props {
  onLogout: () => void;
  onBackToShowcase: () => void;
}

export default function UserDashboard({ onLogout, onBackToShowcase }: Props) {
  const user = api.getUser();
  const [caps, setCaps] = useState<Cap[]>([]);
  const [cart, setCart] = useState<{cap: Cap, qty: number}[]>(() => {
    const saved = localStorage.getItem('user_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'browse' | 'cart' | 'orders'>(() => {
    return (localStorage.getItem('user_active_tab') as any) || 'browse';
  });

  // Checkout Form State
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'cash'>('cash');
  const [deliveryType, setDeliveryType] = useState<'cod' | 'pickup'>('pickup');
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => { localStorage.setItem('user_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('user_active_tab', tab); }, [tab]);

  useEffect(() => {
    api.getAll().then(setCaps);
    api.getOrders().then(list => {
      setOrders(list.filter(o => o.userId === user?.id));
    });
  }, [user?.id]);

  const addToCart = (cap: Cap) => {
    setCart(prev => {
      const existing = prev.find(item => item.cap.id === cap.id);
      if (existing) {
        return prev.map(item => item.cap.id === cap.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { cap, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.cap.id !== id));
  const cartTotal = cart.reduce((acc, item) => acc + (item.cap.price * item.qty), 0);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || cart.length === 0) return;
    setIsOrdering(true);

    const orderData: Omit<Order, 'id' | 'date'> = {
      userId: user.id,
      userName: user.name,
      items: cart.map(i => ({
        id: i.cap.id,
        name: i.cap.name,
        team: i.cap.team,
        year: i.cap.year,
        condition: i.cap.condition,
        price: i.cap.price,
        description: i.cap.description,
        image: i.cap.image,
        featured: i.cap.featured,
        quantity: i.qty,
      })),
      total: cartTotal,
      status: 'pending',
      paymentMethod,
      deliveryType,
      address,
      phone,
      notes,
    };

    try {
      const response = await api.createOrder(orderData);
      console.log('Order response:', response);

      // reset cart and reload orders
      setCart([]);
      setTab('orders');
      const updatedOrders = await api.getOrders();
      setOrders(updatedOrders.filter(o => o.userId === user.id));
    } catch (err) {
      console.error('Failed to place order:', err);
      alert('Error placing order, check console.');
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="bg-stone-900 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={onBackToShowcase} className="font-black text-red-600 uppercase tracking-tighter italic text-xl">NBA Vault</button>
            <div className="hidden sm:flex gap-6">
              {['browse', 'orders'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setTab(t as any)} 
                  className={`text-xs font-black uppercase tracking-widest transition-colors ${tab === t ? 'text-red-500' : 'text-stone-500 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setTab('cart')} className="relative p-2 text-stone-400 hover:text-red-500 transition-colors">
              <ShoppingCart size={22} />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-stone-900">{cart.length}</span>}
            </button>
            <div className="h-6 w-px bg-white/10 mx-2" />
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-stone-500 uppercase leading-none">{user?.role}</p>
              <p className="text-sm font-bold text-white">{user?.name}</p>
            </div>
            <button onClick={onLogout} className="text-[10px] font-black text-red-500 uppercase border border-red-500/20 px-3 py-2 rounded-xl hover:bg-red-500/10 transition-colors">Logout</button>
          </div>
        </div>
      </nav>

      {/* ... rest of your UI remains unchanged ... */}

    </div>
  );
}
