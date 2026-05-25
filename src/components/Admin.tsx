// Path: src/components/Admin.tsx

import { useState, useEffect, useRef } from 'react';
import { Cap, SellerContact, UserAccount, Order } from '../types/Cap';
import { api } from '../services/api';
import TeamLogo from './TeamLogos';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';

interface Props { onBack: () => void; onLogout: () => void; }

export default function Admin({ onBack, onLogout }: Props) {
  const user = api.getUser();

  const [caps, setCaps] = useState<Cap[]>([]);
  const [tab, setTab] = useState<'list'|'orders'>('list');
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.getAll().then(setCaps);
    api.getOrders().then(data => Array.isArray(data)?setAllOrders(data):[]);
  }, []);

  const updateOrder = async (id: string, status: Order['status']) => {
    await api.updateOrderStatus(id, status);
    api.getOrders().then(setAllOrders);
  };

  if (tab === 'orders') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <h1 className="font-black text-lg uppercase">Manage Orders</h1>
            <button
              onClick={() => setTab('list')}
              className="text-xs font-black uppercase px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              Back to Products
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {allOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-20 text-center text-slate-400 font-bold uppercase">
              No orders found
            </div>
          ) : (
            allOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      Customer: {order?.userName || 'N/A'}
                    </span>
                    <p className="font-bold text-slate-800">
                      Order #{order?.id?.slice(-8).toUpperCase() || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <select
                      value={order?.status || 'pending'}
                      onChange={e => updateOrder(order.id, e.target.value as any)}
                      className="text-xs font-bold uppercase p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="repacking">Repacking</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <span className="text-[10px] font-bold text-slate-400">{order?.date || ''}</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      {Array.isArray(order?.items) ? order.items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 mb-4">
                          {/* Product Image */}
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                            {item.image ? (
                              <TeamLogo image={item.image} size={80} />
                            ) : (
                              <div className="text-xs text-slate-400 flex items-center justify-center h-full">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">{item.name || 'Item'} x{item.quantity || 0}</p>
                            <p className="text-sm font-black text-red-600">
                              ₱{((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )) : <p className="text-xs text-slate-400 italic">No items details</p>}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Payment</p>
                          <p className="text-sm font-bold uppercase text-red-600">{order?.paymentMethod || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Type</p>
                          <p className="text-sm font-bold uppercase text-red-600">{order?.deliveryType || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Phone / Address</p>
                          <p className="text-xs font-bold text-slate-800">{order?.phone || 'N/A'}</p>
                          <p className="text-xs text-slate-600">{order?.address || 'N/A'}</p>
                        </div>
                        {order?.notes && (
                          <div className="col-span-2 p-2 bg-yellow-50 rounded border border-yellow-100">
                            <p className="text-[9px] font-black text-yellow-600 uppercase">Notes</p>
                            <p className="text-xs italic text-slate-700">{order.notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-end pt-2 border-t border-slate-200">
                        <span className="text-xs font-black text-slate-400 uppercase">Total Collected</span>
                        <span className="text-2xl font-black text-slate-900">₱{order?.total?.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return null;
}
