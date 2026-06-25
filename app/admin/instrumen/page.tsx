'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Check, X, Eye, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';

interface InstrumenData {
  id: string;
  nama_instrumen: string;
  deskripsi: string | null;
  is_active: boolean;
  periode: { id: string; tahun: string } | null;
  _count?: { kriteria_standars: number };
}

interface PeriodeData {
  id: string;
  tahun: string;
}

export default function InstrumenPage() {
  const [instrumens, setInstrumens] = useState<InstrumenData[]>([]);
  const [periodes, setPeriodes] = useState<PeriodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nama_instrumen: '', deskripsi: '', periode_id: '', is_active: true });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ami_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [resIns, resPer] = await Promise.all([
        fetch('/api/instrumens', { headers }),
        fetch('/api/periodes', { headers })
      ]);
      
      const dataIns = await resIns.json();
      const dataPer = await resPer.json();
      
      if (dataIns.data) setInstrumens(dataIns.data);
      if (dataPer.data) setPeriodes(dataPer.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({ nama_instrumen: '', deskripsi: '', periode_id: '', is_active: true });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (instrumen: InstrumenData) => {
    setEditId(instrumen.id);
    setFormData({ 
      nama_instrumen: instrumen.nama_instrumen, 
      deskripsi: instrumen.deskripsi || '', 
      periode_id: instrumen.periode?.id || '',
      is_active: instrumen.is_active
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, nama: string) => {
    const result = await Swal.fire({
      title: 'Hapus Instrumen?',
      text: `Hapus instrumen ${nama}? Seluruh kriteria dan unsur di dalamnya akan terhapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-xl' }
    });
    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('ami_token');
      const res = await fetch(`/api/instrumens/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        Swal.fire({ title: 'Berhasil', text: 'Instrumen dihapus', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        const data = await res.json();
        Swal.fire({ title: 'Gagal', text: data.message || 'Gagal menghapus instrumen', icon: 'error' });
      }
    } catch (e) {
      Swal.fire({ title: 'Error', text: 'Terjadi kesalahan server', icon: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitLoading(true);

    try {
      const token = localStorage.getItem('ami_token');
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/instrumens/${editId}` : '/api/instrumens';

      const payload = {
        ...formData,
        periode_id: formData.periode_id || null,
        deskripsi: formData.deskripsi || null
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        setErrorMsg(data.message || 'Terjadi kesalahan');
      }
    } catch (e) {
      setErrorMsg('Kesalahan jaringan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredInstrumens = instrumens.filter(i => 
    i.nama_instrumen.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kelola Instrumen AMI</h1>
          <p className="text-slate-500 text-sm mt-1">Master template instrumen audit per periode</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          Tambah Instrumen
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Cari instrumen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="py-3 px-4">Nama Instrumen & Deskripsi</th>
                <th className="py-3 px-4">Periode</th>
                <th className="py-3 px-4 text-center">Jml Kriteria</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Memuat...</td></tr>
              ) : filteredInstrumens.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Tidak ada data instrumen</td></tr>
              ) : (
                filteredInstrumens.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                       <p className="font-bold text-slate-800">{i.nama_instrumen}</p>
                       <p className="text-xs text-slate-500 mt-0.5 max-w-sm truncate">{i.deskripsi}</p>
                    </td>
                    <td className="py-3 px-4">
                       <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium">
                          {i.periode?.tahun || 'Tidak terikat'}
                       </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                       <span className="font-bold text-indigo-600">{i._count?.kriteria_standars || 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      {i.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <Check size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          <X size={12} /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          href={`/admin/struktur?instrumen_id=${i.id}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                        >
                          <Eye size={14} /> Lihat Struktur
                        </Link>
                        <button onClick={() => openEditModal(i)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(i.id, i.nama_instrumen)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">{editId ? 'Edit Instrumen' : 'Tambah Instrumen Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {errorMsg && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-600 text-sm">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Instrumen</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nama_instrumen}
                    onChange={(e) => setFormData({...formData, nama_instrumen: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="Contoh: Instrumen AMI D3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                  <textarea 
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm min-h-[80px]"
                    placeholder="Deskripsi opsional..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Periode (Opsional)</label>
                  <select 
                    value={formData.periode_id}
                    onChange={(e) => setFormData({...formData, periode_id: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white"
                  >
                    <option value="">-- Tidak Terikat --</option>
                    {periodes.map(p => (
                      <option key={p.id} value={p.id}>{p.tahun}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Instrumen Aktif</span>
                </label>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={submitLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-70">
                  {submitLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
