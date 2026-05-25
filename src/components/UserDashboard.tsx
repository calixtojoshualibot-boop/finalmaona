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

  // Checkout form state
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'cash'>('cash');
  const [deliveryType, setDeliveryType] = useState<'cod' | 'pickup'>('pickup');
  const [isOrdering, setIsOrdering] = useState(false);

  // Load caps and orders
  const loadOrders = async () => {
    try {
      const list = await api.getOrders();
      if (Array.isArray(list)) {
        const myOrders = list.filter(o => String(o.userId) === String(user?.id) || String(o.userName).toLowerCase() === String(user?.name).toLowerCase());
        setOrders(myOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
      setOrders([]);
    }
  };

  useEffect(() => {
    api.getAll().then(setCaps);
    loadOrders();
  }, [user?.id, user?.name]);

  useEffect(() => {
    if (tab === 'orders') loadOrders();
  }, [tab]);

  const addToCart = (cap: Cap) => {
    setCart(prev => {
      const existing = prev.find(item => item.cap.id === cap.id);
      if (existing) return prev.map(item => item.cap.id === cap.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { cap: { ...cap, image: cap.image || '/caps/default.png' }, qty: 1 }];
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
      items: cart.map(i => ({ ...i.cap, quantity: i.qty, image: i.cap.image })),
      total: cartTotal,
      status: 'pending',
      paymentMethod,
      deliveryType,
      address,
      phone,
      notes,
    };

    try {
      await api.createOrder(orderData);
      setCart([]);
      localStorage.removeItem('user_cart');
      await loadOrders();
      setTab('orders');
    } catch (err) {
      console.error('Failed to place order', err);
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
              {['browse', 'orders'].map(t => (
                <button key={t} onClick={() => setTab(t as any)} className={`text-xs font-black uppercase tracking-widest transition-colors ${tab === t ? 'text-red-500' : 'text-stone-500 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setTab('cart')} className="relative p-2 text-stone-400 hover:text-red-500 transition-colors">
              <ShoppingCart size={22}/>
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'browse' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {caps.map(cap => (
                <div key={cap.id} className="bg-stone-900/50 rounded-3xl border border-white/5 overflow-hidden flex flex-col">
                  <div className="aspect-square bg-stone-900 flex items-center justify-center overflow-hidden p-6">
                    <TeamLogo image={cap.image} size={220} />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <h3 className="font-bold text-white">{cap.name}</h3>
                    <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest mt-1">{cap.team} • {cap.year}</p>
                    <span className="font-black text-lg text-white mt-2">₱{cap.price.toLocaleString()}</span>
                    <button onClick={() => addToCart(cap)} className="mt-4 w-full bg-red-600 text-white py-2.5 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 transition-all">Add to Cart</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'cart' && (
          <div className="max-w-5xl mx-auto animate-fade-in space-y-8">
            {cart.length === 0 ? (
              <div className="p-20 text-center text-stone-500 font-black uppercase tracking-widest border border-white/10 rounded-xl bg-stone-900/50">Your cart is empty</div>
            ) : (
              <form onSubmit={placeOrder} className="space-y-6">
                {cart.map(item => (
                  <div key={item.cap.id} className="flex items-center gap-4 bg-stone-900/50 p-4 rounded-xl">
                    <TeamLogo image={item.cap.image} size={64} />
                    <div className="flex-1">
                      <p className="font-bold text-white">{item.cap.name}</p>
                      <p className="text-sm text-red-500 font-black">₱{(item.cap.price*item.qty).toLocaleString()}</p>
                      <p className="text-sm text-stone-400">Qty: {item.qty}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.cap.id)} type="button" className="p-2 text-stone-400 hover:text-red-500"><Trash2 size={20}/></button>
                  </div>
                ))}
                <div className="text-right font-black text-red-600 text-xl">Total: ₱{cartTotal.toLocaleString()}</div>
                <button type="submit" className="w-full py-3 bg-red-600 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 transition-all">{isOrdering ? 'Processing...' : 'Place Order'}</button>
              </form>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {orders.length === 0 ? (
              <div className="p-20 text-center text-stone-500 font-black uppercase tracking-widest italic">No orders found</div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-stone-900/50 rounded-3xl border border-white/5 p-6 space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <TeamLogo image={item.image} size={40} />
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-[10px] text-stone-400">Qty: {item.quantity} • ₱{item.price.toLocaleString()}</p>
                      </div>
                      <span className="text-sm font-black text-white">₱{(item.price*item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-black text-stone-500">
                    <span>{order.paymentMethod.toUpperCase()} • {order.deliveryType.toUpperCase()}</span>
                    <span>{new Date(order.date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right font-black text-red-600 text-lg">Total: ₱{order.total.toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
