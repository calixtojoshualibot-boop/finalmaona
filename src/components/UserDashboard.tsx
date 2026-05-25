import { useState, useEffect, useRef } from 'react';
import { Cap, SellerContact, UserAccount, Order } from '../types/Cap';
import { api } from '../services/api';
import TeamLogo, { NBALogo } from './TeamLogos';
import {
  Plus, Edit2, Trash2, Eye, ArrowLeft, Save, X, Upload, Camera, Star, StarOff
} from 'lucide-react';

interface Props { onBack: () => void; onLogout: () => void; }

const CONDITIONS = ['good', 'renovated'] as const;

const COND_STYLES: Record<string, string> = {
  good: 'bg-yellow-500',
  renovated: 'bg-green-500',
};

export default function Admin({ onBack, onLogout }: Props) {
  const user = api.getUser();
  const isAdmin = user?.role === 'admin';

  const [caps, setCaps] = useState<Cap[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'list'|'form'|'view'|'settings'|'orders'|'users'>(() => (localStorage.getItem('admin_active_tab') as any) || 'list');

  useEffect(() => { localStorage.setItem('admin_active_tab', tab); }, [tab]);
  const [editing, setEditing] = useState<Cap|null>(null);
  const [viewing, setViewing] = useState<Cap|null>(null);
  const [del, setDel] = useState<Cap|null>(null);

  // form fields
  const [fName, setFName] = useState('');
  const [fTeam, setFTeam] = useState('');
  const [fYear, setFYear] = useState(1995);
  const [fCond, setFCond] = useState<Cap['condition']>('good');
  const [fPrice, setFPrice] = useState(0);
  const [fDesc, setFDesc] = useState('');
  const [fImage, setFImage] = useState<string|null>(null);
  const [fFeat, setFFeat] = useState(false);
  const [fUpload, setFUpload] = useState('');
  const [fReceipt, setFReceipt] = useState<string>(''); // new: receipt
  const [errors, setErrors] = useState<Record<string,string>>({});

  const fileRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFReceipt(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const load = () => api.getAll().then(setCaps);
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setFName(''); setFTeam(''); setFYear(1995); setFCond('good');
    setFPrice(0); setFDesc(''); setFImage(null); setFFeat(false);
    setFUpload(''); setFReceipt(''); setErrors({}); setEditing(null);
  };

  const openCreate = () => { resetForm(); setTab('form'); };
  const openEdit = (c: Cap) => {
    setEditing(c); setFName(c.name); setFTeam(c.team); setFYear(c.year);
    setFCond(c.condition); setFPrice(c.price); setFDesc(c.description);
    setFImage(c.image || null); setFFeat(c.featured); setFUpload('');
    setTab('form');
  };

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
    const data = { name:fName, team:fTeam, year:fYear, condition:fCond, price:fPrice, description:fDesc, image:fImage, featured:fFeat, receipt: fReceipt };
    if (editing) api.update(editing.id, data);
    else api.create(data);
    load(); resetForm(); setTab('list');
  };

  const filtered = caps.filter(c => {
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.team.toLowerCase().includes(s);
  });

  // ── FORM ──
  if (tab==='form') return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm space-y-5">
        {/* Cap Name */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Cap Name *</label>
          <input value={fName} onChange={e=>setFName(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500"/>
        </div>

        {/* Team */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Team *</label>
          <input value={fTeam} onChange={e=>setFTeam(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500"/>
        </div>

        {/* Year + Condition */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Year Released</label>
            <input type="number" value={fYear} onChange={e=>setFYear(Number(e.target.value))}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Condition</label>
            <select value={fCond} onChange={e=>setFCond(e.target.value as Cap['condition'])}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 bg-white capitalize">
              {CONDITIONS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Price (₱)</label>
          <input type="number" value={fPrice} onChange={e=>setFPrice(Number(e.target.value))}
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500"/>
        </div>

        {/* Cap Picture */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Cap Picture</label>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden">
              {fImage ? <TeamLogo image={fImage} size={112}/> : <Camera size={28} className="text-slate-300"/>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload}/>
            <button type="button" onClick={()=>fileRef.current?.click()} className="px-4 py-2 border-dashed border-2 rounded-lg text-sm font-semibold text-slate-600 hover:border-red-400 hover:text-red-600">Upload Photo</button>
          </div>
        </div>

        {/* Receipt Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Receipt (Optional)</label>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden">
              {fReceipt ? <img src={fReceipt} alt="Receipt" className="object-cover w-full h-full"/> : <Camera size={28} className="text-slate-300"/>}
            </div>
            <input ref={receiptRef} type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload}/>
            <button type="button" onClick={()=>receiptRef.current?.click()} className="px-4 py-2 border-dashed border-2 rounded-lg text-sm font-semibold text-slate-600 hover:border-red-400 hover:text-red-600">Upload Receipt</button>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Description *</label>
          <textarea value={fDesc} onChange={e=>setFDesc(e.target.value)} rows={3} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500"/>
        </div>

        {/* Featured */}
        <button type="button" onClick={()=>setFFeat(!fFeat)} className={`px-4 py-2 border-2 rounded-lg font-bold ${fFeat?'border-yellow-400 bg-yellow-50 text-yellow-700':'border-slate-200 text-slate-500'}`}>
          {fFeat ? '⭐ Featured' : 'Not Featured'}
        </button>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button onClick={()=>{resetForm(); setTab('list');}} className="flex-1 py-2.5 border rounded-lg font-semibold">Cancel</button>
          <button onClick={save} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg">{editing?'Update':'Add to Vault'}</button>
        </div>
      </div>
    </div>
  );
}
