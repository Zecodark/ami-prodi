'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { useState, useEffect, useMemo } from 'react';
import { formatNamaDosen } from '@/app/lib/textUtils';

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
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('ami_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const userData = localStorage.getItem('ami_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.dosen?.nama_lengkap) {
          setUserName(formatNamaDosen(user.dosen.nama_lengkap));
        } else if (user.role?.toLowerCase() === 'admin') {
          setUserName('Administrator');
        } else if (user.role?.toLowerCase() === 'kaprodi') {
          setUserName('Kaprodi');
        } else {
          setUserName(user.email?.split('@')[0] ?? 'User');
        }
        setUserEmail(user.email ?? '');
      } catch (e) {
        console.error(e);
      }
    }
  }, [router]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Konfirmasi Keluar',
      text: 'Apakah Anda yakin ingin keluar?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0a2f6f',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-xl'
      }
    });

    if (result.isConfirmed) {
      localStorage.removeItem('ami_token');
      localStorage.removeItem('ami_user');
      router.push('/login');
    }
  };

  // Breadcrumb sederhana berdasarkan menu aktif
  const activeMenu = useMemo(
    () =>
      menuItems
        .slice()
        .sort((a, b) => b.href.length - a.href.length)
        .find(
          (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
        ),
    [pathname, menuItems]
  );

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex h-screen bg-[#f4f7fc]">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ========== SIDEBAR ========== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a2f6f] text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex shadow-xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Block */}
        <div className="flex items-center justify-between h-20 px-5 bg-[#06214f]/60 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center text-white font-bold text-base shadow-inner overflow-hidden">
              <Image
                src="/logo-polines.png"
                alt="Logo Polines"
                width={40}
                height={40}
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div className="leading-tight">
              <div className="font-extrabold tracking-wide text-base">SIAMI</div>
              <div className="text-[11px] text-blue-200/80 font-medium">
                Prodi - {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()} Panel
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-blue-200 hover:text-white"
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-5 pb-2 text-[11px] uppercase tracking-[0.18em] text-blue-200/70 font-semibold">
          Menu Utama
        </div>

        {/* Nav */}
        <nav className="px-3 flex-1 overflow-y-auto space-y-1 pb-4">
          {menuItems.map((item) => {
            // For root paths like /kaprodi or /admin, only exact match
            const isRootMenu = item.href.split('/').filter(Boolean).length <= 1 ||
              menuItems.some((other) => other.href !== item.href && other.href.startsWith(`${item.href}/`));
            const isActive = isRootMenu
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1456a8] text-white shadow-md shadow-blue-900/40'
                    : 'text-blue-100/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span
                  className={`shrink-0 ${
                    isActive ? 'text-white' : 'text-blue-200/80 group-hover:text-white'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.title}</span>
                <span
                  className={`text-[10px] opacity-70 transition ${
                    isActive ? 'opacity-100' : 'group-hover:opacity-100'
                  }`}
                  aria-hidden
                >
                  ›
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Profil + Logout pinned bottom */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center text-[#06214f] font-bold text-sm shrink-0">
              {initials || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{userName}</div>
              <div className="text-[11px] text-blue-200/80 truncate">{userEmail}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/15 bg-white/[0.06] text-sm font-semibold text-white hover:bg-white/15 transition"
          >
            <LogOut size={15} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ========== MAIN ========== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 lg:px-8 z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
              aria-label="Buka menu"
            >
              <Menu size={22} />
            </button>
            <div className="text-sm text-slate-500 truncate">
              <span className="font-medium text-slate-400">
                {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
              </span>
              {activeMenu ? (
                <>
                  <span className="px-1.5 text-slate-300">›</span>
                  <span className="font-semibold text-[#0a2f6f]">{activeMenu.title}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">

            <div className="hidden md:flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-[#0a2f6f] text-white">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center text-[#06214f] text-xs font-bold">
                {initials || 'U'}
              </div>
              <span className="text-xs font-semibold tracking-wide">
                {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
