'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Inbox,
  ArrowRight,
} from 'lucide-react';

interface RecentIsian {
  id: string;
  dosen_nama: string;
  dosen_nip: string;
  judul_dokumen: string | null;
  kriteria: string;
  kode_ami: string;
  submitted_at: string;
}

interface DashboardData {
  periode_aktif: string | null;
  instrumen_aktif: string | null;
  prodi: { id: string; nama_prodi: string; jenjang: string | null } | null;
  dosen_count: number;

  total_unsur: number;
  unsur_terisi: number;
  unsur_belum_terisi: number;
  unsur_perlu_revisi: number;
  unsur_valid: number;
  unsur_proses: number;
  progress: number;

  isians: { masuk: number; proses: number; valid: number; revisi: number };
  recent_isians: RecentIsian[];
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'baru saja';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`;
  return date.toLocaleDateString('id-ID');
}

export default function KaprodiDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('ami_token');
        if (!token) {
          setError('Sesi tidak valid');
          return;
        }
        const res = await fetch('/api/kaprodi/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.message || 'Gagal memuat data dashboard');
          return;
        }
        setData(json.data);
      } catch (e) {
        console.error(e);
        setError('Gagal memuat data dashboard');
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

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-rose-700 font-medium">{error ?? 'Gagal memuat data dashboard'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0a2f6f] tracking-tight">
          Dashboard Kaprodi
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Selamat datang di Portal Kaprodi. Pantau progres, review pengajuan AMI prodi.
        </p>
      </div>

      {/* ====== Hero "Periode Aktif" ====== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a2f6f] via-[#0e4490] to-[#1456a8] text-white p-7 shadow-lg">
        {/* striped accent */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 1.5px, transparent 1.5px 18px)',
          }}
        />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold backdrop-blur-sm">
            <Calendar size={13} /> Periode Aktif
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
            {data.periode_aktif ? `AMI Tahun ${data.periode_aktif}` : 'Belum ada periode aktif'}
          </h2>
          <p className="mt-1 text-blue-100/90 max-w-2xl text-sm">
            {data.instrumen_aktif
              ? `${data.instrumen_aktif}. Pastikan seluruh instrumen audit telah dibuat dan dosen mengisi sebelum tenggat.`
              : 'Belum ada instrumen aktif untuk periode ini.'}
          </p>
        </div>
      </div>

      {/* ====== KPI Row: Progress + 4 stat cards ====== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Progress card (lebar 1 kolom besar) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center md:col-span-1">
          <div className="text-[11px] tracking-[0.2em] font-semibold text-slate-500 uppercase">
            Progress AMI
          </div>
          <div className="mt-2 text-6xl font-extrabold text-[#0a2f6f] leading-none tracking-tight">
            {data.progress}%
          </div>
          <div className="w-full mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#1456a8] rounded-full transition-all duration-700"
              style={{ width: `${data.progress}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500 max-w-[18rem]">
            Total seluruh unsur pemeriksaan yang sudah terisi.
          </p>
        </div>

        {/* 4 stat KPI in 2x2 grid */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <KpiCard
            label="Total Isian AMI"
            value={data.total_unsur}
            icon={<FileText size={20} className="text-[#1456a8]" />}
          />
          <KpiCard
            label="Total Isian Belum Terisi"
            value={data.unsur_belum_terisi}
            icon={<Inbox size={20} className="text-slate-500" />}
          />
          <KpiCard
            label="Total Isian Terisi"
            value={data.unsur_terisi}
            icon={<CheckCircle size={20} className="text-emerald-500" />}
          />
          <KpiCard
            label="Total Isian Perlu Revisi"
            value={data.unsur_perlu_revisi}
            icon={<AlertCircle size={20} className="text-rose-500" />}
          />
        </div>
      </div>

      {/* ====== Status Isian (4 dark blue cards) ====== */}
      <div className="bg-white rounded-2xl border border-[#cfdbf2] shadow-sm p-6">
        <h3 className="text-lg font-bold text-[#0a2f6f] mb-4">Status Isian</h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusBlock
            label="Total Isian Masuk"
            value={data.isians.masuk}
            tone="navy"
          />
          <StatusBlock
            label="Total Isian Valid"
            value={data.isians.valid}
            tone="navy"
            accentDot="emerald"
          />
          <StatusBlock
            label="Total Isian Menunggu Review"
            value={data.isians.proses}
            tone="navy"
            accentDot="amber"
          />
          <StatusBlock
            label="Total Isian Perlu Revisi"
            value={data.isians.revisi}
            tone="navy"
            accentDot="rose"
          />
        </div>
      </div>

      {/* ====== Prioritas Review ====== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-bold text-[#0a2f6f] flex items-center gap-2">
            <Clock size={20} className="text-amber-500" /> Prioritas Review
          </h3>
          <span className="text-xs text-slate-500">
            {data.dosen_count} dosen aktif di prodi Anda
          </span>
        </div>

        {data.isians.proses > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Terdapat <strong className="text-amber-600">{data.isians.proses} isian</strong>{' '}
              yang menunggu review Anda.
            </p>

            {data.recent_isians.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.recent_isians.map((isian) => (
                  <div
                    key={isian.id}
                    className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-800 truncate">
                        {isian.dosen_nama}
                      </span>
                      <span className="text-[11px] bg-[#eef4ff] text-[#0a2f6f] px-2 py-0.5 rounded-full font-semibold border border-[#cfdbf2]">
                        {isian.kode_ami}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-700 line-clamp-2">
                        {isian.judul_dokumen ?? '(Judul kosong)'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Disubmit: {timeAgo(isian.submitted_at)}
                      </p>
                      <Link
                        href={`/kaprodi/review?isian_id=${isian.id}`}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1456a8] hover:text-[#0a2f6f]"
                      >
                        Review Sekarang <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Tidak ada data isian terbaru.</p>
            )}

            <Link
              href="/kaprodi/review"
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#0a2f6f] text-white text-sm font-semibold rounded-lg hover:bg-[#06214f] transition-colors"
            >
              Lihat Semua Isian ({data.isians.proses}) <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-3">
              <CheckCircle size={24} />
            </div>
            <p className="text-slate-600 text-sm">
              Tidak ada isian yang menunggu review saat ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// Komponen kecil
// =====================================================================
function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-full bg-[#eef4ff] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold truncate">
          {label}
        </div>
        <div className="text-3xl font-extrabold text-[#0a2f6f] leading-tight">{value}</div>
      </div>
    </div>
  );
}

function StatusBlock({
  label,
  value,
  tone,
  accentDot,
}: {
  label: string;
  value: number;
  tone?: 'navy';
  accentDot?: 'emerald' | 'amber' | 'rose';
}) {
  const dotMap = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
  };
  return (
    <div
      className={`relative overflow-hidden rounded-xl p-4 text-white shadow-md ${
        tone === 'navy'
          ? 'bg-gradient-to-br from-[#0e4490] to-[#1456a8]'
          : 'bg-slate-700'
      }`}
    >
      {/* striped accent */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 1.5px, transparent 1.5px 14px)',
        }}
      />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-blue-100/90 truncate">
          {label}
        </div>
        {accentDot && (
          <span className={`inline-block w-2 h-2 rounded-full ${dotMap[accentDot]}`} />
        )}
      </div>
      <div className="relative z-10 mt-2 text-3xl font-extrabold leading-tight">{value}</div>
    </div>
  );
}
