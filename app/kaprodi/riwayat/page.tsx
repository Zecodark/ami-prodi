'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, CheckCircle, Edit3, ChevronRight } from 'lucide-react';

interface ReviewLog {
  id: string;
  dosen_nama: string;
  kode_ami: string;
  judul: string | null;
  status_sebelum: string | null;
  status_sesudah: string;
  catatan: string | null;
  reviewed_at: string;
}

export default function KaprodiRiwayatReviewPage() {
  const [logs, setLogs] = useState<ReviewLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('ami_token');
        // GET semua isian valid/revisi yang sudah direview
        const res = await fetch('/api/isians', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        const items = (json.data ?? []) as any[];
        const filtered: ReviewLog[] = items
          .filter((it) => it.status === 'valid' || it.status === 'revisi')
          .map((it) => ({
            id: String(it.id),
            dosen_nama: it.dosen?.nama_lengkap ?? 'Tanpa Nama',
            kode_ami:
              it.pemeriksaan_unsur?.deskripsi_area?.kode_ami?.kode_ami ?? '-',
            judul: it.judul_dokumen,
            status_sebelum: 'proses',
            status_sesudah: it.status,
            catatan: it.catatan_kaprodi,
            reviewed_at: it.reviewed_at,
          }))
          .sort(
            (a, b) =>
              new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime()
          );
        setLogs(filtered);
      } catch (e) {
        console.error(e);
        setError('Gagal memuat riwayat review');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0a2f6f] tracking-tight">
          Riwayat Review
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Daftar isian yang sudah Anda validasi atau kembalikan untuk direvisi.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {error ? (
          <div className="p-6 text-center text-rose-600 text-sm">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
              <History size={22} />
            </div>
            <p className="text-slate-500 text-sm">
              Belum ada review yang Anda lakukan pada periode ini.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {logs.map((log) => (
              <li key={log.id}>
                <Link
                  href={`/kaprodi/review?isian_id=${log.id}`}
                  className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                      log.status_sesudah === 'valid'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {log.status_sesudah === 'valid' ? (
                      <CheckCircle size={18} />
                    ) : (
                      <Edit3 size={18} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 truncate">
                        {log.dosen_nama}
                      </span>
                      <span className="text-[11px] text-slate-500 shrink-0">
                        {log.reviewed_at
                          ? new Date(log.reviewed_at).toLocaleString('id-ID')
                          : '-'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 mt-0.5">
                      <span className="text-[11px] bg-[#eef4ff] text-[#0a2f6f] px-2 py-0.5 rounded-full font-semibold border border-[#cfdbf2] mr-2">
                        {log.kode_ami}
                      </span>
                      {log.judul ?? '(Tanpa judul)'}
                    </div>
                    {log.catatan && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        Catatan: {log.catatan}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-slate-400 mt-1 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
