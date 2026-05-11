'use client';

import { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, Clock, Users } from 'lucide-react';

interface SummaryData {
  periode_aktif: string;
  instrumen_aktif: string;
  dosen_count: number;
  isians: {
    masuk: number;
    proses: number;
    valid: number;
    revisi: number;
  };
}

export default function KaprodiDashboard() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setData({
          periode_aktif: 'Tahun 2024/2025 Genap',
          instrumen_aktif: 'Instrumen AMI D3 Teknik Informatika',
          dosen_count: 5,
          isians: {
            masuk: 45, // Total yang di submit dosen (proses+valid+revisi)
            proses: 12,
            valid: 28,
            revisi: 5
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
    { title: 'Total Isian Masuk', value: data.isians.masuk, icon: <FileText size={24} />, color: 'bg-indigo-500' },
    { title: 'Menunggu Review', value: data.isians.proses, icon: <Clock size={24} />, color: 'bg-amber-500' },
    { title: 'Valid (Disetujui)', value: data.isians.valid, icon: <CheckCircle size={24} />, color: 'bg-emerald-500' },
    { title: 'Revisi', value: data.isians.revisi, icon: <AlertCircle size={24} />, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Kaprodi</h1>
          <p className="text-slate-500 text-sm mt-1">Approval & Review Audit Mutu Internal Prodi</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg px-4 py-2 flex items-center gap-2">
           <Users size={18} className="text-indigo-600" />
           <span className="text-sm font-medium text-slate-700">{data.dosen_count} Dosen di Prodi Anda</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Action Priority */}
         <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
             <Clock size={20} className="text-amber-500" /> Prioritas Review
           </h3>
           
           {data.isians.proses > 0 ? (
             <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Terdapat <strong className="text-amber-600">{data.isians.proses} isian</strong> yang menunggu review Anda.
                </p>
                
                {/* Dummy List */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                   <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center text-sm font-medium text-slate-700">
                      <span>Ahmad Rizky</span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Kriteria 1</span>
                   </div>
                   <div className="p-4 bg-white">
                      <p className="text-sm font-medium text-slate-800">C.1.4.2 Visi Misi - A. Dokumen Rencana Strategis</p>
                      <p className="text-xs text-slate-500 mt-1">Disubmit: 2 jam yang lalu</p>
                      <button className="mt-3 text-sm text-indigo-600 font-medium hover:underline">Review Sekarang &rarr;</button>
                   </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                   <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center text-sm font-medium text-slate-700">
                      <span>Budi Santoso</span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Kriteria 2</span>
                   </div>
                   <div className="p-4 bg-white">
                      <p className="text-sm font-medium text-slate-800">C.2.4 Tata Kelola - SOP Perwalian</p>
                      <p className="text-xs text-slate-500 mt-1">Disubmit: 5 jam yang lalu</p>
                      <button className="mt-3 text-sm text-indigo-600 font-medium hover:underline">Review Sekarang &rarr;</button>
                   </div>
                </div>
             </div>
           ) : (
             <div className="text-center py-8">
               <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-3">
                 <CheckCircle size={24} />
               </div>
               <p className="text-slate-600 text-sm">Tidak ada isian yang menunggu review saat ini.</p>
             </div>
           )}
         </div>

         {/* Chart/Summary Sidebar */}
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Statistik Isian</h3>
            
            <div className="relative w-48 h-48 mx-auto mb-6">
               {/* Simple CSS Donut Chart representation */}
               <div className="w-full h-full rounded-full border-[16px] border-emerald-500"></div>
               <div className="absolute inset-0 rounded-full border-[16px] border-amber-500" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 50% 100%)' }}></div>
               <div className="absolute inset-0 rounded-full border-[16px] border-rose-500" style={{ clipPath: 'polygon(50% 50%, 100% 100%, 0 100%, 0 80%)' }}></div>
               <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-slate-800">{data.isians.masuk}</span>
                  <span className="text-xs text-slate-500">Total</span>
               </div>
            </div>

            <div className="space-y-3">
               <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                     <span className="text-slate-600">Valid</span>
                  </div>
                  <span className="font-medium text-slate-800">{data.isians.valid} ({(data.isians.valid/data.isians.masuk*100).toFixed(0)}%)</span>
               </div>
               <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                     <span className="text-slate-600">Proses</span>
                  </div>
                  <span className="font-medium text-slate-800">{data.isians.proses} ({(data.isians.proses/data.isians.masuk*100).toFixed(0)}%)</span>
               </div>
               <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                     <span className="text-slate-600">Revisi</span>
                  </div>
                  <span className="font-medium text-slate-800">{data.isians.revisi} ({(data.isians.revisi/data.isians.masuk*100).toFixed(0)}%)</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
