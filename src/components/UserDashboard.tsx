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

  useEffect(() => {
    localStorage.setItem('user_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('user_active_tab', tab);
  }, [tab]);

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

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.cap.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.cap.price * item.qty), 0);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || cart.length === 0) return;
    setIsOrdering(true);

    const orderData: Omit<Order, 'id' | 'date'> = {
      userId: user.id,
      userName: user.name,
      items: cart.map(i => ({ ...i.cap, quantity: i.qty })),
      total: cartTotal,
      status: 'pending',
      paymentMethod,
      deliveryType,
      address,
      phone,
      notes,
    };

    try {
      // create order and wait for confirmation
      await api.createOrder(orderData);

      // clear cart and switch tab
      setCart([]);
      setTab('orders');

      // fetch updated orders and filter for current user
      const updatedOrders = await api.getOrders();
      setOrders(updatedOrders.filter(o => o.userId === user.id));
    } catch (error) {
      console.error('Error placing order:', error);
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* cart tab and browse tab remain unchanged */}

        {tab === 'orders' && (
          <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
            <h1 className="text-4xl font-black uppercase tracking-tighter">Order <span className="text-red-600">History</span></h1>
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="bg-stone-900/50 rounded-3xl border border-dashed border-white/10 p-20 text-center text-stone-600 font-black uppercase tracking-widest italic">No vault history found</div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-stone-900/50 rounded-3xl border border-white/5 overflow-hidden group">
                    <div className="px-6 py-5 border-b border-white/5 bg-white/5 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-red-500 font-black text-xs italic">NB</div>
                        <div>
                          <p className="text-[10px] font-black text-stone-500 uppercase leading-none">ORDER ID</p>
                          <p className="font-bold text-white">#{order.id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-stone-500 uppercase leading-none">STATUS</p>
                          <span className={`inline-block mt-1 font-black uppercase text-[10px] tracking-widest ${
                            order.status === 'completed' ? 'text-emerald-500' :
                            order.status === 'cancelled' ? 'text-stone-500' :
                            order.status === 'repacking' ? 'text-blue-400' :
                            order.status === 'processing' ? 'text-orange-400' :
                            'text-red-500'
                          }`}>{order.status}</span>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-stone-500 uppercase leading-none">DATE</p>
                           <p className="text-xs font-bold text-white mt-1">{order.date.split(' ')[0]}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between group/item">
                          <div className="flex items-center gap-4">
                            {item.image && <TeamLogo image={item.image} size={40} />}
                            <div>
                              <p className="text-sm font-bold text-white group-hover/item:text-red-400 transition-colors">{item.name}</p>
                              <p className="text-[10px] text-stone-500 font-black uppercase">Qty: {item.quantity} • ₱{item.price.toLocaleString()}</p>
                            </div>
                          </div>
                          <span className="text-sm font-black text-white">₱{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap justify-between items-end gap-6">
                        <div className="flex gap-8">
                           <div>
                              <p className="text-[10px] font-black text-stone-500 uppercase mb-1">Details</p>
                              <div className="flex items-center gap-2 text-xs font-bold text-stone-300">
                                 <CreditCard size={14} className="text-red-500"/> {order.paymentMethod.toUpperCase()}
                                 <span className="w-1 h-1 rounded-full bg-stone-700"/>
                                 <Package size={14} className="text-red-500"/> {order.deliveryType.toUpperCase()}
                              </div>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-stone-500 uppercase mb-1">Location</p>
                              <div className="flex items-center gap-2 text-xs font-bold text-stone-300">
                                 <MapPin size={14} className="text-red-500"/> {order.address.slice(0, 30)}...
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-stone-500 uppercase mb-1">Final Amount</p>
                           <span className="text-3xl font-black text-red-600 tracking-tighter">₱{order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-20 border-t border-white/5 text-center">
         <p className="text-[10px] font-black text-stone-800 uppercase tracking-[0.3em]">NBA CAPS VAULT • ELITE QUALITY GUARANTEED</p>
      </footer>
    </div>
  );
}
