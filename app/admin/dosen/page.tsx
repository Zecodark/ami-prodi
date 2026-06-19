'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { formatNamaDosen } from '@/app/lib/textUtils';

interface DosenData {
  id: string;
  nip: string;
  nama_lengkap: string;
  status_kepegawaian: string;
  no_hp: string | null;
  alamat: string | null;
  is_active: boolean;
  prodi: { id: string; nama_prodi: string } | null;
  user: { id: string; email: string } | null;
}

interface ProdiData {
  id: string;
  nama_prodi: string;
}

interface UserData {
  id: string;
  email: string;
}

export default function DosenPage() {
  const [dosens, setDosens] = useState<DosenData[]>([]);
  const [prodis, setProdis] = useState<ProdiData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProdi, setFilterProdi] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    nip: '', nama_lengkap: '', status_kepegawaian: 'PNS', no_hp: '', alamat: '', prodi_id: '', user_id: '', is_active: true 
  });
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
      
      const [resDosens, resProdis, resUsers] = await Promise.all([
        fetch('/api/dosens', { headers }),
        fetch('/api/prodis', { headers }),
        fetch('/api/users', { headers })
      ]);
      
      const dataDosens = await resDosens.json();
      const dataProdis = await resProdis.json();
      const dataUsers = await resUsers.json();
      
      if (dataDosens.data) setDosens(dataDosens.data);
      if (dataProdis.data) setProdis(dataProdis.data);
      if (dataUsers.data) {
        // Filter users who might be dosen
        setUsers(dataUsers.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({ nip: '', nama_lengkap: '', status_kepegawaian: 'PNS', no_hp: '', alamat: '', prodi_id: '', user_id: '', is_active: true });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (dosen: DosenData) => {
    setEditId(dosen.id);
    setFormData({ 
      nip: dosen.nip, 
      nama_lengkap: dosen.nama_lengkap, 
      status_kepegawaian: dosen.status_kepegawaian,
      no_hp: dosen.no_hp || '',
      alamat: dosen.alamat || '',
      prodi_id: dosen.prodi?.id || '',
      user_id: dosen.user?.id || '',
      is_active: dosen.is_active
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus dosen ${nama}? Isian AMI terkait mungkin akan terhapus atau bermasalah.`)) return;
    try {
      const token = localStorage.getItem('ami_token');
      const res = await fetch(`/api/dosens/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal menghapus dosen');
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
      const url = editId ? `/api/dosens/${editId}` : '/api/dosens';

      const payload = {
        ...formData,
        prodi_id: formData.prodi_id || null,
        user_id: formData.user_id || null,
        no_hp: formData.no_hp || null,
        alamat: formData.alamat || null,
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

  const filteredDosens = dosens.filter(d => {
    const matchSearch = d.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        d.nip.toLowerCase().includes(searchTerm.toLowerCase());
    const matchProdi = filterProdi ? d.prodi?.id?.toString() === filterProdi : true;
    return matchSearch && matchProdi;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kelola Dosen</h1>
          <p className="text-slate-500 text-sm mt-1">Manajemen data dosen sebagai pengisi instrumen AMI</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          Tambah Dosen
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Cari NIP atau Nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
          </div>
          <select 
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-indigo-500 min-w-[150px]"
          >
             <option value="">Semua Prodi</option>
             {prodis.map(p => (
               <option key={p.id} value={p.id}>{p.nama_prodi}</option>
             ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="py-3 px-4">NIP / Nama Dosen</th>
                <th className="py-3 px-4">Prodi</th>
                <th className="py-3 px-4">Status Pegawai</th>
                <th className="py-3 px-4">Akun Login</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">Memuat...</td></tr>
              ) : filteredDosens.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">Tidak ada data dosen</td></tr>
              ) : (
                filteredDosens.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                       <p className="font-bold text-slate-800">{formatNamaDosen(d.nama_lengkap)}</p>
                       <p className="text-xs text-slate-500">{d.nip}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{d.prodi?.nama_prodi || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{d.status_kepegawaian}</td>
                    <td className="py-3 px-4 text-slate-600">{d.user?.email || <span className="text-rose-500 text-xs italic">Belum ditautkan</span>}</td>
                    <td className="py-3 px-4">
                      {d.is_active ? (
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
                        <button onClick={() => openEditModal(d)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(d.id, d.nama_lengkap)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Hapus">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800">{editId ? 'Edit Dosen' : 'Tambah Dosen Baru'}</h3>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NIP</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nip}
                    onChange={(e) => setFormData({...formData, nip: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap (dengan gelar)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Program Studi</label>
                  <select 
                    value={formData.prodi_id}
                    onChange={(e) => setFormData({...formData, prodi_id: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white"
                  >
                    <option value="">-- Pilih Prodi --</option>
                    {prodis.map(p => (
                      <option key={p.id} value={p.id}>{p.nama_prodi}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status Kepegawaian</label>
                  <select 
                    required
                    value={formData.status_kepegawaian}
                    onChange={(e) => setFormData({...formData, status_kepegawaian: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white"
                  >
                    <option value="PNS">PNS</option>
                    <option value="Non-PNS">Non-PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tautkan Akun Login (Opsional)</label>
                  <select 
                    value={formData.user_id}
                    onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white"
                  >
                    <option value="">-- Tidak Ditautkan --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.email}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Dosen memerlukan akun login untuk bisa mengisi AMI.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">No. HP (Opsional)</label>
                  <input 
                    type="text" 
                    value={formData.no_hp}
                    onChange={(e) => setFormData({...formData, no_hp: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                 <label className="block text-sm font-medium text-slate-700 mb-1">Alamat (Opsional)</label>
                 <textarea 
                   value={formData.alamat}
                   onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                   className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm min-h-[60px]"
                 />
              </div>

              <label className="flex items-center gap-2 mt-4 cursor-pointer w-max">
                <input 
                  type="checkbox" 
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Dosen Aktif</span>
              </label>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200">
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
