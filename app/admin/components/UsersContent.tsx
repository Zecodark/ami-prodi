'use client';

import { useEffect, useState } from 'react';

export default function UsersContent({ token }: { token: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({ id: '', email: '', password: '', role_id: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setUsers(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const openModal = (mode: 'create' | 'edit', user?: any) => {
    setModalMode(mode);
    if (mode === 'edit' && user) {
      setFormData({
        id: user.id,
        email: user.email,
        password: '',
        role_id: user.role?.id?.toString() || '',
      });
    } else {
      setFormData({ id: '', email: '', password: '', role_id: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ id: '', email: '', password: '', role_id: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: any = { email: formData.email };
    if (formData.password) payload.password = formData.password;
    if (formData.role_id) payload.role_id = parseInt(formData.role_id);

    const url = modalMode === 'create' ? '/api/users' : `/api/users/${formData.id}`;
    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) {
        alert(result.message || 'Berhasil disimpan');
        closeModal();
        fetchUsers();
      } else {
        alert(result.message || 'Terjadi kesalahan');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan pada server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;
    
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        alert(result.message || 'Berhasil dihapus');
        fetchUsers();
      } else {
        alert(result.message || 'Gagal menghapus');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-xl font-semibold text-slate-800 m-0">Manajemen Pengguna</h3>
          <p className="text-slate-500 text-sm mt-1">Kelola data Dosen, Kaprodi, dan Admin (Add, Edit, Delete, Reset Password).</p>
        </div>
        <button 
          onClick={() => openModal('create')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
        >
          ➕ Tambah Pengguna
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Memuat data pengguna...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Belum ada data pengguna</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Akun</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Dosen (Nama & NIP)</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Status</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Prodi</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white transition-colors border-b border-slate-200 last:border-0">
                  <td className="p-4 text-slate-700 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{u.email}</span>
                      <span className="text-xs text-slate-500 mt-0.5">{u.role?.nama_role || 'User'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-700 text-sm">
                    {u.dosen ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{u.dosen.nama_lengkap}</span>
                        <span className="text-xs text-slate-500 mt-0.5">{u.dosen.nip}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-700 text-sm">
                    {u.dosen?.status_kepegawaian ? (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-800 text-[11px] font-medium uppercase tracking-wider">
                        {u.dosen.status_kepegawaian}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-700 text-sm">
                    {u.dosen?.prodi?.nama_prodi ? (
                      <span className="text-slate-600">{u.dosen.prodi.nama_prodi}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-700 text-sm">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModal('edit', u)}
                        className="bg-transparent border-none text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded transition-colors text-sm cursor-pointer"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="bg-transparent border-none text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors text-sm cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {modalMode === 'create' ? 'Tambah Pengguna' : 'Edit Pengguna'}
            </h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-500">Email</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-500">
                  Password {modalMode === 'edit' && <span className="text-xs text-slate-400">(kosongkan jika tidak diubah)</span>}
                </label>
                <input 
                  type="password" 
                  required={modalMode === 'create'}
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-500">Role ID <span className="text-xs text-slate-400">(Opsional: 1=Admin, 2=Kaprodi, dll)</span></label>
                <input 
                  type="number" 
                  value={formData.role_id}
                  onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
