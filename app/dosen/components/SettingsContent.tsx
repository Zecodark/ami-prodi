'use client';

import { useState } from 'react';

export default function SettingsContent({ token, user }: { token: string; user: any }) {
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password baru minimal 6 karakter');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: newPassword })
      });
      const result = await res.json();
      if (res.ok) {
        alert('Password berhasil diubah!');
        setNewPassword('');
      } else {
        alert(result.message || 'Gagal mengubah password');
      }
    } catch (err) {
      alert('Terjadi kesalahan server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-slate-800 m-0">Pengaturan Akun</h3>
        <p className="text-slate-500 text-sm mt-1">Kelola profil dan keamanan akun Anda.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
        <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Profil Saat Ini</h4>
        <div className="grid grid-cols-2 gap-y-4 text-sm">
          <div>
            <div className="text-slate-500 mb-1">Nama Lengkap / Dosen</div>
            <div className="text-slate-800 font-medium">{user.dosen?.nama_lengkap || '-'}</div>
          </div>
          <div>
            <div className="text-slate-500 mb-1">Email / Username</div>
            <div className="text-slate-800 font-medium">{user.email}</div>
          </div>
          <div>
            <div className="text-slate-500 mb-1">Role</div>
            <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 font-bold uppercase tracking-wider text-[11px] mt-1">
              {user.role || 'User'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Ubah Password</h4>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-500">Password Baru</label>
            <input 
              type="password" 
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          
          <div className="mt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-slate-800 text-sm font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Perbarui Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
