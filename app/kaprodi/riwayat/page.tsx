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
          {/* Filters Area */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
              
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full border-slate-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                >
                  <option value="all">Semua Status</option>
                  <option value="valid">Valid</option>
                  <option value="revisi">Revisi</option>
                </select>
              </div>

              <div className="lg:col-span-5">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Dosen Pengisi</label>
                <div className="relative">
                  <input
                    list="dosen-list"
                    value={dosenFilter}
                    onChange={(e) => setDosenFilter(e.target.value)}
                    placeholder="Ketik untuk mencari nama dosen..."
                    className="w-full border-slate-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  />
                  <datalist id="dosen-list">
                    {dosens.map((d) => (
                      <option key={d.id} value={d.nama_lengkap} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Kode AMI</label>
                <select
                  value={kodeFilter}
                  onChange={(e) => setKodeFilter(e.target.value)}
                  className="w-full border-slate-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                >
                  <option value="">Semua Kode</option>
                  {kodeAmis.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2 flex justify-end h-[42px]">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setDosenFilter('');
                    setKodeFilter('');
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 bg-white border border-slate-300 hover:border-blue-300 hover:bg-blue-50 rounded-lg shadow-sm transition-all w-full h-full flex items-center justify-center"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200">
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-2">Kode AMI</div>
                <div className="col-span-3">Dokumen / Unsur</div>
                <div className="col-span-2">Dosen Pengisi</div>
                <div className="col-span-2">Tgl Submit</div>
                <div className="col-span-2">Tgl Review</div>
              </div>

              {/* Table Body */}
              <ul className="divide-y divide-slate-100 bg-white">
                {visibleLogs.map((log) => (
                  <li key={log.id} className="group">
                    <Link
                      href={`/kaprodi/review/${log.id}`}
                      className="block hover:bg-blue-50/40 transition-colors"
                    >
                      <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                        {/* Status */}
                        <div className="col-span-1 flex justify-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border ${
                              log.status_sesudah === 'valid'
                                ? 'bg-green-50 border-green-200 text-green-600 group-hover:bg-green-100'
                                : 'bg-orange-50 border-orange-200 text-orange-600 group-hover:bg-orange-100'
                            } transition-colors`}
                            title={log.status_sesudah === 'valid' ? 'Valid' : 'Revisi'}
                          >
                            {log.status_sesudah === 'valid' ? (
                              <CheckCircle size={18} className="stroke-[2.5]" />
                            ) : (
                              <Edit3 size={18} className="stroke-[2.5]" />
                            )}
                          </div>
                        </div>

                        {/* Kode AMI */}
                        <div className="col-span-2 text-sm text-slate-800 font-bold pr-2 truncate" title={log.kode_ami}>
                          {log.kode_ami}
                        </div>

                        {/* Dokumen / Unsur & Catatan */}
                        <div className="col-span-3 text-sm text-slate-700 pr-4">
                          <p className="truncate font-medium" title={log.judul || '(Tanpa judul)'}>
                            {log.judul ?? <span className="italic text-slate-400">Tanpa judul</span>}
                          </p>
                          {log.catatan && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic bg-amber-50/80 px-2 py-0.5 rounded border border-amber-100 inline-block max-w-full" title={log.catatan}>
                              Catatan: {log.catatan}
                            </p>
                          )}
                        </div>

                        {/* Dosen */}
                        <div className="col-span-2 text-sm font-semibold text-slate-800 pr-4">
                          <p className="truncate" title={log.dosen_nama}>
                            {log.dosen_nama}
                          </p>
                        </div>

                        {/* Tgl Submit */}
                        <div className="col-span-2 text-sm text-slate-500 whitespace-nowrap font-medium">
                          {log.submitted_at
                            ? new Date(log.submitted_at).toLocaleString('id-ID', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })
                            : '-'}
                        </div>

                        {/* Tgl Review & Arrow */}
                        <div className="col-span-2 flex items-center justify-between text-sm text-slate-500 whitespace-nowrap font-medium">
                          <span>
                            {log.reviewed_at
                              ? new Date(log.reviewed_at).toLocaleString('id-ID', {
                                  day: '2-digit', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })
                              : '-'}
                          </span>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
