'use client';

import DashboardLayout from '@/app/components/ui/DashboardLayout';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  GraduationCap, 
  CalendarClock,
  ClipboardCheck,
  FileSpreadsheet,
  Network,
  UserCircle
} from 'lucide-react';

const menuItems = [
  { title: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={18} /> },
  { title: 'Kelola Anggota/User', href: '/admin/users', icon: <Users size={18} /> },
  { title: 'Kelola Jurusan', href: '/admin/jurusan', icon: <BookOpen size={18} /> },
  { title: 'Kelola Prodi', href: '/admin/prodi', icon: <GraduationCap size={18} /> },
  { title: 'Kelola Dosen', href: '/admin/dosen', icon: <Users size={18} /> },
  { title: 'Kelola Periode AMI', href: '/admin/periode', icon: <CalendarClock size={18} /> },
  { title: 'Kelola Instrumen AMI', href: '/admin/instrumen', icon: <ClipboardCheck size={18} /> },
  { title: 'Struktur Instrumen', href: '/admin/struktur', icon: <Network size={18} /> },
  { title: 'Rekap Isian AMI', href: '/admin/rekap', icon: <FileSpreadsheet size={18} /> },
  { title: 'Profil', href: '/admin/profil', icon: <UserCircle size={18} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="Admin" menuItems={menuItems}>
      {children}
    </DashboardLayout>
  );
}
