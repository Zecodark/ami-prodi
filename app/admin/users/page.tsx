'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Check, X, Shield, User, GraduationCap, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

interface UserData {
  id: string;
  email: string;
  is_active: boolean;
  last_login_at: string | null;
  role: { id: string; nama_role: string } | null;
  prodi_id: number | null;
  prodi?: { nama_prodi: string } | null;
  dosen: { nama_lengkap: string; prodi: { id?: number; nama_prodi: string } } | null;
}

interface ProdiData {
  id: number;
  nama_prodi: string;
  jenjang: string;
  dosens: { id: number; user_id: number | null }[];
}

interface RoleData {
  id: string;
  nama_role: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [prodis, setProdis] = useState<ProdiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', role_id: '', prodi_id: '', is_active: true });
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Global MFA State
  const [globalMfa, setGlobalMfa] = useState(true);
  const [mfaLoading, setMfaLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ami_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [resUsers, resRoles, resProdis, resSettings] = await Promise.all([
        fetch('/api/users', { headers }),
        fetch('/api/roles', { headers }),
        fetch('/api/prodis', { headers }),
        fetch('/api/settings', { headers })
      ]);
      
      const dataUsers = await resUsers.json();
      const dataRoles = await resRoles.json();
      const dataProdis = await resProdis.json();
      const dataSettings = await resSettings.json();
      
      if (dataSettings.data) setGlobalMfa(dataSettings.data.mfa_enabled !== false);
      
      if (dataUsers.data) setUsers(dataUsers.data);
      if (dataRoles.data) setRoles(dataRoles.data);
      if (dataProdis.data) setProdis(dataProdis.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({ email: '', password: '', role_id: '', prodi_id: '', is_active: true });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserData) => {
    setEditId(user.id);
    setFormData({ 
      email: user.email, 
      password: '', // blank so we don't update unless typed
      role_id: user.role?.id?.toString() || '',
      prodi_id: user.prodi_id?.toString() || '',
      is_active: user.is_active
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, email: string) => {
    const result = await Swal.fire({
      title: 'Hapus Pengguna?',
      text: `Hapus pengguna ${email}? Data terkait dosen mungkin akan terpengaruh.`,
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
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        Swal.fire({ title: 'Berhasil', text: 'Pengguna dihapus', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        const data = await res.json();
        Swal.fire({ title: 'Gagal', text: data.message || 'Gagal menghapus user', icon: 'error' });
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
      const url = editId ? `/api/users/${editId}` : '/api/users';

      // Validasi: setiap prodi hanya boleh punya 1 kaprodi
      const selectedRole = roles.find(r => r.id.toString() === formData.role_id?.toString());
      if (selectedRole?.nama_role.toLowerCase() === 'kaprodi' && formData.prodi_id) {
        const existingKaprodi = users.find(u => 
          u.role?.nama_role.toLowerCase() === 'kaprodi' && 
          (u.prodi_id === parseInt(formData.prodi_id) || u.dosen?.prodi?.id === parseInt(formData.prodi_id)) &&
          u.id !== editId // kecuali user yang sedang diedit
        );
        if (existingKaprodi) {
          const prodiName = prodis.find(p => p.id === parseInt(formData.prodi_id))?.nama_prodi || 'prodi ini';
          setErrorMsg(`Prodi ${prodiName} sudah memiliki Kaprodi (${existingKaprodi.dosen?.nama_lengkap || existingKaprodi.email}). Setiap prodi hanya boleh memiliki 1 Kaprodi.`);
          setSubmitLoading(false);
          return;
        }
      }

      const payload: any = {
        email: formData.email,
        role_id: formData.role_id || null,
        prodi_id: formData.prodi_id || null,
        is_active: formData.is_active
      };
      
      if (formData.password) {
        payload.password = formData.password;
      } else if (!editId) {
        setErrorMsg('Password wajib diisi untuk user baru');
        setSubmitLoading(false);
        return;
      }

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
          text: editId ? 'Pengguna berhasil diperbarui' : 'Pengguna berhasil ditambahkan',
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

  const toggleGlobalMfa = async () => {
    setMfaLoading(true);
    try {
      const token = localStorage.getItem('ami_token');
      const newValue = !globalMfa;
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ mfa_enabled: newValue })
      });
      if (res.ok) {
        setGlobalMfa(newValue);
        Swal.fire({
          title: 'Berhasil',
          text: `MFA Global telah ${newValue ? 'diaktifkan' : 'dinonaktifkan'}`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        Swal.fire({ title: 'Gagal', text: 'Gagal mengubah pengaturan MFA', icon: 'error' });
      }
    } catch (e) {
      Swal.fire({ title: 'Error', text: 'Terjadi kesalahan jaringan', icon: 'error' });
    } finally {
      setMfaLoading(false);
    }
  };

  const roleOrder: Record<string, number> = {
    'admin': 1,
    'kaprodi': 2,
    'dosen': 3
  };

  const filteredUsers = users
    .filter(u => {
      const matchSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.dosen?.nama_lengkap.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchRole = filterRole ? u.role?.id?.toString() === filterRole : true;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      const roleA = a.role?.nama_role?.toLowerCase() || 'zzz';
      const roleB = b.role?.nama_role?.toLowerCase() || 'zzz';
      
      const orderA = roleOrder[roleA] || 99;
      const orderB = roleOrder[roleB] || 99;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      return a.email.localeCompare(b.email);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kelola Anggota / User</h1>
          <p className="text-slate-500 text-sm mt-1">Manajemen akun pengguna sistem AMI</p>
        </div>
        <div className="flex items-center gap-4">
          <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg shadow-sm transition-colors text-white ${globalMfa ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            <Shield size={16} className="text-white" />
            <span className="text-sm font-semibold text-white">Wajibkan MFA (Global)</span>
            <div className="relative inline-block w-10 h-6 ml-1">
              <input 
                type="checkbox" 
                className="peer sr-only"
                checked={globalMfa}
                onChange={toggleGlobalMfa}
                disabled={mfaLoading}
              />
              <div className="block w-full h-full rounded-full bg-black/20 peer-checked:bg-black/20 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-4 shadow-sm"></div>
            </div>
          </label>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus size={16} />
            Tambah User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Cari email atau nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <select 
               value={filterRole}
               onChange={(e) => setFilterRole(e.target.value)}
               className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-indigo-500"
             >
               <option value="">Semua Role</option>
               {roles.map(r => (
                 <option key={r.id} value={r.id}>{r.nama_role}</option>
               ))}
             </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Terakhir Login</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Tidak ada user ditemukan</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold flex-shrink-0">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.email}</p>
                          {user.dosen?.nama_lengkap && (
                            <p className="text-xs text-slate-500 capitalize mt-0.5">
                              {user.dosen.nama_lengkap.toLowerCase()}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                           {user.role?.nama_role.toLowerCase() === 'admin' ? <Shield size={14} className="text-purple-500"/> : 
                            user.role?.nama_role.toLowerCase() === 'kaprodi' ? <GraduationCap size={14} className="text-blue-500"/> :
                            <User size={14} className="text-slate-500"/>}
                           <span className="font-medium text-slate-700 capitalize">{user.role?.nama_role || '-'}</span>
                        </div>
                        {(user.role?.nama_role.toLowerCase() === 'kaprodi' || user.role?.nama_role.toLowerCase() === 'dosen') && (user.prodi?.nama_prodi || user.dosen?.prodi?.nama_prodi) && (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block max-w-fit truncate" title={user.prodi?.nama_prodi || user.dosen?.prodi?.nama_prodi}>
                            {user.prodi?.nama_prodi || user.dosen?.prodi?.nama_prodi}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1.5">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 w-fit">
                            <Check size={12} /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 w-fit">
                            <X size={12} /> Nonaktif
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleString('id-ID') : 'Belum pernah'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(user)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(user.id, user.email)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Hapus">
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
              <h3 className="text-lg font-bold text-slate-800">{editId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="nama@kampus.ac.id"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password {editId && <span className="text-slate-400 font-normal">(Kosongkan jika tidak ingin diubah)</span>}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required={!editId}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role / Peran</label>
                  <select 
                    required
                    value={formData.role_id}
                    onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white"
                  >
                    <option value="">-- Pilih Role --</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.nama_role}</option>
                    ))}
                  </select>
                </div>
                {roles.find(r => r.id.toString() === formData.role_id?.toString())?.nama_role.toLowerCase() === 'kaprodi' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Program Studi <span className="text-rose-600">*</span>
                    </label>
                    <select 
                      required
                      value={formData.prodi_id}
                      onChange={(e) => setFormData({...formData, prodi_id: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white"
                    >
                      <option value="">-- Pilih Program Studi --</option>
                      {prodis
                        .filter(p => {
                          const hasKaprodi = users.some(u => 
                            u.role?.nama_role.toLowerCase() === 'kaprodi' && 
                            (u.prodi_id === p.id || u.dosen?.prodi?.id === p.id) &&
                            u.id !== editId // kecuali user yang sedang diedit
                          );
                          return !hasKaprodi || p.id.toString() === formData.prodi_id;
                        })
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.jenjang} - {p.nama_prodi}</option>
                        ))
                      }
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      Setiap prodi hanya boleh memiliki 1 Kaprodi. Hanya prodi yang belum memiliki Kaprodi yang ditampilkan.
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-3 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input 
                      type="checkbox" 
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Akun Aktif (Dapat Login)</span>
                  </label>
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
