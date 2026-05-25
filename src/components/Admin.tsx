import { useState, useEffect, useRef } from 'react';
import { Cap, SellerContact, UserAccount, Order } from '../types/Cap';
import { api } from '../services/api';
import TeamLogo, { NBALogo } from './TeamLogos';
import { Plus, Edit2, Trash2, Eye, X, Save, Search, Star, StarOff, Upload, Camera, Settings, Phone, Mail, MapPin, ArrowLeft } from 'lucide-react';

interface Props { onBack: () => void; onLogout: () => void; }

const CONDITIONS = ['deadstock','near-mint','excellent','good','fair','beater'] as const;
const COND_STYLES: Record<string,string> = {
  deadstock:'bg-emerald-500', 'near-mint':'bg-green-500', excellent:'bg-blue-500',
  good:'bg-yellow-500', fair:'bg-orange-500', beater:'bg-red-500',
};

export default function Admin({ onBack, onLogout }: Props) {
  const user = api.getUser();
  const isAdmin = user?.role === 'admin';

  const [caps, setCaps] = useState<Cap[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'list'|'form'|'view'|'settings'|'orders'|'users'>(() => (localStorage.getItem('admin_active_tab') as any) || 'list');

  const [editing, setEditing] = useState<Cap|null>(null);
  const [viewing, setViewing] = useState<Cap|null>(null);
  const [del, setDel] = useState<Cap|null>(null);

  const [contact, setContact] = useState<SellerContact>({ shopName: '', ownerName: '', phone: '', email: '', address: '', facebook: '', instagram: '', messengerUsername: '', bio: '' });
  const [contactSaved, setContactSaved] = useState(false);

  const [fName, setFName] = useState('');
  const [fTeam, setFTeam] = useState('');
  const [fYear, setFYear] = useState(1995);
  const [fCond, setFCond] = useState<Cap['condition']>('good');
  const [fPrice, setFPrice] = useState(0);
  const [fDesc, setFDesc] = useState('');
  const [fImage, setFImage] = useState('bulls');
  const [fFeat, setFFeat] = useState(false);
  const [fUpload, setFUpload] = useState('');
  const [errors, setErrors] = useState<Record<string,string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setFUpload(base64);
      setFImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const load = () => {
    api.getAll().then(setCaps);
    api.getContact().then(setContact);
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setFName(''); setFTeam(''); setFYear(1995); setFCond('good');
    setFPrice(0); setFDesc(''); setFImage('bulls'); setFFeat(false);
    setFUpload(''); setErrors({}); setEditing(null);
  };

  const openCreate = () => { resetForm(); setTab('form'); };
  const openEdit = (c: Cap) => {
    setEditing(c); setFName(c.name); setFTeam(c.team); setFYear(c.year);
    setFCond(c.condition); setFPrice(c.price); setFDesc(c.description);
    setFImage(c.image); setFFeat(c.featured);
    setFUpload(c.image.startsWith('data:') ? c.image : '');
    setTab('form');
  };
  const openView = (c: Cap) => { setViewing(c); setTab('view'); };

  const validate = () => {
    const e: Record<string,string> = {};
    if (!fName.trim()) e.name = 'Required';
    if (!fTeam.trim()) e.team = 'Required';
    if (!fDesc.trim()) e.desc = 'Required';
    if (fPrice < 0) e.price = 'Invalid';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    const data = { name:fName, team:fTeam, year:fYear, condition:fCond, price:fPrice, description:fDesc, image:fImage, featured:fFeat };
    if (editing) api.update(editing.id, data);
    else api.create(data);
    load(); resetForm(); setTab('list');
  };

  const remove = (c: Cap) => { api.remove(c.id); setDel(null); load(); };

  const teams = [...new Set(caps.map(c=>c.team))].sort();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);

  const filtered = caps.filter(c => {
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.team.toLowerCase().includes(s);
  });

  useEffect(() => {
    if (tab === 'orders') {
      api.getOrders().then(data => Array.isArray(data)?setAllOrders(data):setAllOrders([]));
    }
    if (tab === 'users') {
      api.getUsers().then(data => Array.isArray(data)?setAllUsers(data):setAllUsers([]));
    }
  }, [tab]);

  const updateOrder = async (id: string, status: Order['status']) => {
    await api.updateOrderStatus(id, status);
    api.getOrders().then(setAllOrders);
  };

  // ─── ORDERS ─────────────────────────────
  if (tab === 'orders') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <h1 className="font-black text-lg uppercase">Manage Orders</h1>
            <div className="flex gap-2">
               <button onClick={()=>setTab('list')} className="text-xs font-black uppercase px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Back to Products</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {!Array.isArray(allOrders) || allOrders.length === 0 ? (
             <div className="bg-white rounded-xl border border-dashed border-slate-300 p-20 text-center text-slate-400 font-bold uppercase">No orders found</div>
          ) : (
            allOrders.map(order => (
              <div key={order?.id || Math.random()} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase">Customer: {order?.userName || 'N/A'}</span>
                    <p className="font-bold text-slate-800">Order #{order?.id?.slice(-8).toUpperCase() || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <select 
                      value={order?.status || 'pending'} 
                      onChange={(e) => updateOrder(order.id, e.target.value as any)}
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
                            {/* Added product image */}
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                              {item.image ? <TeamLogo image={item.image} size={80}/> : <div className="text-xs text-slate-400 flex items-center justify-center h-full">No Image</div>}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800">{item.name || 'Item'} x{item.quantity || 0}</p>
                              <p className="text-sm font-black text-red-600">₱{((item.price || 0) * (item.quantity || 0)).toLocaleString()}</p>
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
