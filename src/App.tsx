import { useState } from 'react';
import { api } from './services/api';
import Showcase from './components/Showcase';
import AdminLogin from './components/AdminLogin';
import Admin from './components/Admin';
import UserDashboard from './components/UserDashboard';

type Page = 'showcase' | 'login' | 'admin' | 'user';

export default function App() {
  const user = api.getUser();
  const [page, setPage] = useState<Page>(api.isLoggedIn() ? (user?.role === 'admin' ? 'admin' : 'user') : 'showcase');

  const handleLoginSuccess = () => {
    const u = api.getUser();
    setPage(u?.role === 'admin' ? 'admin' : 'user');
  };

  if (page === 'showcase') return <Showcase onAdmin={() => setPage('login')} />;
  if (page === 'login') return <AdminLogin onSuccess={handleLoginSuccess} onBack={() => setPage('showcase')} />;
  if (page === 'user') return <UserDashboard onLogout={() => { api.logout(); setPage('showcase'); }} onBackToShowcase={() => setPage('showcase')} />;
  return <Admin onBack={() => { setPage('showcase'); }} onLogout={() => { api.logout(); setPage('showcase'); }} />;
}
