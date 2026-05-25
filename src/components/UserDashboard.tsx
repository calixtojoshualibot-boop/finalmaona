// Path: src/components/UserDashboard.tsx

import { useState, useEffect } from 'react';
import { Cap, Order, SellerContact } from '../types/Cap';
import { api } from '../services/api';
import TeamLogo from './TeamLogos';
import { ShoppingCart, Trash2, Upload, Camera } from 'lucide-react';

interface Props {
  onLogout: () => void;
  onBackToShowcase: () => void;
}

export default function UserDashboard({ onLogout, onBackToShowcase }: Props) {
  const user = api.getUser();

  const [caps, setCaps] = useState<Cap[]>([]);
  const [sellerContact, setSellerContact] = useState<SellerContact | null>(null);
  const [cart, setCart] = useState<{ cap: Cap; qty: number }[]>(() => {
    const saved = localStorage.getItem('user_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'browse' | 'cart' | 'orders'>('browse');

  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'cash'>('cash');
  const [deliveryType, setDeliveryType] = useState<'cod' | 'pickup'>('pickup');
  const [gcashReference, setGcashReference] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    localStorage.setItem('user_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    api.getAll().then(setCaps);
    api.getContact().then(setSellerContact).catch(() => setSellerContact(null));
    api.getOrders().then(list => {
      const filtered = list.filter(o => o.userId === user?.id);
      setOrders(filtered);
    });
  }, [user?.id]);

  const addToCart = (cap: Cap) => {
    setCart(prev => {
      const existing = prev.find(item => item.cap.id === cap.id);
      if (existing) return prev.map(item => item.cap.id === cap.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { cap, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.cap.id !== id));

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.cap.price * item.qty, 0);
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

  const gcashNumber = sellerContact?.phone || '09123456789';
  const sellerName = sellerContact?.shopName || 'NBA Vault';
  const sellerAddress = sellerContact?.address || 'No seller address set';

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || cart.length === 0) return;

    if (paymentMethod === 'gcash' && (!gcashReference.trim() || !receiptImage)) {
      alert('Please provide GCash reference and upload receipt.');
      return;
    }

    setIsOrdering(true);

    const orderData: Omit<Order, 'id'> & {
      gcashReference?: string;
      receiptImage?: string;
      sellerGcashNumber?: string;
      sellerShopName?: string;
    } = {
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
      gcashReference: paymentMethod === 'gcash' ? gcashReference : undefined,
      receiptImage: paymentMethod === 'gcash' ? receiptImage : undefined,
      sellerGcashNumber: paymentMethod === 'gcash' ? gcashNumber : undefined,
      sellerShopName: sellerName,
      date: new Date().toISOString(),
    };

    await api.createOrder(orderData);

    setCart([]);
    setNotes('');
    setGcashReference('');
    setReceiptImage('');
    setTab('orders');
    setIsOrdering(false);

    api.getOrders().then(list => setOrders(list.filter(o => o.userId === user.id)));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="bg-stone-900 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={onBackToShowcase} className="font-black text-red-600 uppercase tracking-tighter italic text-xl">NBA Vault</button>
            <div className="hidden sm:flex gap-6">
              {['browse','orders'].map(t=>(
                <button key={t} onClick={()=>setTab(t as any)} className={`text-xs font-black uppercase tracking-widest transition-colors ${tab===t?'text-red-500':'text-stone-500 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setTab('cart')} className="relative p-2 text-stone-400 hover:text-red-500 transition-colors">
              <ShoppingCart size={22}/>
              {cart.length>0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-stone-900">{totalQty}</span>}
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
        {tab==='cart' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-black uppercase">Shopping Cart</h1>
            {cart.length===0 ? <p className="text-stone-500">Cart is empty</p> : (
              <>
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.cap.id} className="bg-stone-900 p-4 rounded-2xl flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                          <TeamLogo image={item.cap.image} size={80}/>
                        </div>
                        <div>
                          <h3 className="font-bold">{item.cap.name}</h3>
                          <p className="text-sm text-stone-400">Qty: {item.qty}</p>
                          <p className="text-red-500 font-black">₱{(item.cap.price*item.qty).toLocaleString()}</p>
                        </div>
                      </div>
                      <button onClick={()=>removeFromCart(item.cap.id)} className="text-white hover:text-red-500 transition-colors"><Trash2/></button>
                    </div>
                  ))}
                </div>

                <form onSubmit={placeOrder} className="bg-stone-900 p-6 rounded-3xl space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      <input type="text" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full p-4 rounded-xl bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500"/>
                      <textarea placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)} rows={3} className="w-full p-4 rounded-xl bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500"/>
                      <textarea placeholder="Order notes optional" value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className="w-full p-4 rounded-xl bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500"/>
                      
                      {/* Payment Method & GCash Receipt */}
                      <div className="space-y-3">
                        <p className="text-white font-bold">Payment Method</p>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2"><input type="radio" name="payment" value="cash" checked={paymentMethod==='cash'} onChange={()=>setPaymentMethod('cash')}/>Cash</label>
                          <label className="flex items-center gap-2"><input type="radio" name="payment" value="gcash" checked={paymentMethod==='gcash'} onChange={()=>setPaymentMethod('gcash')}/>GCash</label>
                        </div>

                        {paymentMethod==='gcash' && (
                          <div className="mt-2 p-4 bg-gray-800 rounded-xl border border-red-500 space-y-2">
                            <p className="text-gray-300">Send payment to <span className="text-red-500 font-bold">{gcashNumber}</span></p>
                            <input type="text" placeholder="GCash Reference #" value={gcashReference} onChange={e=>setGcashReference(e.target.value)} className="w-full p-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"/>
                            <label className="block cursor-pointer text-white">Upload Receipt
                              <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload}/>
                            </label>
                            {receiptImage && <img src={receiptImage} alt="GCash Receipt Preview" className="mt-2 w-48 h-48 object-contain border rounded-xl"/>}
                          </div>
                        )}
                      </div>

                      {/* Delivery Type */}
                      <div className="space-y-3">
                        <p className="text-white font-bold">Delivery Type</p>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2"><input type="radio" name="delivery" value="pickup" checked={deliveryType==='pickup'} onChange={()=>setDeliveryType('pickup')}/>Pickup</label>
                          <label className="flex items-center gap-2"><input type="radio" name="delivery" value="cod" checked={deliveryType==='cod'} onChange={()=>setDeliveryType('cod')}/>Cash on Delivery</label>
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-black rounded-3xl p-5 border border-white/10 h-fit space-y-5">
                      <div>
                        <p className="text-xs font-black uppercase text-stone-500">Order Summary</p>
                        <h2 className="text-3xl font-black text-red-600">₱{cartTotal.toLocaleString()}</h2>
                        <p className="text-sm text-stone-400">{totalQty} item(s)</p>
                      </div>

                      <button type="submit" disabled={isOrdering} className="w-full bg-red-600 py-4 rounded-2xl font-black uppercase hover:bg-red-500 transition-colors disabled:opacity-60">{isOrdering?'Processing...':'Place Order'}</button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
