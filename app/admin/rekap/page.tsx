'use client';

import { useState } from 'react';
import { Search, Filter, Download, Eye, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function RekapPage() {
  const [activeTab, setActiveTab] = useState<'proses' | 'valid' | 'revisi'>('valid');

  // Dummy
  const dummyIsian = [
    { id: '1', dosen: 'Budi Santoso', prodi: 'D4 TRPL', instrumen: 'Instrumen AMI D3 & D4', kriteria: 'K1', unsur: 'SK Penetapan Visi Misi', status: 'valid', tanggal: '2025-05-10T08:30:00Z' },
    { id: '2', dosen: 'Budi Santoso', prodi: 'D4 TRPL', instrumen: 'Instrumen AMI D3 & D4', kriteria: 'K2', unsur: 'SOP Perwalian', status: 'proses', tanggal: '2025-05-11T09:15:00Z' },
    { id: '3', dosen: 'Siti Aminah', prodi: 'D3 Teknik Informatika', instrumen: 'Instrumen AMI D3 & D4', kriteria: 'K1', unsur: 'Renstra Prodi', status: 'revisi', tanggal: '2025-05-09T14:20:00Z' },
  ];

  const filtered = dummyIsian.filter(i => i.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rekap Isian AMI</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau seluruh isian AMI dari semua prodi (View Only)</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm">
          <Download size={16} />
          Export Rekap
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
           <div className="p-3 bg-amber-50 text-amber-600 rounded-full"><Clock size={20}/></div>
           <div>
              <p className="text-sm font-medium text-slate-500">Total Proses</p>
              <h4 className="text-2xl font-bold text-slate-800">8</h4>
           </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full"><CheckCircle size={20}/></div>
           <div>
              <p className="text-sm font-medium text-slate-500">Total Valid</p>
              <h4 className="text-2xl font-bold text-slate-800">12</h4>
           </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
           <div className="p-3 bg-rose-50 text-rose-600 rounded-full"><AlertCircle size={20}/></div>
           <div>
              <p className="text-sm font-medium text-slate-500">Total Revisi</p>
              <h4 className="text-2xl font-bold text-slate-800">4</h4>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Cari dosen, prodi, unsur..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
              />
            </div>
            <button className="p-1.5 border border-slate-300 bg-white rounded-lg text-slate-500 hover:text-slate-700" title="Filter Advanced">
               <Filter size={18} />
            </button>
          </div>
          
          <div className="flex bg-slate-200 p-1 rounded-lg">
             <button 
               onClick={() => setActiveTab('proses')}
               className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'proses' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-600 hover:text-slate-800'}`}
             >
               Proses
             </button>
             <button 
               onClick={() => setActiveTab('valid')}
               className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'valid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-600 hover:text-slate-800'}`}
             >
               Valid
             </button>
             <button 
               onClick={() => setActiveTab('revisi')}
               className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'revisi' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-600 hover:text-slate-800'}`}
             >
               Revisi
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="py-3 px-4">Dosen & Prodi</th>
                <th className="py-3 px-4">Kriteria / Unsur</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tgl Submit</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">Tidak ada isian dengan status ini</td>
                 </tr>
              ) : (
                filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                       <p className="font-bold text-slate-800">{i.dosen}</p>
                       <p className="text-xs text-slate-500">{i.prodi}</p>
                    </td>
                    <td className="py-3 px-4">
                       <p className="text-xs font-semibold text-indigo-600 mb-0.5">{i.kriteria}</p>
                       <p className="text-slate-700 max-w-md truncate" title={i.unsur}>{i.unsur}</p>
                    </td>
                    <td className="py-3 px-4">
                      {i.status === 'valid' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle size={12} /> Valid</span>}
                      {i.status === 'proses' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock size={12} /> Proses</span>}
                      {i.status === 'revisi' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><AlertCircle size={12} /> Revisi</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                       {new Date(i.tanggal).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-slate-200 transition-colors" title="Lihat Detail">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
