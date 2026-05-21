'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Inbox,
  ArrowRight,
  CircleDashed,
} from 'lucide-react';

type UnsurStatus = 'valid' | 'revisi' | 'proses' | 'kosong';

interface UnsurStatusInfo {
  status: UnsurStatus;
  counts: { valid: number; revisi: number; proses: number; total: number };
}

interface Periode {
  id: string;
  tahun: string;
}

interface Instrumen {
  id: string;
  nama_instrumen: string;
}

export default function DosenDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periode, setPeriode] = useState<Periode | null>(null);
  const [instrumen, setInstrumen] = useState<Instrumen | null>(null);
  const [stat, setStat] = useState({
    total: 0,
    valid: 0,
    proses: 0,
    revisi: 0,
    kosong: 0,
  });

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('ami_token');
        if (!token) {
          setError('Sesi tidak valid');
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };

        const [periodeRes, instrumenRes, statusRes] = await Promise.all([
          fetch('/api/periodes?is_active=true', { headers }),
          fetch('/api/instrumens?is_active=true', { headers }),
          fetch('/api/isians/by-unsur', { headers }),
        ]);

        const periodeJson = await periodeRes.json();
        const instrumenJson = await instrumenRes.json();
        const statusJson = await statusRes.json();

        if (periodeJson.data?.length) setPeriode(periodeJson.data[0]);
        if (instrumenJson.data?.length) setInstrumen(instrumenJson.data[0]);

        // Hitung total unsur dari instrumen aktif
        let totalUnsur = 0;
        if (instrumenJson.data?.length) {
          const insId = instrumenJson.data[0].id;
          const krRes = await fetch(`/api/kriteria?instrumen_id=${insId}`, { headers });
          const krJson = await krRes.json();
          for (const k of krJson.data ?? []) {
            for (const ami of k.kode_amis ?? []) {
              for (const area of ami.deskripsi_areas ?? []) {
                totalUnsur += (area.pemeriksaan_unsurs ?? []).length;
              }
            }
          }
        }

        const map: Record<string, UnsurStatusInfo> = statusJson.data?.data ?? {};
        let valid = 0,
          proses = 0,
          revisi = 0;
        for (const v of Object.values(map)) {
          if (v.status === 'valid') valid++;
          else if (v.status === 'proses') proses++;
          else if (v.status === 'revisi') revisi++;
        }
        const kosong = Math.max(0, totalUnsur - (valid + proses + revisi));

        setStat({ total: totalUnsur, valid, proses, revisi, kosong });
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 max-w-md">
          <p className="text-rose-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const filled = stat.valid + stat.proses + stat.revisi;
  const progress = stat.total > 0 ? Math.round((filled / stat.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0a2f6f] tracking-tight">
          Dashboard Dosen
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pengisian AMI bersifat kolektif per prodi. Progres di bawah merangkum status semua
          unsur AMI untuk prodi Anda.
        </p>
      </div>

      {/* ====== Hero "Periode Aktif" ====== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a2f6f] via-[#0e4490] to-[#1456a8] text-white p-7 shadow-lg">
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
            {periode ? `AMI Tahun ${periode.tahun}` : 'Belum ada periode aktif'}
          </h2>
          <p className="mt-1 text-blue-100/90 max-w-2xl text-sm">
            {instrumen
              ? `${instrumen.nama_instrumen}. Pastikan seluruh unsur terisi sebelum tenggat.`
              : 'Belum ada instrumen aktif.'}
          </p>
        </div>
      </div>

      {/* ====== KPI Row: Progress + 4 stat cards ====== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Progress card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center md:col-span-1">
          <div className="text-[11px] tracking-[0.2em] font-semibold text-slate-500 uppercase">
            Progress AMI
          </div>
          <div className="mt-2 text-6xl font-extrabold text-[#0a2f6f] leading-none tracking-tight">
            {progress}%
          </div>
          <div className="w-full mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#1456a8] rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
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
            value={stat.total}
            icon={<FileText size={20} className="text-[#1456a8]" />}
          />
          <KpiCard
            label="Total Isian Belum Terisi"
            value={stat.kosong}
            icon={<Inbox size={20} className="text-slate-500" />}
          />
          <KpiCard
            label="Total Isian Terisi"
            value={filled}
            icon={<CheckCircle size={20} className="text-emerald-500" />}
          />
          <KpiCard
            label="Total Isian Perlu Revisi"
            value={stat.revisi}
            icon={<AlertCircle size={20} className="text-rose-500" />}
          />
        </div>
      </div>

      {/* ====== Status Isian (4 dark blue cards) ====== */}
      <div className="bg-white rounded-2xl border border-[#cfdbf2] shadow-sm p-6">
        <h3 className="text-lg font-bold text-[#0a2f6f] mb-4">Status Isian</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusBlock label="Total Isian Masuk" value={filled} />
          <StatusBlock label="Total Isian Valid" value={stat.valid} accentDot="emerald" />
          <StatusBlock label="Total Isian Menunggu Review" value={stat.proses} accentDot="amber" />
          <StatusBlock label="Total Isian Perlu Revisi" value={stat.revisi} accentDot="rose" />
        </div>
      </div>

      {/* ====== Tindakan Diperlukan ====== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-[#0a2f6f] mb-4">Tindakan Diperlukan</h3>

        {stat.revisi > 0 ? (
          <ActionRow
            tone="rose"
            icon={<AlertCircle size={20} />}
            title={`Ada ${stat.revisi} unsur yang perlu direvisi`}
            desc="Kaprodi memberikan catatan revisi pada beberapa unsur. Mohon segera diperbaiki."
            actionHref="/dosen/revisi"
            actionLabel="Lihat Revisi"
          />
        ) : stat.kosong > 0 ? (
          <ActionRow
            tone="amber"
            icon={<CircleDashed size={20} />}
            title={`Masih ada ${stat.kosong} unsur yang belum diisi`}
            desc="Bersama dosen lain, lengkapi unsur AMI sebelum batas waktu periode berakhir."
            actionHref="/dosen/isi-ami"
            actionLabel="Lanjutkan Pengisian"
          />
        ) : stat.proses > 0 ? (
          <ActionRow
            tone="indigo"
            icon={<Clock size={20} />}
            title={`${stat.proses} unsur sedang menunggu review kaprodi`}
            desc="Pengisian sudah lengkap, tunggu validasi dari kaprodi."
            actionHref="/dosen/riwayat"
            actionLabel="Lihat Riwayat"
          />
        ) : (
          <ActionRow
            tone="emerald"
            icon={<CheckCircle size={20} />}
            title="Semua unsur sudah valid"
            desc="Hebat! Seluruh unsur AMI prodi sudah disetujui kaprodi pada periode ini."
          />
        )}
      </div>
    </div>
  );
}

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
  accentDot,
}: {
  label: string;
  value: number;
  accentDot?: 'emerald' | 'amber' | 'rose';
}) {
  const dotMap = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
  };
  return (
    <div className="relative overflow-hidden rounded-xl p-4 text-white shadow-md bg-gradient-to-br from-[#0e4490] to-[#1456a8]">
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

function ActionRow({
  tone,
  icon,
  title,
  desc,
  actionHref,
  actionLabel,
}: {
  tone: 'rose' | 'amber' | 'indigo' | 'emerald';
  icon: React.ReactNode;
  title: string;
  desc: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  const palette = {
    rose: {
      box: 'bg-rose-50 border-rose-100',
      iconBox: 'bg-rose-100 text-rose-600',
      title: 'text-rose-800',
      desc: 'text-rose-600',
      btn: 'bg-rose-600 hover:bg-rose-700',
    },
    amber: {
      box: 'bg-amber-50 border-amber-100',
      iconBox: 'bg-amber-100 text-amber-600',
      title: 'text-amber-800',
      desc: 'text-amber-600',
      btn: 'bg-amber-600 hover:bg-amber-700',
    },
    indigo: {
      box: 'bg-indigo-50 border-indigo-100',
      iconBox: 'bg-indigo-100 text-indigo-600',
      title: 'text-indigo-800',
      desc: 'text-indigo-600',
      btn: 'bg-indigo-600 hover:bg-indigo-700',
    },
    emerald: {
      box: 'bg-emerald-50 border-emerald-100',
      iconBox: 'bg-emerald-100 text-emerald-600',
      title: 'text-emerald-800',
      desc: 'text-emerald-600',
      btn: 'bg-emerald-600 hover:bg-emerald-700',
    },
  }[tone];

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border ${palette.box}`}>
      <div className={`p-2 rounded-full shrink-0 ${palette.iconBox}`}>{icon}</div>
      <div className="flex-1">
        <h4 className={`text-sm font-bold ${palette.title}`}>{title}</h4>
        <p className={`text-sm mt-1 ${palette.desc}`}>{desc}</p>
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className={`mt-3 inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${palette.btn}`}
          >
            {actionLabel}
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
