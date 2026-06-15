'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Inbox,
  Filter,
} from 'lucide-react';

interface Prodi {
  id: number;
  nama_prodi: string;
}

interface Instrumen {
  id: number;
  nama_instrumen: string;
  is_active: boolean;
}

interface DashboardData {
  periode_aktif: { id: number; tahun: string } | null;
  instrumens: Instrumen[];
  users: number;
  dosens: number;
  prodis: Prodi[];
}

interface SummaryData {
  masuk: number;
  proses: number;
  valid: number;
  revisi: number;
  base_total_unsur: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingBase, setLoadingBase] = useState(true);

  const [selectedProdi, setSelectedProdi] = useState<string>('all');
  const [selectedInstrumen, setSelectedInstrumen] = useState<number | null>(null);
  
  const [summary, setSummary] = useState<SummaryData>({ masuk: 0, proses: 0, valid: 0, revisi: 0, base_total_unsur: 0 });
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoadingBase(true);
        const token = localStorage.getItem('ami_token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch parallel base data
        const [periodeRes, usersRes, dosensRes, prodisRes] =
          await Promise.all([
            fetch('/api/periodes?is_active=true', { headers }),
            fetch('/api/users', { headers }),
            fetch('/api/dosens', { headers }),
            fetch('/api/prodis', { headers }),
          ]);

        const periodeJson = await periodeRes.json();
        const usersJson = await usersRes.json();
        const dosensJson = await dosensRes.json();
        const prodisJson = await prodisRes.json();

        const periodeAktif = periodeJson.data?.[0] ?? null;

        let instrumensList: Instrumen[] = [];
        if (periodeAktif) {
          const instrumenRes = await fetch(`/api/instrumens?periode_id=${periodeAktif.id}`, { headers });
          const instrumenJson = await instrumenRes.json();
          instrumensList = instrumenJson.data ?? [];
        }

        const activeInst = instrumensList.find(i => i.is_active) || instrumensList[0];
        if (activeInst) {
          setSelectedInstrumen(activeInst.id);
        }

        setData({
          periode_aktif: periodeAktif ? { id: periodeAktif.id, tahun: periodeAktif.tahun } : null,
          instrumens: instrumensList,
          users: (usersJson.data ?? []).length,
          dosens: (dosensJson.data ?? []).length,
          prodis: prodisJson.data ?? [],
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingBase(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!data?.periode_aktif?.id || !selectedInstrumen) return;
      try {
        setLoadingSummary(true);
        const token = localStorage.getItem('ami_token');
        const headers = { Authorization: `Bearer ${token}` };

        // Hitung total unsur dari instrumen yang dipilih
        let baseTotalUnsur = 0;
        const krRes = await fetch(`/api/kriteria?instrumen_id=${selectedInstrumen}`, { headers });
        const krJson = await krRes.json();
        for (const k of krJson.data ?? []) {
          for (const ami of k.kode_amis ?? []) {
            for (const area of ami.deskripsi_areas ?? []) {
              baseTotalUnsur += (area.pemeriksaan_unsurs ?? []).length;
            }
          }
        }

        let url = `/api/isians/summary?periode_id=${data.periode_aktif.id}&instrumen_id=${selectedInstrumen}`;
        if (selectedProdi !== 'all') {
          url += `&prodi_id=${selectedProdi}`;
        }

        const summaryRes = await fetch(url, { headers });
        const summaryJson = await summaryRes.json();

        setSummary({
          masuk: summaryJson.data?.total ?? 0,
          proses: summaryJson.data?.proses ?? 0,
          valid: summaryJson.data?.valid ?? 0,
          revisi: summaryJson.data?.revisi ?? 0,
          base_total_unsur: baseTotalUnsur,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, [selectedProdi, selectedInstrumen, data?.periode_aktif?.id]);

  if (loadingBase || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // Kalkulasi progress
  const prodisCount = data.prodis.length || 0;
  const multiplier = selectedProdi === 'all' ? prodisCount : 1;
  const totalUnsur = summary.base_total_unsur * multiplier;

  const valid = summary.valid;
  const proses = summary.proses;
  const revisi = summary.revisi;
  const masuk = summary.masuk;

  const unsurTerisi = valid + proses + revisi > 0 ? Math.min(totalUnsur, valid + proses + revisi) : 0;
  const unsurBelumTerisi = Math.max(0, totalUnsur - unsurTerisi);
  const progress = totalUnsur > 0 ? Math.round((unsurTerisi / totalUnsur) * 100) : 0;

  const currentInstrumenObj = data.instrumens.find(i => i.id === selectedInstrumen);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0a2f6f] tracking-tight">
            Dashboard Admin
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Ringkasan data sistem Audit Mutu Internal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Instrumen */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <FileText size={18} className="text-[#1456a8]" />
            <select
              value={selectedInstrumen || ''}
              onChange={(e) => setSelectedInstrumen(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-[#0a2f6f] focus:outline-none cursor-pointer pr-4 max-w-[200px] truncate"
            >
              {data.instrumens.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nama_instrumen}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Prodi */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Filter size={18} className="text-[#1456a8]" />
            <select
              value={selectedProdi}
              onChange={(e) => setSelectedProdi(e.target.value)}
              className="bg-transparent text-sm font-bold text-[#0a2f6f] focus:outline-none cursor-pointer pr-4"
            >
              <option value="all">Semua Prodi</option>
              {data.prodis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_prodi}
                </option>
              ))}
            </select>
          </div>
        </div>
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
            {data.periode_aktif
              ? `AMI Tahun ${data.periode_aktif.tahun}`
              : 'Belum ada periode aktif'}
          </h2>
          <p className="mt-1 text-blue-100/90 max-w-2xl text-sm">
            {currentInstrumenObj?.nama_instrumen ?? 'Belum ada instrumen.'}
          </p>
        </div>
      </div>

      <div className={`transition-opacity duration-300 ${loadingSummary ? 'opacity-50' : 'opacity-100'}`}>
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
              value={totalUnsur}
              icon={<FileText size={20} className="text-[#1456a8]" />}
            />
            <KpiCard
              label="Total Isian Belum Terisi"
              value={unsurBelumTerisi}
              icon={<Inbox size={20} className="text-slate-500" />}
            />
            <KpiCard
              label="Total Isian Terisi"
              value={unsurTerisi}
              icon={<CheckCircle size={20} className="text-emerald-500" />}
            />
            <KpiCard
              label="Total Isian Perlu Revisi"
              value={revisi}
              icon={<AlertCircle size={20} className="text-rose-500" />}
            />
          </div>
        </div>

        {/* ====== Status Isian (4 dark blue cards) ====== */}
        <div className="bg-white rounded-2xl border border-[#cfdbf2] shadow-sm p-6 mt-6">
          <h3 className="text-lg font-bold text-[#0a2f6f] mb-4">Status Isian</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusBlock label="Total Isian Masuk" value={masuk} />
            <StatusBlock label="Total Isian Valid" value={valid} accentDot="emerald" />
            <StatusBlock label="Total Isian Menunggu Review" value={proses} accentDot="amber" />
            <StatusBlock label="Total Isian Perlu Revisi" value={revisi} accentDot="rose" />
          </div>
        </div>
      </div>

      {/* ====== Data Sistem ====== */}
      <div className="bg-white rounded-2xl border border-[#cfdbf2] shadow-sm p-6">
        <h3 className="text-lg font-bold text-[#0a2f6f] mb-4">Data Sistem</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Total User Aktif"
            value={data.users}
            icon={<Users size={20} className="text-[#1456a8]" />}
          />
          <KpiCard
            label="Total Dosen"
            value={data.dosens}
            icon={<GraduationCap size={20} className="text-[#1456a8]" />}
          />
          <KpiCard
            label="Total Prodi"
            value={data.prodis.length}
            icon={<BookOpen size={20} className="text-[#1456a8]" />}
          />
        </div>
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

