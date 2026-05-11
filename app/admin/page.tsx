'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, AlertCircle, Clock, BookOpen, GraduationCap } from 'lucide-react';

interface SummaryData {
  users: number;
  dosens: number;
  prodis: number;
  periodes: number;
  instrumens: number;
  isians: {
    total: number;
    proses: number;
    valid: number;
    revisi: number;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Di aplikasi nyata, kita akan fetch ini dari API terpadu atau beberapa endpoint
    // Untuk prototipe ini, kita gunakan setTimeout dan dummy data yang merefleksikan struktur database baru
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Simulasi network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setData({
          users: 5,
          dosens: 12,
          prodis: 3,
          periodes: 1,
          instrumens: 1,
          isians: {
            total: 24,
            proses: 8,
            valid: 12,
            revisi: 4
          }
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total User Aktif', value: data.users, icon: <Users size={24} />, color: 'bg-blue-500' },
    { title: 'Total Dosen', value: data.dosens, icon: <GraduationCap size={24} />, color: 'bg-indigo-500' },
    { title: 'Total Prodi', value: data.prodis, icon: <BookOpen size={24} />, color: 'bg-cyan-500' },
    { title: 'Periode Aktif', value: data.periodes, icon: <Clock size={24} />, color: 'bg-emerald-500' },
    { title: 'Instrumen Aktif', value: data.instrumens, icon: <FileText size={24} />, color: 'bg-violet-500' },
    { title: 'Total Isian AMI', value: data.isians.total, icon: <FileText size={24} />, color: 'bg-slate-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Admin</h1>
        <p className="text-slate-500 text-sm mt-1">Ringkasan data sistem Audit Mutu Internal</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl text-white ${stat.color} shadow-sm`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress & Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Status Pengisian AMI (Periode Aktif)</h3>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-amber-600 flex items-center gap-1.5"><Clock size={16}/> Proses (Menunggu Review)</span>
                <span className="font-bold text-slate-700">{data.isians.proses}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${(data.isians.proses / data.isians.total) * 100}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-emerald-600 flex items-center gap-1.5"><CheckCircle size={16}/> Valid (Disetujui)</span>
                <span className="font-bold text-slate-700">{data.isians.valid}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${(data.isians.valid / data.isians.total) * 100}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-rose-600 flex items-center gap-1.5"><AlertCircle size={16}/> Revisi (Perlu Diperbaiki)</span>
                <span className="font-bold text-slate-700">{data.isians.revisi}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-rose-500 h-2.5 rounded-full" style={{ width: `${(data.isians.revisi / data.isians.total) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Aktivitas Terbaru</h3>
          <div className="flex-1 space-y-4">
            <div className="flex gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0"></div>
              <div>
                <p className="text-sm text-slate-700">Kaprodi TRPL menyetujui isian <strong>Ahmad Rizky</strong></p>
                <p className="text-xs text-slate-400 mt-0.5">2 jam yang lalu</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 shrink-0"></div>
              <div>
                <p className="text-sm text-slate-700">Dosen <strong>Budi Santoso</strong> submit isian Kriteria 1</p>
                <p className="text-xs text-slate-400 mt-0.5">5 jam yang lalu</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0"></div>
              <div>
                <p className="text-sm text-slate-700">Admin menambahkan instrumen <strong>AMI Genap 2024</strong></p>
                <p className="text-xs text-slate-400 mt-0.5">1 hari yang lalu</p>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            Lihat Semua Aktivitas
          </button>
        </div>
      </div>
    </div>
  );
}
