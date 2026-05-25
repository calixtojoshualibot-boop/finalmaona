// Path: src/components/UserDashboard.tsx

import { useState, useEffect } from 'react';
import { Cap, Order } from '../types/Cap';
import { api } from '../services/api';
import TeamLogo from './TeamLogos';
import { ShoppingCart, Trash2 } from 'lucide-react';

interface Props {
  onLogout: () => void;
  onBackToShowcase: () => void;
}

export default function UserDashboard({ onLogout, onBackToShowcase }: Props) {
  const user = api.getUser();

  const [caps, setCaps] = useState<Cap[]>([]);
  const [cart, setCart] = useState<{ cap: Cap; qty: number }[]>(() => {
    const saved = localStorage.getItem('user_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'browse' | 'cart' | 'orders'>(() => {
    return (localStorage.getItem('user_active_tab') as any) || 'browse';
  });

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
      const filtered = list.filter(o => o.userId === user?.id);
      setOrders(filtered);
    });
  }, [user?.id]);

  const addToCart = (cap: Cap) => {
    setCart(prev => {
      const existing = prev.find(item => item.cap.id === cap.id);
      if (existing) {
        return prev.map(item =>
          item.cap.id === cap.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { cap, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.cap.id !== id));
  };

  const cartTotal = cart.reduce(
    (acc, item) => acc + item.cap.price * item.qty,
    0
  );

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || cart.length === 0) return;

    setIsOrdering(true);

    const orderData: Omit<Order, 'id'> = {
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
      date: new Date().toLocaleString(),
    };

    await api.createOrder(orderData);

    setCart([]);
    setTab('orders');
    setIsOrdering(false);

    api.getOrders().then(list => {
      setOrders(list.filter(o => o.userId === user.id));
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="bg-stone-900 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={onBackToShowcase}
              className="font-black text-red-600 uppercase tracking-tighter italic text-xl"
            >
              NBA Vault
            </button>
            <div className="hidden sm:flex gap-6">
              {['browse', 'orders'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t as any)}
                  className={`text-xs font-black uppercase tracking-widest transition-colors ${
                    tab === t ? 'text-red-500' : 'text-stone-500 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setTab('cart')}
              className="relative p-2 text-stone-400 hover:text-red-500 transition-colors"
            >
              <ShoppingCart size={22} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-stone-900">
                  {cart.reduce((acc, item) => acc + item.qty, 0)}
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-white/10 mx-2" />

            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-stone-500 uppercase leading-none">
                {user?.role}
              </p>
              <p className="text-sm font-bold text-white">{user?.name}</p>
            </div>

            <button
              onClick={onLogout}
              className="text-[10px] font-black text-red-500 uppercase border border-red-500/20 px-3 py-2 rounded-xl hover:bg-red-500/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'browse' && (
          <div>
            <h1 className="text-4xl font-black uppercase mb-8">Vault Collection</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {caps.map(cap => (
                <div key={cap.id} className="bg-stone-900 rounded-3xl p-4">
                  <TeamLogo image={cap.image} size={180} />
                  <h3 className="font-bold mt-4">{cap.name}</h3>
                  <p className="text-red-500 font-black">₱{cap.price.toLocaleString()}</p>
                  <button
                    onClick={() => addToCart(cap)}
                    className="w-full mt-4 bg-red-600 py-3 rounded-xl font-black uppercase"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'cart' && (
          <div className="space-y-6">
            <h1 className="text-4xl font-black uppercase">Shopping Cart</h1>
            {cart.length === 0 ? (
              <p className="text-stone-500">Cart is empty</p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.cap.id} className="bg-stone-900 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <h3 className="font-bold">{item.cap.name}</h3>
                      <p>Qty: {item.qty}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.cap.id)}>
                      <Trash2 />
                    </button>
                  </div>
                ))}

                <form onSubmit={placeOrder} className="bg-stone-900 p-6 rounded-3xl space-y-4">
                  <input
                    type="text"
                    placeholder="Phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black"
                    required
                  />
                  <textarea
                    placeholder="Address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black"
                    required
                  />

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <p className="font-bold text-sm">Payment Method</p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={paymentMethod === 'cash'}
                          onChange={() => setPaymentMethod('cash')}
                        />
                        Cash
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="gcash"
                          checked={paymentMethod === 'gcash'}
                          onChange={() => setPaymentMethod('gcash')}
                        />
                        GCash
                      </label>
                    </div>
                    {paymentMethod === 'gcash' && (
                      <p className="text-xs text-stone-400">
                        Please send payment to <span className="font-bold">GCash #: 09123456789</span>
                      </p>
                    )}
                  </div>

                  {/* Delivery Type */}
                  <div className="space-y-2">
                    <p className="font-bold text-sm">Delivery Type</p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="deliveryType"
                          value="pickup"
                          checked={deliveryType === 'pickup'}
                          onChange={() => setDeliveryType('pickup')}
                        />
                        Pickup
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="deliveryType"
                          value="cod"
                          checked={deliveryType === 'cod'}
                          onChange={() => setDeliveryType('cod')}
                        />
                        Cash on Delivery
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isOrdering}
                    className="w-full bg-red-600 py-4 rounded-2xl font-black uppercase"
                  >
                    {isOrdering ? 'Processing...' : 'Place Order'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-8">
            <h1 className="text-4xl font-black uppercase">Order History</h1>
            {orders.length === 0 ? (
              <div className="bg-stone-900 p-10 rounded-3xl text-center">No orders found</div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-stone-900 rounded-3xl p-6">
                  <div className="flex justify-between mb-6">
                    <div>
                      <p className="text-stone-500 text-xs">ORDER ID</p>
                      <h3 className="font-black">#{order.id?.slice(-8) || 'N/A'}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-stone-500 text-xs">DATE</p>
                      <p>{order.date ? order.date.split(' ')[0] : 'No Date'}</p>
                      <p
                        className={`mt-1 px-3 py-1 rounded-full text-xs font-black uppercase ${
                          order.status === 'pending'
                            ? 'bg-yellow-500 text-black'
                            : order.status === 'preparing'
                            ? 'bg-blue-500 text-white'
                            : order.status === 'ready'
                            ? 'bg-green-400 text-black'
                            : order.status === 'completed'
                            ? 'bg-green-700 text-white'
                            : order.status === 'cancelled'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-500 text-white'
                        }`}
                      >
                        {order.status || 'Pending'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <div>
                          <p className="font-bold">{item.name}</p>
                          <p className="text-sm text-stone-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-black">₱{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10 flex justify-between">
                    <div className="space-y-2 text-sm text-stone-400">
                      <p>Payment: {order.paymentMethod?.toUpperCase() || 'N/A'}</p>
                      <p>Delivery: {order.deliveryType?.toUpperCase() || 'N/A'}</p>
                      <p>Address: {order.address || 'No Address'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-stone-500 text-xs">TOTAL</p>
                      <h2 className="text-3xl font-black text-red-600">₱{order.total?.toLocaleString() || 0}</h2>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
