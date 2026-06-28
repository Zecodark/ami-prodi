'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import Swal from 'sweetalert2';

interface PeriodeData {
  id: string;
  tahun: string;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  is_active: boolean;
}

export default function PeriodePage() {
  const [periodes, setPeriodes] = useState<PeriodeData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ tahun: '', tanggal_mulai: '', tanggal_selesai: '', is_active: false });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ami_token');
      const res = await fetch('/api/periodes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data) setPeriodes(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({ tahun: '', tanggal_mulai: '', tanggal_selesai: '', is_active: false });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (periode: PeriodeData) => {
    setEditId(periode.id);
    setFormData({ 
      tahun: periode.tahun, 
      tanggal_mulai: periode.tanggal_mulai ? new Date(periode.tanggal_mulai).toISOString().split('T')[0] : '', 
      tanggal_selesai: periode.tanggal_selesai ? new Date(periode.tanggal_selesai).toISOString().split('T')[0] : '',
      is_active: periode.is_active
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, tahun: string) => {
    const result = await Swal.fire({
      title: 'Hapus Periode?',
      text: `Hapus periode ${tahun}? Data instrumen/isian terkait mungkin terpengaruh.`,
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
      const res = await fetch(`/api/periodes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        Swal.fire({ title: 'Berhasil', text: 'Periode dihapus', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        const data = await res.json();
        Swal.fire({ title: 'Gagal', text: data.message || 'Gagal menghapus periode', icon: 'error' });
      }
    } catch (e) {
      Swal.fire({ title: 'Error', text: 'Terjadi kesalahan server', icon: 'error' });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, tahun: string) => {
    const action = currentStatus ? 'Nonaktifkan' : 'Aktifkan';
    const message = `Yakin ingin ${action.toLowerCase()} periode ${tahun}?`;
    
    const result = await Swal.fire({
      title: 'Konfirmasi Status',
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Ubah',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-xl' }
    });
    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('ami_token');
      const res = await fetch(`/api/periodes/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) {
        fetchData();
        Swal.fire({ title: 'Berhasil', text: `Status periode diubah menjadi ${currentStatus ? 'Nonaktif' : 'Aktif'}`, icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        const data = await res.json();
        Swal.fire({ title: 'Gagal', text: data.message || 'Gagal mengubah status', icon: 'error' });
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
      const url = editId ? `/api/periodes/${editId}` : '/api/periodes';

      const payload = {
        ...formData,
        tanggal_mulai: formData.tanggal_mulai || null,
        tanggal_selesai: formData.tanggal_selesai || null,
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
        Swal.fire({
          title: 'Berhasil',
          text: editId ? 'Periode berhasil diperbarui' : 'Periode berhasil ditambahkan',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        setErrorMsg(data.message || 'Terjadi kesalahan');
      }
    } catch (e) {
      setErrorMsg('Kesalahan jaringan');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kelola Periode AMI</h1>
          <p className="text-slate-500 text-sm mt-1">Manajemen waktu pelaksanaan audit mutu internal</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          Tambah Periode
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="py-3 px-4">Tahun/Semester</th>
                <th className="py-3 px-4">Tanggal Mulai</th>
                <th className="py-3 px-4">Tanggal Selesai</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Memuat...</td></tr>
              ) : periodes.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Tidak ada data periode</td></tr>
              ) : (
                periodes.map((p) => (
                  <tr key={p.id} className={`transition-colors ${p.is_active ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                    <td className="py-3 px-4 font-bold text-slate-800">{p.tahun}</td>
                    <td className="py-3 px-4 text-slate-600">{p.tanggal_mulai ? new Date(p.tanggal_mulai).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{p.tanggal_selesai ? new Date(p.tanggal_selesai).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleActive(p.id, p.is_active, p.tahun)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${p.is_active ? 'bg-indigo-600' : 'bg-slate-300'}`}
                          title={p.is_active ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${p.is_active ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                        </button>
                        <span className={`text-xs font-semibold ${p.is_active ? 'text-indigo-700' : 'text-slate-400'}`}>
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(p.id, p.tahun)} disabled={p.is_active} className={`p-1.5 rounded transition-colors ${p.is_active ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`} title={p.is_active ? "Tidak bisa menghapus periode aktif" : "Hapus"}>
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
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex gap-3 items-start">
         <AlertCircle size={20} className="shrink-0 text-amber-600" />
         <div>
           <strong>Catatan Penting:</strong> Hanya satu periode yang bisa aktif dalam satu waktu. Mengaktifkan periode baru otomatis akan menonaktifkan periode yang sedang aktif. Dosen hanya bisa mengisi instrumen pada periode yang aktif.
         </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">{editId ? 'Edit Periode' : 'Tambah Periode Baru'}</h3>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tahun / Semester</label>
                  <input 
                    type="text" 
                    required
                    value={formData.tahun}
                    onChange={(e) => setFormData({...formData, tahun: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="Contoh: 2024/2025 Genap"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
                    <input 
                      type="date" 
                      value={formData.tanggal_mulai}
                      onChange={(e) => setFormData({...formData, tanggal_mulai: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Selesai</label>
                    <input 
                      type="date" 
                      value={formData.tanggal_selesai}
                      onChange={(e) => setFormData({...formData, tanggal_selesai: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>
                </div>
                {!editId && (
                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Langsung jadikan periode aktif</span>
                  </label>
                )}
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
