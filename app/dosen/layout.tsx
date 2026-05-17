'use client';

import DashboardLayout from '@/app/components/ui/DashboardLayout';
import { 
  LayoutDashboard, 
  FileText,
  History,
  AlertCircle,
  User
} from 'lucide-react';

const menuItems = [
  { title: 'Dashboard', href: '/dosen', icon: <LayoutDashboard size={18} /> },
  { title: 'Isi AMI', href: '/dosen/isi-ami', icon: <FileText size={18} /> },
  { title: 'Riwayat Isian', href: '/dosen/riwayat', icon: <History size={18} /> },
  { title: 'Revisi Saya', href: '/dosen/revisi', icon: <AlertCircle size={18} /> },
  { title: 'Profil', href: '/dosen/profil', icon: <User size={18} /> },
];

export default function DosenLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="Dosen" menuItems={menuItems}>
      {children}
    </DashboardLayout>
  );
}
