'use client';

import DashboardLayout from '@/app/components/ui/DashboardLayout';
import {
  LayoutDashboard,
  FileCheck,
  History,
  ClipboardList,
  User,
} from 'lucide-react';

const menuItems = [
  { title: 'Dashboard', href: '/kaprodi', icon: <LayoutDashboard size={18} /> },
  { title: 'Verifikasi Dokumen AMI', href: '/kaprodi/review', icon: <FileCheck size={18} /> },
  { title: 'Riwayat Review', href: '/kaprodi/riwayat', icon: <History size={18} /> },
  { title: 'Rekap AMI Prodi', href: '/kaprodi/rekap', icon: <ClipboardList size={18} /> },
  { title: 'Profil', href: '/kaprodi/profil', icon: <User size={18} /> },
];

export default function KaprodiLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="Kaprodi" menuItems={menuItems}>
      {children}
    </DashboardLayout>
  );
}
