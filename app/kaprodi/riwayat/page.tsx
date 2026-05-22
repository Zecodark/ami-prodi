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
  reviewed_at: string | null;
  submitted_at: string | null;
}

export default function KaprodiRiwayatReviewPage() {
  const [logs, setLogs] = useState<ReviewLog[]>([]);
  const [dosens, setDosens] = useState<Array<{id: number; nama_lengkap: string}>>([]);
  const [kodeAmis, setKodeAmis] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'revisi'>('all');
  const [dosenFilter, setDosenFilter] = useState<string>('');
  const [kodeFilter, setKodeFilter] = useState<string>('');
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
            reviewed_at: it.reviewed_at ?? null,
            submitted_at: it.submitted_at ?? null,
          }))
          .sort(
            (a, b) =>
              // sort by reviewed_at (most recent first), fallback to submitted_at
              (new Date(b.reviewed_at ?? b.submitted_at ?? 0).getTime() -
                new Date(a.reviewed_at ?? a.submitted_at ?? 0).getTime())
          );
        setLogs(filtered);
        // fetch dosen list and kode ami list for filters
        try {
          const [dRes, kRes] = await Promise.all([
            fetch('/api/dosens', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/kode-ami', { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          const djson = await dRes.json();
          const kjson = await kRes.json();
          setDosens((djson.data ?? []).map((d: any) => ({ id: d.id, nama_lengkap: d.nama_lengkap })));
          setKodeAmis((kjson.data ?? []).map((k: any) => k.kode_ami));
        } catch (e) {
          // non-fatal: filters can be empty
          console.debug('Unable to fetch dosens or kode-ami for filters', e);
        }
      } catch (e) {
        console.error(e);
        setError('Gagal memuat riwayat review');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const visibleLogs = logs.filter((log) => {
    if (statusFilter !== 'all' && log.status_sesudah !== statusFilter) return false;
    if (dosenFilter && log.dosen_nama.toLowerCase().indexOf(dosenFilter.toLowerCase()) === -1) return false;
    if (kodeFilter && log.kode_ami !== kodeFilter) return false;
    return true;
  });

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
          <>
          <div className="p-4 border-b">
            <div className="grid grid-cols-1 gap-3 items-center lg:grid-cols-12">
              <div className="flex items-center gap-2 lg:col-span-2">
                <label className="text-sm text-slate-600">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border rounded px-2 py-1 text-sm w-full"
                >
                  <option value="all">Semua</option>
                  <option value="valid">Valid</option>
                  <option value="revisi">Revisi</option>
                </select>
              </div>

              <div className="flex items-center gap-2 lg:col-span-5">
                <label className="text-sm text-slate-600">Dosen</label>
                <div className="w-full">
                  <input
                    list="dosen-list"
                    value={dosenFilter}
                    onChange={(e) => setDosenFilter(e.target.value)}
                    placeholder="Cari nama dosen..."
                    className="border rounded px-2 py-1 text-sm w-full"
                  />
                  <datalist id="dosen-list">
                    {dosens.map((d) => (
                      <option key={d.id} value={d.nama_lengkap} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex items-center gap-2 lg:col-span-3">
                <label className="text-sm text-slate-600">Kode AMI</label>
                <select
                  value={kodeFilter}
                  onChange={(e) => setKodeFilter(e.target.value)}
                  className="border rounded px-2 py-1 text-sm w-full"
                >
                  <option value="">Semua</option>
                  {kodeAmis.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2 lg:justify-self-end">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setDosenFilter('');
                    setKodeFilter('');
                  }}
                  className="text-sm text-slate-600 underline"
                >
                  Reset filter
                </button>
              </div>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs text-slate-500 border-b border-slate-100">
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Kode AMI</div>
              <div className="col-span-3">Unsur</div>
              <div className="col-span-2">Dosen</div>
              <div className="col-span-2">Tgl Submit</div>
              <div className="col-span-2">Tgl Review</div>
            </div>

            <ul className="divide-y divide-slate-100">
              {visibleLogs.map((log) => (
                <li key={log.id}>
                  <Link
                    href={`/kaprodi/review?isian_id=${log.id}`}
                    className="block hover:bg-slate-50 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-4 p-4 items-start">
                      <div className="col-span-1 flex items-start">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center ${
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
                      </div>

                      <div className="col-span-2 text-sm text-slate-700 font-semibold">
                        {log.kode_ami}
                      </div>

                      <div className="col-span-3 text-sm text-slate-700 truncate">
                        {log.judul ?? '(Tanpa judul)'}
                      </div>

                      <div className="col-span-2 text-sm text-slate-800 truncate">
                        {log.dosen_nama}
                      </div>

                      <div className="col-span-2 text-sm text-slate-600">
                        {log.submitted_at
                          ? new Date(log.submitted_at).toLocaleString('id-ID')
                          : '-'}
                      </div>

                      <div className="col-span-2 text-sm text-slate-600">
                        {log.reviewed_at
                          ? new Date(log.reviewed_at).toLocaleString('id-ID')
                          : '-'}
                      </div>

                      <div className="col-span-12 flex justify-end">
                        <ChevronRight size={16} className="text-slate-400 mt-1" />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
