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
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
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
      items: cart.map(i => ({
        ...i.cap,
        quantity: i.qty,
        image: i.cap.image || ''
      })),
      total: cartTotal,
      status: 'pending',
      paymentMethod,
      deliveryType,
      address,
      phone,
      notes,
    };

    // Upload receipt if GCash
    if (paymentMethod === 'gcash' && receiptFile) {
      const formData = new FormData();
      formData.append('file', receiptFile);
      const uploaded = await api.uploadReceipt(formData); // adjust API call
      orderData.notes += ` | Receipt: ${uploaded.url}`;
    }

    await api.createOrder(orderData);
    setCart([]);
    setTab('orders');
    
    // Refresh order history for user immediately
    const updatedOrders = await api.getOrders();
    setOrders(updatedOrders.filter(o => o.userId === user.id));

    setIsOrdering(false);
    setReceiptFile(null);
    setReceiptPreview('');
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setReceiptFile(e.target.files[0]);
      setReceiptPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'cart' && (
          <div className="max-w-5xl mx-auto animate-fade-in space-y-8">
            <h1 className="text-4xl font-black uppercase tracking-tighter">Shopping <span className="text-red-600">Cart</span></h1>

            {/* Cart items */}
            {cart.map(item => (
              <div key={item.cap.id} className="bg-stone-900/50 rounded-2xl border border-white/5 p-4 flex items-center gap-6">
                <div className="w-20 h-20 rounded-xl bg-stone-900 flex items-center justify-center p-2">
                  <TeamLogo image={item.cap.image} size={64} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white">{item.cap.name}</h4>
                  <p className="text-sm text-red-500 font-black mt-1">₱{item.cap.price.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-400">Qty: {item.qty}</p>
                </div>
                <button onClick={() => removeFromCart(item.cap.id)} className="p-3 bg-white/5 rounded-xl text-stone-500 hover:text-red-500 hover:bg-red-500/10 transition-all"><Trash2 size={20}/></button>
              </div>
            ))}

            {/* Checkout Form */}
            <form onSubmit={placeOrder} className="bg-stone-900 rounded-3xl border border-white/10 p-6 space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tight text-white border-b border-white/5 pb-4">Checkout</h3>

              <div>
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-2 tracking-widest">Phone</label>
                <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-2 tracking-widest">Address</label>
                <textarea required value={address} onChange={e => setAddress(e.target.value)} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-2 tracking-widest">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['cash', 'gcash'].map(m => (
                    <button key={m} type="button" onClick={() => setPaymentMethod(m as any)} className={`py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl border-2 transition-all ${paymentMethod === m ? 'border-red-600 bg-red-600 text-white' : 'border-white/5 bg-white/5 text-stone-500 hover:border-white/10'}`}>{m}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-stone-500 mb-2 tracking-widest">Upload Receipt</label>
                <input type="file" accept="image/*" onChange={handleReceiptChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                {receiptPreview && <img src={receiptPreview} alt="receipt" className="mt-2 w-40 h-40 object-cover rounded-xl" />}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <span className="text-xs font-black text-stone-500 uppercase">Total amount</span>
                <span className="text-2xl font-black text-red-600 tracking-tighter">₱{cartTotal.toLocaleString()}</span>
              </div>

              <button type="submit" disabled={isOrdering} className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-900/40 disabled:opacity-50 active:scale-95">
                {isOrdering ? 'Securing Order...' : 'Place Vault Order'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
