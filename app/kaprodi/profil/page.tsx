'use client';

import { useEffect, useState } from 'react';
import { Mail, Briefcase, ShieldCheck, BookOpen } from 'lucide-react';

interface MeData {
  id: string;
  email: string;
  role?: string;
  prodi?: { id: string; nama_prodi: string; jenjang: string | null } | null;
  dosen?: { nama_lengkap: string; nip: string; prodi?: any } | null;
}

export default function KaprodiProfilPage() {
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const namaTampil =
    me.dosen?.nama_lengkap || me.email.split('@')[0] || 'Kaprodi';
  const initial = namaTampil
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  const prodi = me.prodi ?? me.dosen?.prodi ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0a2f6f] tracking-tight">
          Profil Kaprodi
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Informasi akun kaprodi dan prodi yang Anda kelola.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1456a8] to-[#0a2f6f] flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg">
            {initial || 'K'}
          </div>
          <h2 className="text-lg font-bold text-slate-800">{namaTampil}</h2>
          <span className="inline-block mt-2 text-xs font-semibold text-[#0a2f6f] bg-[#eef4ff] border border-[#cfdbf2] px-3 py-1 rounded-full">
            {me.role?.toUpperCase() ?? 'KAPRODI'}
          </span>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <Row icon={<Mail size={18} />} label="Email" value={me.email} />
          <Row
            icon={<ShieldCheck size={18} />}
            label="Role"
            value={(me.role ?? 'kaprodi').toString().toUpperCase()}
          />
          <Row
            icon={<BookOpen size={18} />}
            label="Prodi yang Dikelola"
            value={
              prodi
                ? `${prodi.nama_prodi}${prodi.jenjang ? ` (${prodi.jenjang})` : ''}`
                : '-'
            }
          />
          {me.dosen && (
            <Row
              icon={<Briefcase size={18} />}
              label="NIP"
              value={me.dosen.nip ?? '-'}
            />
          )}
        </div>
      </div>
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
