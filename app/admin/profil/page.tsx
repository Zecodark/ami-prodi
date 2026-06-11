'use client';

import { useEffect, useState } from 'react';
import { Mail, ShieldCheck, Key, X } from 'lucide-react';

interface MeData {
  id: string;
  email: string;
  role?: string;
}

export default function AdminProfilPage() {
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [pwdLama, setPwdLama] = useState('');
  const [pwdBaru, setPwdBaru] = useState('');
  const [pwdKonfirmasi, setPwdKonfirmasi] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const handleGantiPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (pwdBaru !== pwdKonfirmasi) {
      setPwdError('Konfirmasi password tidak cocok');
      return;
    }
    setPwdLoading(true);
    try {
      const token = localStorage.getItem('ami_token');
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ passwordLama: pwdLama, passwordBaru: pwdBaru })
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdError(data.message || 'Gagal mengganti password');
      } else {
        setPwdSuccess('Password berhasil diubah');
        setPwdLama('');
        setPwdBaru('');
        setPwdKonfirmasi('');
        setTimeout(() => {
           setShowModal(false);
           setPwdSuccess('');
        }, 2000);
      }
    } catch(err) {
      setPwdError('Terjadi kesalahan jaringan');
    } finally {
      setPwdLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('ami_token');
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setMe(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="text-center text-slate-500 mt-10">Data profil tidak tersedia.</div>
    );
  }

  const namaTampil = 'Administrator';
  const initial = 'A';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0a2f6f] tracking-tight">
          Profil Admin
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Informasi akun administrator Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1456a8] to-[#0a2f6f] flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg">
            {initial}
          </div>
          <h2 className="text-lg font-bold text-slate-800">{namaTampil}</h2>
          <span className="inline-block mt-2 text-xs font-semibold text-[#0a2f6f] bg-[#eef4ff] border border-[#cfdbf2] px-3 py-1 rounded-full">
            {me.role?.toUpperCase() ?? 'ADMIN'}
          </span>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setShowModal(true);
                setPwdError('');
                setPwdSuccess('');
                setPwdLama('');
                setPwdBaru('');
                setPwdKonfirmasi('');
              }}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors border border-slate-300 shadow-sm"
            >
              <Key size={16} /> Ganti Password
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <Row icon={<Mail size={18} />} label="Email" value={me.email} />
          <Row
            icon={<ShieldCheck size={18} />}
            label="Role"
            value={(me.role ?? 'admin').toString().toUpperCase()}
          />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Key size={20} className="text-[#0a2f6f]" /> Ganti Password
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleGantiPassword} className="p-6 space-y-4">
              {pwdError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                  {pwdError}
                </div>
              )}
              {pwdSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
                  {pwdSuccess}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password Lama
                </label>
                <input
                  type="password"
                  required
                  value={pwdLama}
                  onChange={(e) => setPwdLama(e.target.value)}
                  className="w-full border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0a2f6f] focus:border-[#0a2f6f] text-sm"
                  placeholder="Masukkan password lama"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={pwdBaru}
                  onChange={(e) => setPwdBaru(e.target.value)}
                  className="w-full border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0a2f6f] focus:border-[#0a2f6f] text-sm"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={pwdKonfirmasi}
                  onChange={(e) => setPwdKonfirmasi(e.target.value)}
                  className="w-full border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0a2f6f] focus:border-[#0a2f6f] text-sm"
                  placeholder="Masukkan ulang password baru"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#0a2f6f] hover:bg-[#06214f] rounded-lg transition-colors disabled:opacity-50"
                >
                  {pwdLoading ? 'Menyimpan...' : 'Simpan Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
      <div className="p-3 bg-[#eef4ff] rounded-lg text-[#0a2f6f] shrink-0">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
          {label}
        </div>
        <div className="text-sm font-medium text-slate-800 mt-0.5 break-all">{value}</div>
      </div>
    </div>
  );
}
