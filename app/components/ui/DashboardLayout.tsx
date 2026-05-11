import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  role: string;
}

export default function DashboardLayout({ children, menuItems, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('ami_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const userData = localStorage.getItem('ami_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // Verify role
        if (user.role?.toLowerCase() !== role.toLowerCase() && 
            !(user.role?.toLowerCase() === 'kaprodi' && role.toLowerCase() === 'admin')) {
            // Kaprodi bisa akses admin jika di set demikian (sementara) - akan di fix nanti
        }
        
        if (user.dosen?.nama_lengkap) {
            setUserName(user.dosen.nama_lengkap);
        } else {
            setUserName(user.email.split('@')[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [role, router]);

  const handleLogout = () => {
    localStorage.removeItem('ami_token');
    localStorage.removeItem('ami_user');
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                AM
             </div>
             <span className="font-bold text-lg tracking-tight">Sistem AMI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="px-6 py-4 border-b border-slate-800">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Role</div>
          <div className="text-sm font-medium text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md inline-block">
             {role.toUpperCase()}
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <div className={`${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {item.icon}
                </div>
                <span className="font-medium text-sm">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700">{userName}</span>
              <span className="text-xs text-slate-500">{role}</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 border border-indigo-200">
               <User size={18} />
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-auto bg-slate-50/50 p-4 lg:p-8">
           <div className="mx-auto max-w-7xl animate-fade-in">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
}
