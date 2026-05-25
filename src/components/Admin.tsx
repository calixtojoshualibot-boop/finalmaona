import { useState, useEffect, useRef } from 'react';
import { Cap, SellerContact, UserAccount, Order } from '../types/Cap';
import { api } from '../services/api';
import TeamLogo, { NBALogo } from './TeamLogos';
import {
  Plus, Edit2, Trash2, Eye, ArrowLeft, Save, X, Search, Star, StarOff, 
  Settings, Phone, Mail, MapPin, Shield, UserPlus, User
} from 'lucide-react';

// ... (CONDITIONS and COND_STYLES remain the same)

export default function Admin({ onBack, onLogout }: Props) {
  const user = api.getUser();
  const isAdmin = user?.role === 'admin';

  // --- States ---
  const [caps, setCaps] = useState<Cap[]>([]);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [tab, setTab] = useState<'list'|'form'|'view'|'settings'|'orders'|'users'>(() => {
    return (localStorage.getItem('admin_active_tab') as any) || 'list';
  });

  // User Management States
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'user' as 'user'|'admin' });

  useEffect(() => {
    localStorage.setItem('admin_active_tab', tab);
    if (tab === 'users') loadUsers();
    if (tab === 'list') api.getAll().then(setCaps);
  }, [tab]);

  const loadUsers = () => api.getUsers().then(setAllUsers);

  // --- User Actions ---
  const openUserCreate = () => {
    setUserForm({ name: '', email: '', password: '', role: 'user' });
    setEditingUser(null);
    setShowUserModal(true);
  };

  const openUserEdit = (u: UserAccount) => {
    setUserForm({ name: u.name, email: u.email, password: '', role: u.role });
    setEditingUser(u);
    setShowUserModal(true);
  };

  const handleUserSave = async () => {
    if (editingUser) {
      await api.updateUser(editingUser.id, userForm);
    } else {
      await api.createUser(userForm);
    }
    setShowUserModal(false);
    loadUsers();
  };

  const handleUserDelete = async (id: string) => {
    if (id === user?.id) return alert("You cannot delete your own account.");
    if (confirm("Permanently remove this user?")) {
      await api.deleteUser(id);
      loadUsers();
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // ... (Cap logic for list/view/form remains the same as previous fix)

  // ─── USERS MANAGEMENT TAB ──────────────────────────────
  if (tab === 'users') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <h1 className="font-black text-lg uppercase tracking-tighter">Account Management</h1>
            <button onClick={()=>setTab('list')} className="text-xs font-black uppercase px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Back to Products</button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input type="text" value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"/>
            </div>
            <button onClick={openUserCreate} className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all">
              <UserPlus size={16}/> Add User
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left p-4 text-[10px] font-black uppercase text-slate-400">User Details</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase text-slate-400">Access Level</th>
                  <th className="text-right p-4 text-[10px] font-black uppercase text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-none">{u.name} {u.id === user?.id && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded ml-1">YOU</span>}</p>
                          <p className="text-xs text-slate-400 mt-1">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                        <Shield size={10}/> {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={()=>openUserEdit(u)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 rounded transition-all">
                          <Edit2 size={16}/>
                        </button>
                        <button 
                          onClick={()=>handleUserDelete(u.id)} 
                          disabled={u.id === user?.id}
                          className={`p-2 rounded transition-all ${u.id === user?.id ? 'opacity-20 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent'}`}
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Configuration Modal */}
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest text-slate-800">
                  {editingUser ? 'Configure Account' : 'New User Account'}
                </h3>
                <button onClick={()=>setShowUserModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Full Name</label>
                  <input value={userForm.name} onChange={e=>setUserForm({...userForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Email Address</label>
                  <input value={userForm.email} onChange={e=>setUserForm({...userForm, email: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Password {editingUser && '(Leave blank to keep current)'}</label>
                  <input type="password" value={userForm.password} onChange={e=>setUserForm({...userForm, password: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Role / Permissions</label>
                  <select 
                    value={userForm.role} 
                    disabled={editingUser?.id === user?.id}
                    onChange={e=>setUserForm({...userForm, role: e.target.value as any})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white font-bold"
                  >
                    <option value="user">USER (View & Shop)</option>
                    <option value="admin">ADMIN (Full Access)</option>
                  </select>
                  {editingUser?.id === user?.id && <p className="text-[9px] text-slate-400 mt-1 italic">You cannot change your own role.</p>}
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={()=>setShowUserModal(false)} className="flex-1 py-2 text-xs font-black uppercase text-slate-400 hover:text-slate-600">Cancel</button>
                <button onClick={handleUserSave} className="flex-[2] py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase hover:bg-slate-800">
                  {editingUser ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ... (Other tab returns: list, form, view, settings, orders)
}
