'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, Edit2, Clock, CheckCircle, AlertCircle, File, FileText, ExternalLink, Download, Save, History, XCircle } from 'lucide-react';
import { formatNamaDosen } from '@/app/lib/textUtils';

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
  status: 'proses' | 'valid' | 'revisi' | 'superseded';
  submitted_at: string;
  catatan_kaprodi: string | null;
}

interface BuktiFile {
  id: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  judul_dokumen: string | null;
  keterangan_dokumen?: string | null;
  tahun_dokumen?: string | null;
}

interface IsianDetail {
  id: string;
  urutan_isian?: number;
  judul_dokumen: string;
  ketersediaan_standar?: string;
  dokumen?: string;
  pencapaian_standar_spt_pt?: boolean;
  pencapaian_standar_sn_dikti?: boolean;
  daya_saing_lokal?: boolean;
  daya_saing_nasional?: boolean;
  daya_saing_internasional?: boolean;
  bukti_link?: string | null;
  tahun_pelaksanaan?: string | null;
  capaian?: string | null;
  keterangan?: string | null;
  status: 'proses' | 'valid' | 'revisi' | 'superseded';
  catatan_kaprodi?: string | null;
  submitted_at?: string;
  reviewed_at?: string | null;
  dosen?: { nama_lengkap: string; nip: string };
  prodi?: { nama_prodi: string; jenjang: string };
  bukti_files?: BuktiFile[];
  pemeriksaan_unsur?: {
    id?: number;
    isi_unsur?: string;
    deskripsi_area?: {
      deskripsi_area_audit?: string;
      kode_ami?: {
        kode_ami?: string;
        kriteria?: { nama_kriteria?: string; kode_kriteria?: string };
      };
    };
  };
  review_logs?: Array<{
    id: string;
    status_sebelum: string;
    status_sesudah: string;
    catatan: string | null;
    created_at: string;
  }>;
}

export default function RiwayatIsianPage() {
  const [isians, setIsians] = useState<IsianData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<IsianDetail | null>(null);
  const [showHistory, setShowHistory] = useState(false);

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

  useEffect(() => {
    if (!detailId) {
      setDetailData(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('ami_token');
        const res = await fetch(`/api/isians/${detailId}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setDetailData(data.data || null);
      } catch (e) {
        console.error(e);
      }
    };

    fetchDetail();
  }, [detailId]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'proses':
        return { bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock, label: 'Menunggu Review' };
      case 'valid':
        return { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: CheckCircle, label: 'Valid' };
      case 'revisi':
        return { bg: 'bg-rose-100', text: 'text-rose-800', icon: AlertCircle, label: 'Perlu Revisi' };
      case 'superseded':
        return { bg: 'bg-slate-100', text: 'text-slate-600', icon: XCircle, label: 'Digantikan' };
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
            <option value="superseded">Digantikan</option>
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
              {detailData ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                      <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                        Informasi Pengisi
                      </h4>
                      <div className="grid grid-cols-2 gap-6 text-sm">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Dosen</p>
                          <p className="font-bold text-gray-900">{formatNamaDosen(detailData.dosen?.nama_lengkap)}</p>
                          <p className="text-xs text-gray-500 font-mono mt-1">{detailData.dosen?.nip || ''}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Program Studi</p>
                          <p className="font-bold text-gray-900">{detailData.prodi?.nama_prodi || '-'}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 mt-1.5 border border-blue-100">
                            {detailData.prodi?.jenjang || ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                      <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                        Detail Dokumen
                      </h4>
                      <div className="space-y-5 text-sm">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Judul Dokumen</p>
                          <p className="font-medium text-gray-900 leading-relaxed">{detailData.judul_dokumen || '-'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                            <p className="text-xs font-medium text-gray-500 mb-1">Ketersediaan Standar</p>
                            <p className="font-semibold text-gray-900 capitalize">{detailData.ketersediaan_standar || '-'}</p>
                          </div>
                          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                            <p className="text-xs font-medium text-gray-500 mb-1">Dokumen</p>
                            <p className="font-semibold text-gray-900 capitalize">{detailData.dokumen || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                      <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
                        Pencapaian & Keterangan
                      </h4>
                      <div className="space-y-6 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`flex items-center gap-3 p-3 rounded-lg border ${detailData.pencapaian_standar_spt_pt ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            {detailData.pencapaian_standar_spt_pt ? <CheckCircle size={20} className="text-green-600"/> : <XCircle size={20} className="text-red-500" />}
                            <span className={`font-semibold ${detailData.pencapaian_standar_spt_pt ? 'text-green-800' : 'text-red-800'}`}>Standar SPT PT</span>
                          </div>
                          <div className={`flex items-center gap-3 p-3 rounded-lg border ${detailData.pencapaian_standar_sn_dikti ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            {detailData.pencapaian_standar_sn_dikti ? <CheckCircle size={20} className="text-green-600"/> : <XCircle size={20} className="text-red-500" />}
                            <span className={`font-semibold ${detailData.pencapaian_standar_sn_dikti ? 'text-green-800' : 'text-red-800'}`}>Standar SN Dikti</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Daya Saing</p>
                          <div className="flex flex-wrap gap-3">
                            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-sm ${detailData.daya_saing_lokal ? 'bg-green-50 border-green-300 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                              {detailData.daya_saing_lokal ? <CheckCircle size={16} /> : <XCircle size={16} />} Lokal
                            </div>
                            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-sm ${detailData.daya_saing_nasional ? 'bg-green-50 border-green-300 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                              {detailData.daya_saing_nasional ? <CheckCircle size={16} /> : <XCircle size={16} />} Nasional
                            </div>
                            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-sm ${detailData.daya_saing_internasional ? 'bg-green-50 border-green-300 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                              {detailData.daya_saing_internasional ? <CheckCircle size={16} /> : <XCircle size={16} />} Internasional
                            </div>
                          </div>
                        </div>

                        {detailData.keterangan && (
                          <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-4 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300"></div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Keterangan Tambahan</p>
                            <p className="text-slate-800 text-sm leading-relaxed">{detailData.keterangan}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                      <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                        Bukti Fisik
                      </h4>
                      <div className="space-y-3">
                        {detailData.bukti_link && (
                          <a href={detailData.bukti_link} target="_blank" rel="noreferrer" className="group flex items-center gap-3 p-3.5 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                              <ExternalLink size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-blue-800 truncate mb-0.5">Tautan Eksternal</p>
                              <p className="text-xs text-blue-500 truncate">{detailData.bukti_link}</p>
                            </div>
                          </a>
                        )}

                        {detailData.bukti_files && detailData.bukti_files.length > 0 ? (
                          <div className="space-y-4">
                            {detailData.bukti_files.map((file) => (
                              <div key={file.id} className="group flex flex-col p-4 bg-white border border-slate-200 rounded-xl">
                                <div className="flex items-start justify-between gap-3 relative z-10">
                                  <div className="flex items-start gap-3 overflow-hidden">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                                      <FileText size={24} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-slate-800 truncate leading-tight mb-1">{file.judul_dokumen || file.original_name}</p>
                                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{(file.file_size/1024).toFixed(2)} KB</span>
                                        {file.tahun_dokumen && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">Tahun: {file.tahun_dokumen}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <a href={`/api/files/${file.id}`} download={file.original_name} className="p-2.5 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200">
                                    <Download size={20} />
                                  </a>
                                </div>
                                {file.keterangan_dokumen && (
                                  <div className="mt-3 pt-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">{file.keterangan_dokumen}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          !detailData.bukti_link && (
                            <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                              <File className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                              <p className="text-sm text-slate-600 font-bold mb-1">Tidak ada file bukti</p>
                              <p className="text-xs text-slate-400">Dosen tidak melampirkan file dokumen</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-blue-100 shadow-md overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-blue-100 flex justify-between items-center">
                        <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2.5">
                          <Save size={18} className="text-blue-600" />
                          Tindakan Kaprodi
                        </h4>
                        <button onClick={() => setShowHistory(!showHistory)} className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 rounded-md border border-blue-100">
                          <History size={14} /> Riwayat
                        </button>
                      </div>

                      <div className="p-6 space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-800 mb-3">Status Verifikasi</label>
                          <div className="flex gap-4">
                            <label className={`relative flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 ${detailData.status === 'valid' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                              <input type="radio" name="status" value="valid" checked={detailData.status === 'valid'} readOnly disabled className="sr-only" />
                              <CheckCircle size={28} className={detailData.status === 'valid' ? 'text-green-600' : 'text-slate-400'} />
                              <span className="font-bold text-sm">Valid</span>
                            </label>
                            <label className={`relative flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 ${detailData.status === 'revisi' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                              <input type="radio" name="status" value="revisi" checked={detailData.status === 'revisi'} readOnly disabled className="sr-only" />
                              <AlertCircle size={28} className={detailData.status === 'revisi' ? 'text-orange-600' : 'text-slate-400'} />
                              <span className="font-bold text-sm">Revisi</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-800 mb-2">Catatan Kaprodi</label>
                          <textarea value={detailData.catatan_kaprodi || ''} readOnly className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-lg text-sm" rows={4} />
                        </div>

                        <button disabled className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-blue-400 opacity-50 cursor-not-allowed">
                          <Save size={20} />
                          Simpan Verifikasi
                        </button>
                      </div>
                    </div>

                    {showHistory && (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
                        <div className="bg-slate-50 px-5 py-4 border-b flex justify-between items-center">
                          <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2.5">
                            <History size={18} className="text-slate-500" /> Riwayat Perubahan
                          </h5>
                          <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md">×</button>
                        </div>
                        <div className="p-5">
                          {detailData.review_logs && detailData.review_logs.length > 0 ? (
                            <div className="space-y-5">
                              {detailData.review_logs.map((log) => (
                                <div key={log.id} className="p-4 rounded-xl border border-slate-100 bg-white text-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="font-bold text-slate-900">{log.status_sebelum} → <span className={log.status_sesudah === 'valid' ? 'text-green-700' : 'text-orange-700'}>{log.status_sesudah}</span></div>
                                    <time className="font-mono text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString('id-ID')}</time>
                                  </div>
                                  <div className="mt-2 text-xs text-slate-700 p-3 bg-slate-50 rounded-lg">{log.catatan || <em className="text-slate-400">Tidak ada catatan</em>}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                                <History className="h-8 w-8 text-slate-300" />
                              </div>
                              <p className="text-sm font-bold text-slate-600">Belum Ada Riwayat</p>
                              <p className="text-xs text-slate-400 mt-1">Dokumen ini belum pernah diverifikasi sebelumnya.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">Memuat detail...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
