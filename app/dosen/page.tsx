'use client';

import { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, Clock, CheckSquare } from 'lucide-react';

interface SummaryData {
  periode_aktif: string;
  instrumen_aktif: string;
  isians: {
    total: number;
    proses: number;
    valid: number;
    revisi: number;
  };
  progress: number;
}

export default function DosenDashboard() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dummy fetch data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setData({
          periode_aktif: 'Tahun 2024/2025 Genap',
          instrumen_aktif: 'Instrumen AMI D3 Teknik Informatika',
          isians: {
            total: 10, // target unsur yang harus diisi
            proses: 2,
            valid: 5,
            revisi: 1
          },
          progress: 80 // (proses+valid+revisi)/total * 100
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
    { title: 'Total Target Isian', value: data.isians.total, icon: <CheckSquare size={24} />, color: 'bg-slate-700' },
    { title: 'Menunggu Review', value: data.isians.proses, icon: <Clock size={24} />, color: 'bg-amber-500' },
    { title: 'Valid (Disetujui)', value: data.isians.valid, icon: <CheckCircle size={24} />, color: 'bg-emerald-500' },
    { title: 'Perlu Revisi', value: data.isians.revisi, icon: <AlertCircle size={24} />, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Dosen</h1>
        <p className="text-slate-500 text-sm mt-1">Selamat datang di Sistem Audit Mutu Internal</p>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
           <FileText size={160} />
        </div>
        <div className="relative z-10">
          <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-3 backdrop-blur-sm">
            Periode Aktif
          </div>
          <h2 className="text-xl font-bold mb-1">{data.periode_aktif}</h2>
          <p className="text-indigo-100 mb-6">{data.instrumen_aktif}</p>
          
          <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm max-w-xl">
             <div className="flex justify-between text-sm font-medium mb-2">
                <span>Progress Pengisian Anda</span>
                <span>{data.progress}%</span>
             </div>
             <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${data.progress}%` }}></div>
             </div>
             <p className="text-xs text-indigo-200 mt-2">
               Anda telah mengisi {data.isians.proses + data.isians.valid + data.isians.revisi} dari {data.isians.total} unsur yang ditugaskan.
             </p>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Action Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
         <h3 className="text-lg font-bold text-slate-800 mb-4">Tindakan Diperlukan</h3>
         
         {data.isians.revisi > 0 ? (
           <div className="flex items-start gap-4 p-4 rounded-lg bg-rose-50 border border-rose-100">
             <div className="p-2 bg-rose-100 rounded-full text-rose-600 shrink-0">
               <AlertCircle size={20} />
             </div>
             <div>
               <h4 className="text-sm font-bold text-rose-800">Ada {data.isians.revisi} isian yang perlu direvisi</h4>
               <p className="text-sm text-rose-600 mt-1">Kaprodi telah memberikan catatan pada isian Anda. Mohon segera diperbaiki.</p>
               <button className="mt-3 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors">
                 Lihat Revisi
               </button>
             </div>
           </div>
         ) : data.progress < 100 ? (
           <div className="flex items-start gap-4 p-4 rounded-lg bg-amber-50 border border-amber-100">
             <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
               <Clock size={20} />
             </div>
             <div>
               <h4 className="text-sm font-bold text-amber-800">Pengisian belum selesai</h4>
               <p className="text-sm text-amber-600 mt-1">Ada {data.isians.total - (data.isians.proses + data.isians.valid + data.isians.revisi)} unsur yang belum Anda isi. Silakan lengkapi sebelum batas waktu berakhir.</p>
               <button className="mt-3 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors">
                 Lanjutkan Pengisian
               </button>
             </div>
           </div>
         ) : (
           <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
             <div className="p-2 bg-emerald-100 rounded-full text-emerald-600 shrink-0">
               <CheckCircle size={20} />
             </div>
             <div>
               <h4 className="text-sm font-bold text-emerald-800">Terima kasih!</h4>
               <p className="text-sm text-emerald-600 mt-1">Semua isian telah Anda selesaikan. Menunggu review dari Kaprodi untuk isian yang berstatus proses.</p>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}
