'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, AlertCircle, X } from 'lucide-react';

interface ProdiData {
  id: string;
  nama_prodi: string;
  jenjang: string | null;
  jurusan: { id: string, nama_jurusan: string } | null;
  _count?: { dosens: number };
}

interface JurusanData {
  id: string;
  nama_jurusan: string;
}

export default function ProdiPage() {
  const [prodis, setProdis] = useState<ProdiData[]>([]);
  const [jurusans, setJurusans] = useState<JurusanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nama_prodi: '', jenjang: '', jurusan_id: '' });
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
      
      const [resProdi, resJurusan] = await Promise.all([
        fetch('/api/prodis', { headers }),
        fetch('/api/jurusans', { headers })
      ]);
      
      const dataProdi = await resProdi.json();
      const dataJurusan = await resJurusan.json();
      
      if (dataProdi.data) setProdis(dataProdi.data);
      if (dataJurusan.data) setJurusans(dataJurusan.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({ nama_prodi: '', jenjang: '', jurusan_id: '' });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (prodi: ProdiData) => {
    setEditId(prodi.id);
    setFormData({ 
      nama_prodi: prodi.nama_prodi, 
      jenjang: prodi.jenjang || '', 
      jurusan_id: prodi.jurusan?.id || '' 
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus prodi ${nama}? Data dosen terkait mungkin terpengaruh.`)) return;
    try {
      const token = localStorage.getItem('ami_token');
      const res = await fetch(`/api/prodis/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal menghapus prodi');
      }
    } catch (e) {
      alert('Terjadi kesalahan server');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitLoading(true);

    try {
      const token = localStorage.getItem('ami_token');
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/prodis/${editId}` : '/api/prodis';

      const payload = {
        nama_prodi: formData.nama_prodi,
        jenjang: formData.jenjang || null,
        jurusan_id: formData.jurusan_id || null
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

  const filteredProdis = prodis.filter(p => {
    const matchSearch = p.nama_prodi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJurusan = filterJurusan ? p.jurusan?.id?.toString() === filterJurusan : true;
    return matchSearch && matchJurusan;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kelola Program Studi</h1>
          <p className="text-slate-500 text-sm mt-1">Manajemen data prodi di setiap jurusan</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          Tambah Prodi
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Cari prodi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
          </div>
          <select 
            value={filterJurusan}
            onChange={(e) => setFilterJurusan(e.target.value)}
            className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-indigo-500"
          >
             <option value="">Semua Jurusan</option>
             {jurusans.map(j => (
               <option key={j.id} value={j.id}>{j.nama_jurusan}</option>
             ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="py-3 px-4">Nama Prodi</th>
                <th className="py-3 px-4">Jenjang</th>
                <th className="py-3 px-4">Jurusan</th>
                <th className="py-3 px-4">Total Dosen</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Memuat...</td></tr>
              ) : filteredProdis.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Tidak ada data prodi</td></tr>
              ) : (
                filteredProdis.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">{p.nama_prodi}</td>
                    <td className="py-3 px-4">
                      <span className="bg-indigo-50 text-indigo-700 py-1 px-2 rounded font-medium text-xs border border-indigo-100">
                        {p.jenjang || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.jurusan?.nama_jurusan || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{p._count?.dosens || 0}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(p.id, p.nama_prodi)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Hapus">
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
              <h3 className="text-lg font-bold text-slate-800">{editId ? 'Edit Prodi' : 'Tambah Prodi Baru'}</h3>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Program Studi</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nama_prodi}
                    onChange={(e) => setFormData({...formData, nama_prodi: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="Contoh: Teknologi Rekayasa Perangkat Lunak"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jenjang</label>
                  <input 
                    type="text" 
                    value={formData.jenjang}
                    onChange={(e) => setFormData({...formData, jenjang: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="Contoh: D4/STr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jurusan (Opsional)</label>
                  <select 
                    value={formData.jurusan_id}
                    onChange={(e) => setFormData({...formData, jurusan_id: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white"
                  >
                    <option value="">-- Pilih Jurusan --</option>
                    {jurusans.map(j => (
                      <option key={j.id} value={j.id}>{j.nama_jurusan}</option>
                    ))}
                  </select>
                </div>
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
