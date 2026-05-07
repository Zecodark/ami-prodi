'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UsersContent from './components/UsersContent';
import InstrumensContent from './components/InstrumensContent';
import PeriodesContent from './components/PeriodesContent';
import SettingsContent from './components/SettingsContent';

interface User {
  id: string;
  email: string;
  role: string | null;
  dosen?: { nama_lengkap: string; nip: string } | null;
}

type ActiveMenu = 'dashboard' | 'users' | 'periodes' | 'instrumens' | 'settings';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'users', label: 'Manajemen Pengguna', icon: '👥' },
  { id: 'periodes', label: 'Periode Audit', icon: '📅' },
  { id: 'instrumens', label: 'Standar & Instrumen', icon: '📚' },
  { id: 'settings', label: 'Pengaturan Akun', icon: '⚙️' },
] as const;

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const storedToken = localStorage.getItem('ami_token');
    const storedUser = localStorage.getItem('ami_user');
    if (!storedToken || !storedUser) {
      router.replace('/login');
      return;
    }
    setToken(storedToken);
    setUser(JSON.parse(storedUser));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('ami_token');
    localStorage.removeItem('ami_user');
    router.replace('/login');
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-white border-r border-slate-200 transition-all duration-300 overflow-hidden shrink-0 ${
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-4 overflow-hidden whitespace-nowrap">
            <span className="text-3xl shrink-0">🎯</span>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-br from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  AMI Prodi
                </span>
                <span className="text-[11px] text-slate-500 font-medium tracking-widest uppercase">Admin Panel</span>
              </div>
            )}
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shrink-0 text-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          {sidebarOpen && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">Menu Persiapan</div>}
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id as ActiveMenu)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl w-full text-left transition-colors overflow-hidden whitespace-nowrap ${
                activeMenu === item.id
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-500 border border-transparent hover:bg-white hover:text-slate-700'
              }`}
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="text-[15px] font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl w-full text-left transition-colors overflow-hidden whitespace-nowrap text-red-500/60 hover:bg-red-50 hover:text-red-600 font-medium text-sm border border-transparent"
          >
            <span className="text-xl shrink-0">🚪</span>
            {sidebarOpen && <span className="text-[15px]">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
        {/* Topbar */}
        <header className="flex items-center justify-between px-10 py-6 bg-white/[0.02] border-b border-slate-200 shrink-0">
          <h2 className="text-2xl font-bold text-slate-800 m-0 tracking-tight">
            {menuItems.find((m) => m.id === activeMenu)?.label}
          </h2>
          <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-base text-white shrink-0 shadow-lg shadow-indigo-500/20">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-800 max-w-[180px] truncate">
                {user.dosen?.nama_lengkap ?? user.email}
              </span>
              <span className="text-[11px] text-indigo-700 font-medium uppercase tracking-wider mt-0.5">
                {user.role ?? 'User'}
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-10 overflow-y-auto">
          {activeMenu === 'dashboard' && <DashboardContent token={token} />}
          {activeMenu === 'users' && <UsersContent token={token} />}
          {activeMenu === 'periodes' && <PeriodesContent token={token} />}
          {activeMenu === 'instrumens' && <InstrumensContent token={token} />}
          {activeMenu === 'settings' && <SettingsContent token={token} user={user} />}
        </main>
      </div>
    </div>
  );
}

function DashboardContent({ token }: { token: string }) {
  const [stats, setStats] = useState({
    dosen: '...',
    periode: '...',
    instrumen: '...',
    butir: '...'
  });

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    
    Promise.all([
      fetch('/api/dosens', { headers }).then(r => r.json()),
      fetch('/api/periodes', { headers }).then(r => r.json()),
      fetch('/api/instrumens', { headers }).then(r => r.json()),
      fetch('/api/butirs', { headers }).then(r => r.json()),
    ]).then(([resDosen, resPeriode, resInstrumen, resButir]) => {
      let periodeAktif = 'Tidak Ada';
      if (resPeriode.data && Array.isArray(resPeriode.data)) {
        const active = resPeriode.data.find((p: any) => p.is_active);
        if (active) periodeAktif = active.tahun;
      }

      setStats({
        dosen: resDosen.data?.length?.toString() || '0',
        periode: periodeAktif,
        instrumen: resInstrumen.data?.length?.toString() || '0',
        butir: resButir.data?.length?.toString() || '0',
      });
    }).catch(console.error);
  }, [token]);

  const cards = [
    { label: 'Jumlah Dosen', value: stats.dosen, color: 'from-indigo-500 to-indigo-600', icon: '🎓' },
    { label: 'Status Periode Aktif', value: stats.periode, color: 'from-emerald-500 to-emerald-600', icon: '📅' },
    { label: 'Total Standar', value: stats.instrumen, color: 'from-cyan-500 to-cyan-600', icon: '📚' },
    { label: 'Total Butir Instrumen', value: stats.butir, color: 'from-purple-500 to-purple-600', icon: '📋' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Persiapan Audit Mutu Internal</h3>
        <p className="text-slate-500 text-[15px]">
          Lakukan pengecekan master data, pengguna, dan instrumen sebelum pelaksanaan audit dimulai.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-3xl p-7 relative overflow-hidden transition-all hover:-translate-y-1 hover:border-slate-300 group hover:shadow-2xl hover:shadow-black/50"
          >
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${card.color}`} />
            <div className="flex justify-between items-start mb-6">
              <div className="text-4xl bg-white w-14 h-14 rounded-2xl flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform">{card.icon}</div>
            </div>
            <div className="text-4xl font-bold text-slate-800 leading-none mb-3 tracking-tight">
              {card.value}
            </div>
            <div className="text-[14px] text-slate-500 font-medium">{card.label}</div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-20 transition-opacity`} />
          </div>
        ))}
      </div>
    </div>
  );
}
