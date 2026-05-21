'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  Edit3,
  CircleDashed,
  ClipboardList,
} from 'lucide-react';

type UnsurStatus = 'valid' | 'revisi' | 'proses' | 'kosong';

interface UnsurStatusInfo {
  status: UnsurStatus;
  counts: { valid: number; revisi: number; proses: number; total: number };
  latest_dosen_nama: string | null;
  updated_at: string | null;
}

interface KriteriaTree {
  id: string;
  kode_kriteria: string;
  nama_kriteria: string;
  kode_amis: Array<{
    id: string;
    kode_ami: string;
    deskripsi_areas: Array<{
      id: string;
      deskripsi_area_audit: string;
      pemeriksaan_unsurs: Array<{
        id: string;
        isi_unsur: string;
      }>;
    }>;
  }>;
}

const STATUS_LABEL: Record<UnsurStatus, string> = {
  valid: 'Valid',
  proses: 'Menunggu Review',
  revisi: 'Perlu Revisi',
  kosong: 'Belum Diisi',
};

const STATUS_COLOR: Record<UnsurStatus, string> = {
  valid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  proses: 'bg-amber-50 text-amber-700 border-amber-200',
  revisi: 'bg-rose-50 text-rose-700 border-rose-200',
  kosong: 'bg-slate-50 text-slate-500 border-slate-200',
};

const STATUS_ICON: Record<UnsurStatus, React.ReactNode> = {
  valid: <CheckCircle size={12} />,
  proses: <Clock size={12} />,
  revisi: <Edit3 size={12} />,
  kosong: <CircleDashed size={12} />,
};

export default function KaprodiRekapPage() {
  const [tree, setTree] = useState<KriteriaTree[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, UnsurStatusInfo>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | UnsurStatus>('all');
  const [prodiId, setProdiId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('ami_token');
        const headers = { Authorization: `Bearer ${token}` };

        // Ambil prodi_id kaprodi dari /api/auth/me
        const meRes = await fetch('/api/auth/me', { headers });
        const meJson = await meRes.json();
        const pid =
          meJson?.data?.prodi?.id ??
          meJson?.data?.dosen?.prodi?.id ??
          null;
        setProdiId(pid ? String(pid) : null);

        // Ambil instrumen aktif
        const insRes = await fetch('/api/instrumens?is_active=true', { headers });
        const insJson = await insRes.json();
        if (!insJson.data?.length) {
          setTree([]);
          setLoading(false);
          return;
        }
        const insId = insJson.data[0].id;

        // Ambil struktur kriteria
        const krRes = await fetch(`/api/kriteria?instrumen_id=${insId}`, { headers });
        const krJson = await krRes.json();
        setTree(krJson.data ?? []);

        // Ambil status map per unsur
        const url = pid
          ? `/api/isians/by-unsur?prodi_id=${pid}`
          : '/api/isians/by-unsur';
        const stRes = await fetch(url, { headers });
        const stJson = await stRes.json();
        setStatusMap(stJson.data?.data ?? {});
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

  // Hitung statistik global
  const allUnsur: { unsurId: string; status: UnsurStatus }[] = [];
  for (const k of tree) {
    for (const a of k.kode_amis) {
      for (const ar of a.deskripsi_areas) {
        for (const u of ar.pemeriksaan_unsurs) {
          allUnsur.push({
            unsurId: u.id,
            status: statusMap[u.id]?.status ?? 'kosong',
          });
        }
      }
    }
  }
  const counts = {
    total: allUnsur.length,
    valid: allUnsur.filter((u) => u.status === 'valid').length,
    proses: allUnsur.filter((u) => u.status === 'proses').length,
    revisi: allUnsur.filter((u) => u.status === 'revisi').length,
    kosong: allUnsur.filter((u) => u.status === 'kosong').length,
  };

  const filterMatch = (s: UnsurStatus) => filter === 'all' || filter === s;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0a2f6f] tracking-tight">
          Rekap AMI Prodi
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Rekapitulasi status pengisian setiap unsur AMI di prodi Anda.
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        <FilterPill
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label={`Semua (${counts.total})`}
        />
        <FilterPill
          active={filter === 'valid'}
          onClick={() => setFilter('valid')}
          label={`Valid (${counts.valid})`}
          tone="emerald"
        />
        <FilterPill
          active={filter === 'proses'}
          onClick={() => setFilter('proses')}
          label={`Menunggu Review (${counts.proses})`}
          tone="amber"
        />
        <FilterPill
          active={filter === 'revisi'}
          onClick={() => setFilter('revisi')}
          label={`Perlu Revisi (${counts.revisi})`}
          tone="rose"
        />
        <FilterPill
          active={filter === 'kosong'}
          onClick={() => setFilter('kosong')}
          label={`Belum Diisi (${counts.kosong})`}
          tone="slate"
        />
      </div>

      {tree.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
            <ClipboardList size={22} />
          </div>
          <p className="text-slate-500 text-sm">
            Belum ada instrumen aktif. Hubungi admin untuk mengaktifkan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tree.map((k) => {
            // Hitung status anak
            const unsurInKriteria: UnsurStatus[] = [];
            for (const a of k.kode_amis) {
              for (const ar of a.deskripsi_areas) {
                for (const u of ar.pemeriksaan_unsurs) {
                  unsurInKriteria.push(statusMap[u.id]?.status ?? 'kosong');
                }
              }
            }
            const visibleCount = unsurInKriteria.filter(filterMatch).length;
            if (filter !== 'all' && visibleCount === 0) return null;

            return (
              <div
                key={k.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-slate-100 bg-[#f7fafd]">
                  <h3 className="font-semibold text-[#0a2f6f]">
                    [{k.kode_kriteria}] {k.nama_kriteria}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {visibleCount} dari {unsurInKriteria.length} unsur
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="text-left px-5 py-2.5 w-32">Kode AMI</th>
                        <th className="text-left px-5 py-2.5">Unsur Pemeriksaan</th>
                        <th className="text-left px-5 py-2.5 w-44">Status</th>
                        <th className="text-left px-5 py-2.5 w-44">Terakhir Diisi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {k.kode_amis.flatMap((a) =>
                        a.deskripsi_areas.flatMap((ar) =>
                          ar.pemeriksaan_unsurs
                            .filter((u) =>
                              filterMatch(statusMap[u.id]?.status ?? 'kosong')
                            )
                            .map((u) => {
                              const info = statusMap[u.id];
                              const status: UnsurStatus = info?.status ?? 'kosong';
                              return (
                                <tr key={u.id} className="hover:bg-slate-50">
                                  <td className="px-5 py-3 align-top">
                                    <span className="text-[11px] bg-[#eef4ff] text-[#0a2f6f] px-2 py-0.5 rounded-full font-semibold border border-[#cfdbf2]">
                                      {a.kode_ami}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3 align-top">
                                    <div className="text-slate-700 line-clamp-3">
                                      {u.isi_unsur}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-1">
                                      {ar.deskripsi_area_audit}
                                    </div>
                                  </td>
                                  <td className="px-5 py-3 align-top">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLOR[status]}`}
                                    >
                                      {STATUS_ICON[status]}
                                      {STATUS_LABEL[status]}
                                    </span>
                                    {info && info.counts.total > 0 && (
                                      <div className="text-[11px] text-slate-500 mt-1">
                                        {info.counts.total} isian
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-5 py-3 align-top text-xs text-slate-500">
                                    {info?.latest_dosen_nama ? (
                                      <>
                                        <div className="text-slate-700 font-medium truncate">
                                          {info.latest_dosen_nama}
                                        </div>
                                        {info.updated_at && (
                                          <div className="text-[11px] text-slate-400">
                                            {new Date(info.updated_at).toLocaleString(
                                              'id-ID'
                                            )}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  tone,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  const activeMap: Record<string, string> = {
    emerald: 'bg-emerald-600 border-emerald-600 text-white',
    amber: 'bg-amber-500 border-amber-500 text-white',
    rose: 'bg-rose-600 border-rose-600 text-white',
    slate: 'bg-slate-600 border-slate-600 text-white',
    default: 'bg-[#0a2f6f] border-[#0a2f6f] text-white',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition ${
        active
          ? activeMap[tone ?? 'default']
          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );
}
