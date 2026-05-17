'use client';

import DashboardLayout from '@/app/components/ui/DashboardLayout';
import { 
  LayoutDashboard, 
  FileCheck
} from 'lucide-react';

const menuItems = [
  { title: 'Dashboard', href: '/kaprodi', icon: <LayoutDashboard size={18} /> },
  { title: 'Review Instrumen AMI', href: '/kaprodi/review', icon: <FileCheck size={18} /> },
];

export default function KaprodiLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="Kaprodi" menuItems={menuItems}>
      {children}
    </DashboardLayout>
  );
}
