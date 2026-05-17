'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, Edit2, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface IsianData {
  id: string;
  pemeriksaan_unsur: {
    isi_unsur: string;
    deskripsi_area: {
      deskripsi_area_audit: string;
      kode_ami: {
        kode_ami: string;
        kriteria: {
          kode_kriteria: string;
          nama_kriteria: string;
          instrumen: {
            nama_instrumen: string;
          };
        };
      };
    };
  };
  periode: { tahun: string };
  judul_dokumen: string;
  status: 'proses' | 'valid' | 'revisi';
  submitted_at: string;
  catatan_kaprodi: string | null;
}

export default function RiwayatIsianPage() {
  const [isians, setIsians] = useState<IsianData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    fetchIsians();
  }, []);

  const fetchIsians = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ami_token');
      const res = await fetch('/api/isians', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data) {
        setIsians(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'proses':
        return { bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock, label: 'Menunggu Review' };
      case 'valid':
        return { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: CheckCircle, label: 'Valid' };
      case 'revisi':
        return { bg: 'bg-rose-100', text: 'text-rose-800', icon: AlertCircle, label: 'Perlu Revisi' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-800', icon: Clock, label: status };
    }
  };

  const filteredIsians = isians.filter(i => {
    const matchSearch = i.judul_dokumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        i.pemeriksaan_unsur.isi_unsur.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus ? i.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Riwayat Isian</h1>
        <p className="text-slate-500 text-sm mt-1">Lihat semua isian AMI yang telah Anda kirimkan</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Cari judul dokumen atau unsur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-indigo-500 min-w-[150px]"
          >
            <option value="">Semua Status</option>
            <option value="proses">Menunggu Review</option>
            <option value="valid">Valid</option>
            <option value="revisi">Perlu Revisi</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="py-3 px-4">Instrumen</th>
                <th className="py-3 px-4">Dokumen</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tanggal Kirim</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Memuat...</td></tr>
              ) : filteredIsians.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Tidak ada data isian</td></tr>
              ) : (
                filteredIsians.map((isian) => {
                  const statusInfo = getStatusBadge(isian.status);
                  const Icon = statusInfo.icon;
                  return (
                    <tr key={isian.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-800">{isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.instrumen.nama_instrumen}</p>
                          <p className="text-xs text-slate-500">{isian.periode.tahun}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-800">{isian.judul_dokumen || '-'}</p>
                          <p className="text-xs text-slate-500 max-w-xs truncate">{isian.pemeriksaan_unsur.isi_unsur}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                          <Icon size={12} /> {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm">
                        {isian.submitted_at ? new Date(isian.submitted_at).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setDetailId(isian.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye size={16} />
                          </button>
                          {isian.status === 'revisi' && (
                            <button 
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800">Detail Isian</h3>
              <button 
                onClick={() => setDetailId(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {isians.find(i => i.id === detailId) && (() => {
                const isian = isians.find(i => i.id === detailId)!;
                const statusInfo = getStatusBadge(isian.status);
                return (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase">Instrumen</label>
                        <p className="text-slate-800 font-medium mt-1">{isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.instrumen.nama_instrumen}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase">Periode</label>
                        <p className="text-slate-800 font-medium mt-1">{isian.periode.tahun}</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase">Kriteria</label>
                        <p className="text-slate-800 font-medium mt-1">
                          [{isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.kode_kriteria}] {isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.nama_kriteria}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase">Kode AMI</label>
                        <p className="text-slate-800 font-medium mt-1">{isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kode_ami}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase">Deskripsi Area Audit</label>
                      <p className="text-slate-800 mt-1">{isian.pemeriksaan_unsur.deskripsi_area.deskripsi_area_audit}</p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase">Pemeriksaan Unsur</label>
                      <p className="text-slate-800 mt-1">{isian.pemeriksaan_unsur.isi_unsur}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Status</label>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                        <statusInfo.icon size={12} /> {statusInfo.label}
                      </span>
                    </div>

                    {isian.catatan_kaprodi && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                        <label className="text-xs font-medium text-rose-600 uppercase block mb-1">Catatan Kaprodi</label>
                        <p className="text-slate-800 text-sm">{isian.catatan_kaprodi}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                      <button 
                        onClick={() => setDetailId(null)}
                        className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
                      >
                        Tutup
                      </button>
                      {isian.status === 'revisi' && (
                        <button 
                          onClick={() => setDetailId(null)}
                          className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                        >
                          Perbaiki Isian
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
