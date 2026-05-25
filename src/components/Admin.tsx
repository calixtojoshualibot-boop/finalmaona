import { useState, useEffect, useRef } from 'react';
import { Cap, SellerContact, UserAccount, Order } from '../types/Cap';
import { api } from '../services/api';
import TeamLogo, { NBALogo } from './TeamLogos';
import {
  Plus, Edit2, Trash2, Eye, ArrowLeft, Save, X, Search, Star, StarOff, LogOut, Upload, Camera, Settings, Phone, Mail, MapPin, ArrowRight
} from 'lucide-react';

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
  const [tab, setTab] = useState<'list'|'form'|'view'|'settings'|'orders'|'users'>(() => {
    return (localStorage.getItem('admin_active_tab') as any) || 'list';
  });

  useEffect(() => {
    localStorage.setItem('admin_active_tab', tab);
  }, [tab]);
  
  const [editing, setEditing] = useState<Cap|null>(null);
  const [viewing, setViewing] = useState<Cap|null>(null);
  const [del, setDel] = useState<Cap|null>(null);

  const [contact, setContact] = useState<SellerContact>({ shopName: '', ownerName: '', phone: '', email: '', address: '', facebook: '', instagram: '', messengerUsername: '', bio: '' });
  const [contactSaved, setContactSaved] = useState(false);

  // Form States
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
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
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
    setEditing(c); 
    setFName(c.name); 
    setFTeam(c.team); 
    setFYear(c.year);
    setFCond(c.condition); 
    setFPrice(c.price); 
    setFDesc(c.description);
    setFImage(c.image); 
    setFFeat(c.featured);
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
    if (tab === 'orders') api.getOrders().then(setAllOrders);
    if (tab === 'users') api.getUsers().then(setAllUsers);
  }, [tab]);

  const updateOrder = async (id: string, status: Order['status']) => {
    await api.updateOrderStatus(id, status);
    api.getOrders().then(setAllOrders);
  };

  // ─── LIST TAB ─────────────────────────────────
  if (tab === 'list') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase text-red-500 leading-none">Admin Panel</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{user?.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={()=>setTab('list')} className={`text-[10px] font-black uppercase px-3 py-2 rounded-lg transition-all ${tab==='list'?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-100'}`}>Products</button>
                <button onClick={()=>setTab('orders')} className={`text-[10px] font-black uppercase px-3 py-2 rounded-lg transition-all ${tab==='orders'?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-100'}`}>Orders</button>
                <button onClick={()=>setTab('settings')} className={`text-[10px] font-black uppercase px-3 py-2 rounded-lg transition-all ${tab==='settings'?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-100'}`}>Settings</button>
              <div className="h-4 w-px bg-slate-200 mx-2" />
              <button onClick={onBack} className="text-[10px] font-black uppercase px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Exit</button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vault..."
                className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"/>
            </div>
            {isAdmin && (
              <button onClick={openCreate}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold uppercase text-xs tracking-wider shadow-sm transition-transform active:scale-95">
                <Plus size={16}/> Add New Cap
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead><tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</th>
                <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
                <th className="text-left px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-right px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center"><TeamLogo image={c.image} size={32}/></div>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{c.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{c.team}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-600">{c.year}</td>
                    <td className="px-5 py-3 font-black text-sm text-slate-900">₱{c.price.toLocaleString()}</td>
                    <td className="px-5 py-3">
                       <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase text-white ${COND_STYLES[c.condition]}`}>{c.condition}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={()=>openView(c)} className="p-2 rounded hover:bg-white border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-900 transition-all" title="View"><Eye size={16}/></button>
                        {isAdmin && (
                          <>
                            <button onClick={()=>openEdit(c)} className="p-2 rounded hover:bg-blue-50 border border-transparent hover:border-blue-100 text-slate-400 hover:text-blue-600 transition-all" title="Edit"><Edit2 size={16}/></button>
                            <button onClick={()=>setDel(c)} className="p-2 rounded hover:bg-red-50 border border-transparent hover:border-red-100 text-slate-400 hover:text-red-600 transition-all" title="Delete"><Trash2 size={16}/></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {del && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={()=>setDel(null)}>
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={e=>e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><Trash2 size={28} className="text-red-600"/></div>
              <h3 className="text-lg font-black text-slate-800 mb-1">Remove Cap?</h3>
              <p className="text-slate-500 text-sm mb-6">Are you sure you want to delete <b>{del.name}</b>?</p>
              <div className="flex gap-3">
                <button onClick={()=>setDel(null)} className="flex-1 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={()=>remove(del)} className="flex-1 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── VIEW TAB (Updated with Edit Action) ─────────────────────────────────
  if (tab === 'view' && viewing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 h-16 flex items-center px-6 sticky top-0 z-40">
          <button onClick={()=>setTab('list')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500"><ArrowLeft size={20}/></button>
          <h1 className="ml-2 font-black text-sm uppercase tracking-widest">Cap Details</h1>
          {isAdmin && (
            <button onClick={() => openEdit(viewing)} className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase">
                <Edit2 size={14}/> Edit Item
            </button>
          )}
        </div>
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="aspect-square bg-white rounded-2xl border border-slate-200 flex items-center justify-center p-12 shadow-sm">
              <TeamLogo image={viewing.image} size={300}/>
           </div>
           <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded text-white ${COND_STYLES[viewing.condition]}`}>{viewing.condition}</span>
                    {viewing.featured && <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-yellow-400 text-yellow-900 flex items-center gap-1"><Star size={10} className="fill-current"/> Featured</span>}
                </div>
                <h2 className="text-3xl font-black text-slate-900 uppercase leading-none mb-1">{viewing.name}</h2>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">{viewing.team} • {viewing.year}</p>
              </div>
              <div className="text-3xl font-black text-red-600">₱{viewing.price.toLocaleString()}</div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{viewing.description}</p>
              </div>
              <button onClick={()=>setTab('list')} className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-black uppercase text-xs hover:bg-slate-100 transition-colors">Back to List</button>
           </div>
        </div>
      </div>
    );
  }

  // ─── ORDERS, USERS, SETTINGS TABS (Keep as they are in original) ─────────
  if (tab === 'orders') { /* ... same as original ... */ }
  if (tab === 'users') { /* ... same as original ... */ }
  if (tab === 'settings') { /* ... same as original ... */ }

  // ─── FORM TAB (Unified Add/Edit) ─────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 h-16 flex items-center px-6 sticky top-0 z-40">
        <button onClick={()=>{setTab('list'); resetForm();}} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
        <h1 className="ml-2 font-black text-sm uppercase tracking-widest">
            {editing ? `Editing: ${editing.name}` : 'Add New Vault Item'}
        </h1>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cap Name *</label>
              <input value={fName} onChange={e=>setFName(e.target.value)} placeholder="e.g. 1996 NBA Finals Snapback"
                className={`w-full px-4 py-2 rounded-lg border ${errors.name?'border-red-400 bg-red-50':'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-red-500 text-sm`}/>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Team *</label>
                  <input value={fTeam} onChange={e=>setFTeam(e.target.value)} list="teams-list"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"/>
                  <datalist id="teams-list">{teams.map(t=><option key={t} value={t}/>)}</datalist>
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Price (₱)</label>
                  <input type="number" value={fPrice} onChange={e=>setFPrice(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold"/>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Year</label>
                  <input type="number" value={fYear} onChange={e=>setFYear(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"/>
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Condition</label>
                  <select value={fCond} onChange={e=>setFCond(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white uppercase font-bold">
                    {CONDITIONS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
            </div>

            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visuals</label>
               <div className="flex gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                  <div className="w-20 h-20 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                     <TeamLogo image={fImage} size={60}/>
                  </div>
                  <div className="flex-1 space-y-2">
                     <button type="button" onClick={()=>fileRef.current?.click()} className="text-[10px] font-black uppercase flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors w-full">
                        <Upload size={12}/> {fUpload ? 'Change Photo' : 'Upload Custom Photo'}
                     </button>
                     <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload}/>
                     <select value={fUpload ? '' : fImage} onChange={e=>{setFUpload(''); setFImage(e.target.value);}} className="w-full text-[10px] font-black uppercase p-2 border border-slate-200 rounded bg-white">
                        <option value="">— Or Select Preset Logo —</option>
                        {['bulls','lakers','celtics','warriors','knicks','heat','spurs','raptors','suns','bucks','magic','rockets'].map(t=>(
                           <option key={t} value={t}>{t.toUpperCase()}</option>
                        ))}
                     </select>
                  </div>
               </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description *</label>
              <textarea value={fDesc} onChange={e=>setFDesc(e.target.value)} rows={3}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"/>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
               <div className={`w-10 h-5 rounded-full relative transition-colors ${fFeat ? 'bg-yellow-400' : 'bg-slate-200'}`} onClick={()=>setFFeat(!fFeat)}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${fFeat ? 'left-6' : 'left-1'}`}/>
               </div>
               <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-slate-900">Feature in Showcase</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button onClick={()=>{setTab('list'); resetForm();}} className="flex-1 py-3 text-xs font-black uppercase text-slate-400 hover:text-slate-600">Cancel</button>
            <button onClick={save} className="flex-[2] py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-red-200 hover:bg-red-700 transition-transform active:scale-95">
               {editing ? 'Update Cap' : 'Add to Vault'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
