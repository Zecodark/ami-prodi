'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  CheckCircle,
  Clock,
  CircleDashed,
  ChevronDown,
  Download,
  ExternalLink,
  ClipboardList,
  AlertCircle
} from 'lucide-react';

type UnsurStatus = 'valid' | 'revisi' | 'proses' | 'kosong';

interface UnsurStatusInfo {
  status: UnsurStatus;
  counts: { valid: number; revisi: number; proses: number; total: number };
  latest_isian_id: string | null;
  latest_dosen_nama: string | null;
  updated_at: string | null;
}

type UnsurStatusMap = Record<string, UnsurStatusInfo>;

type TreeNodeType = 'kriteria' | 'ami' | 'area' | 'unsur';

interface TreeNode {
  id: string;
  type: TreeNodeType;
  children?: TreeNode[];
  expanded?: boolean;
  kode_kriteria?: string;
  nama_kriteria?: string;
  kode_ami?: string;
  deskripsi_area_audit?: string;
  isi_unsur?: string;
}

const STATUS_META: Record<
  UnsurStatus,
  { bg: string; text: string; border: string; icon: React.ReactNode; label: string }
> = {
  valid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle size={10} />, label: 'Valid' },
  proses: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock size={10} />, label: 'Sebagian Valid' }, // Digunakan untuk dot parent yang partially valid
  revisi: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: <AlertCircle size={10} />, label: 'Perlu Revisi' },
  kosong: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', icon: <CircleDashed size={10} />, label: 'Belum Terisi' },
};

function aggregateParentStatus(children: UnsurStatus[]): {
  total: number;
  valid: number;
  proses: number;
  revisi: number;
  kosong: number;
  primary: UnsurStatus;
} {
  let valid = 0;
  let proses = 0;
  let revisi = 0;
  let kosong = 0;
  for (const s of children) {
    if (s === 'valid') valid++;
    else kosong++; // Semua selain valid masuk ke kosong
  }
  let primary: UnsurStatus = 'kosong';
  if (valid === children.length && children.length > 0) primary = 'valid';
  else if (valid > 0) primary = 'proses'; // Parent dot jadi orange (Sebagian Valid)
  return { total: children.length, valid, proses, revisi, kosong, primary };
}

export default function KaprodiRekapPage() {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [statusMap, setStatusMap] = useState<UnsurStatusMap>({});
  const [loading, setLoading] = useState(true);
  const [prodiId, setProdiId] = useState<string | null>(null);

  // States for Accordion details
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [detailsCache, setDetailsCache] = useState<Record<string, any>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('ami_token');
        const headers = { Authorization: `Bearer ${token}` };

        // Ambil prodi_id kaprodi
        const meRes = await fetch('/api/auth/me', { headers });
        const meJson = await meRes.json();
        const pid = meJson?.data?.prodi?.id ?? meJson?.data?.dosen?.prodi?.id ?? null;
        setProdiId(pid ? String(pid) : null);

        // Ambil instrumen aktif
        const insRes = await fetch('/api/instrumens?is_active=true', { headers });
        const insJson = await insRes.json();
        if (!insJson.data?.length) {
          setTreeData([]);
          setLoading(false);
          return;
        }
        const insId = insJson.data[0].id;

        // Ambil struktur kriteria
        const krRes = await fetch(`/api/kriteria?instrumen_id=${insId}`, { headers });
        const krJson = await krRes.json();
        if (krJson.data) buildTree(krJson.data);

        // Ambil status map
        fetchStatusMap(pid ? String(pid) : null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const fetchStatusMap = async (pid: string | null) => {
    try {
      const token = localStorage.getItem('ami_token');
      const url = pid ? `/api/isians/by-unsur?prodi_id=${pid}` : '/api/isians/by-unsur';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.data?.data) setStatusMap(data.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const buildTree = (kriteria: any[]) => {
    const tree: TreeNode[] = kriteria.map((k) => {
      const kodeAmis = (k.kode_amis || []).map((ami: any) => {
        const deskripsiAreas = (ami.deskripsi_areas || []).map((area: any) => ({
          id: area.id ? `area-${area.id}` : `area-rnd-${Math.random()}`,
          deskripsi_area_audit: area.deskripsi_area_audit,
          type: 'area' as const,
          expanded: true,
          children: (area.pemeriksaan_unsurs || []).map((unsur: any) => ({
            id: unsur.id?.toString() || Math.random().toString(),
            isi_unsur: unsur.isi_unsur,
            type: 'unsur' as const,
          })),
        }));

        return {
          id: ami.id ? `ami-${ami.id}` : `ami-rnd-${Math.random()}`,
          kode_ami: ami.kode_ami,
          type: 'ami' as const,
          expanded: true,
          children: deskripsiAreas,
        };
      });

      return {
        id: k.id ? `kriteria-${k.id}` : `kriteria-rnd-${Math.random()}`,
        kode_kriteria: k.kode_kriteria,
        nama_kriteria: k.nama_kriteria,
        type: 'kriteria' as const,
        expanded: true,
        children: kodeAmis,
      };
    });
    setTreeData(tree);
  };

  const toggleExpanded = (id: string, nodes: TreeNode[]): TreeNode[] => {
    return nodes.map((node) => {
      if (node.id === id) return { ...node, expanded: !node.expanded };
      if (node.children) return { ...node, children: toggleExpanded(id, node.children) };
      return node;
    });
  };

  const handleToggleTree = (id: string) => {
    setTreeData(toggleExpanded(id, treeData));
  };

  const setAllExpanded = (expanded: boolean) => {
    const recurse = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => ({
        ...n,
        expanded: n.type === 'unsur' ? n.expanded : expanded,
        children: n.children ? recurse(n.children) : n.children,
      }));
    setTreeData((prev) => recurse(prev));
  };

  const handleToggleDetail = async (unsurId: string, isianId: string | null) => {
    if (!isianId) return;

    setExpandedDetails((prev) => ({ ...prev, [unsurId]: !prev[unsurId] }));

    if (!detailsCache[isianId] && !loadingDetails[isianId]) {
      try {
        setLoadingDetails((prev) => ({ ...prev, [isianId]: true }));
        const token = localStorage.getItem('ami_token');
        const res = await fetch(`/api/isians/${isianId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setDetailsCache((prev) => ({ ...prev, [isianId]: data.data }));
      } catch (error) {
        console.error('Failed to fetch isian detail for rekap:', error);
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [isianId]: false }));
      }
    }
  };

  const collectChildrenStatuses = (node: TreeNode): UnsurStatus[] => {
    const out: UnsurStatus[] = [];
    if (node.type === 'unsur') {
      const rawStatus = statusMap[node.id]?.status ?? 'kosong';
      out.push(rawStatus === 'valid' ? 'valid' : 'kosong');
      return out;
    }
    for (const child of node.children ?? []) {
      out.push(...collectChildrenStatuses(child));
    }
    return out;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderTree = (nodes: TreeNode[], level: number = 0) => {
    return nodes.map((node) => {
      const isUnsur = node.type === 'unsur';

      let unsurStatus: UnsurStatus = 'kosong';
      let unsurInfo: UnsurStatusInfo | null = null;
      let agg: ReturnType<typeof aggregateParentStatus> | null = null;

      if (isUnsur) {
        unsurInfo = statusMap[node.id] ?? null;
        const rawStatus = unsurInfo?.status ?? 'kosong';
        unsurStatus = rawStatus === 'valid' ? 'valid' : 'kosong';
      } else {
        const childStatuses = collectChildrenStatuses(node);
        agg = aggregateParentStatus(childStatuses);
      }

      const hasIsianData = unsurStatus === 'valid';
      const isDetailExpanded = !!expandedDetails[node.id];

      return (
        <div key={node.id} className={level > 0 ? 'pl-3 ml-2 border-l border-slate-200' : ''}>
          <div
            className={`group flex items-start gap-2 py-2 px-2.5 rounded-md transition-colors ${
              isUnsur && hasIsianData ? 'cursor-pointer hover:bg-slate-50' : !isUnsur ? 'hover:bg-slate-50' : ''
            }`}
            onClick={(e) => {
              if (isUnsur && hasIsianData && unsurInfo?.latest_isian_id) {
                e.stopPropagation();
                handleToggleDetail(node.id, unsurInfo.latest_isian_id);
              }
            }}
          >
            {/* expand caret (separate clickable button untuk parent) */}
            {!isUnsur && node.children && node.children.length > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleTree(node.id);
                }}
                className="mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500 transition-colors"
                aria-label={node.expanded ? 'Tutup' : 'Buka'}
              >
                <ChevronDown
                  size={15}
                  className={`transition-transform ${node.expanded ? '' : '-rotate-90'}`}
                />
              </button>
            ) : (
              <span className="w-5 shrink-0 flex justify-center items-center">
                 {isUnsur && hasIsianData && (
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDetailExpanded ? 'rotate-180 text-indigo-600' : ''}`} />
                 )}
              </span>
            )}

            {/* status indicator (left) */}
            {isUnsur ? (
              <span className="mt-1 shrink-0">
                <StatusDot status={unsurStatus} />
              </span>
            ) : (
              <span className="mt-1 shrink-0">
                <StatusDot status={agg?.primary ?? 'kosong'} />
              </span>
            )}

            {/* label */}
            <div
              className={`flex-1 min-w-0 ${!isUnsur ? 'cursor-pointer select-none' : ''}`}
              onClick={(e) => {
                if (!isUnsur) {
                  e.stopPropagation();
                  handleToggleTree(node.id);
                }
              }}
            >
              {node.type === 'kriteria' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 text-sm">
                    [{node.kode_kriteria}] {node.nama_kriteria}
                  </span>
                  {agg && agg.total > 0 && <ParentStatChips agg={agg} />}
                </div>
              )}

              {node.type === 'ami' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-700 text-sm">{node.kode_ami}</span>
                  {agg && agg.total > 0 && <ParentStatChips agg={agg} compact />}
                </div>
              )}

              {node.type === 'area' && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-slate-700">📋 {node.deskripsi_area_audit}</span>
                  {agg && agg.total > 0 && <ParentStatChips agg={agg} compact />}
                </div>
              )}

              {node.type === 'unsur' && (
                <div className="flex flex-col gap-1">
                  <div className={`flex items-start gap-2 text-sm ${isDetailExpanded ? 'text-indigo-700 font-semibold' : 'text-slate-700'}`}>
                    <span className="line-clamp-2">{node.isi_unsur}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <StatusBadge status={unsurStatus} />
                    {unsurInfo && unsurInfo.counts.total > 0 && (
                      <span className="text-slate-500">
                        {unsurInfo.counts.total} isian dari prodi
                        {unsurInfo.latest_dosen_nama && (
                          <span className="text-slate-400">
                            {' '}
                            • terakhir oleh <span className="text-slate-600 font-medium">{unsurInfo.latest_dosen_nama}</span>
                          </span>
                        )}
                      </span>
                    )}
                    {unsurStatus === 'valid' && (
                       <span className="text-[10px] text-slate-400 italic">(Klik untuk {isDetailExpanded ? 'tutup' : 'lihat detail'})</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Render Detail Isian Accordion untuk Unsur yang di-expand */}
          {isUnsur && isDetailExpanded && unsurInfo?.latest_isian_id && (
             <div className="ml-10 mb-3 mt-1 p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-sm animate-fade-in">
                 {loadingDetails[unsurInfo.latest_isian_id] ? (
                   <div className="flex items-center gap-2 text-slate-500 py-2">
                     <div className="w-4 h-4 border-2 border-[#0a2f6f] border-t-transparent rounded-full animate-spin" />
                     <span>Memuat detail...</span>
                   </div>
                 ) : detailsCache[unsurInfo.latest_isian_id] ? (
                   (() => {
                     const detail = detailsCache[unsurInfo.latest_isian_id!];
                     return (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm">
                         <div className="space-y-3">
                           <div>
                             <span className="font-semibold text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">Judul Dokumen</span>
                             <span className="text-slate-800 font-semibold">{detail.judul_dokumen || '-'}</span>
                           </div>
                           <div>
                             <span className="font-semibold text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">Dosen Pengisi</span>
                             <span className="text-slate-800 font-semibold block">{detail.dosen?.nama_lengkap}</span>
                             <span className="text-slate-400 block text-xs">NIP: {detail.dosen?.nip}</span>
                           </div>
                           <div>
                             <span className="font-semibold text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">Capaian</span>
                             <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed shadow-sm">
                               {detail.capaian || 'Tidak ada capaian'}
                             </p>
                           </div>
                         </div>
                         <div className="space-y-3">
                           <div>
                             <span className="font-semibold text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">Tahun Pelaksanaan</span>
                             <span className="text-slate-800 font-semibold">{detail.tahun_pelaksanaan || '-'}</span>
                           </div>
                           <div>
                             <span className="font-semibold text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">Keterangan</span>
                             <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed shadow-sm">
                               {detail.keterangan || 'Tidak ada keterangan tambahan'}
                             </p>
                           </div>
                           <div>
                             <span className="font-semibold text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">Bukti Fisik</span>
                             <div className="flex flex-wrap gap-2 mt-1.5">
                               {detail.bukti_link && (
                                 <a
                                   href={detail.bukti_link}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-2 rounded-xl border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition shadow-sm"
                                 >
                                   <ExternalLink size={14} />
                                   Lihat Link Bukti
                                 </a>
                               )}
                               {detail.bukti_files?.map((f: any) => (
                                 <a
                                   key={f.id}
                                   href={f.file_path}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-200 transition shadow-sm max-w-xs"
                                 >
                                   <Download size={14} className="text-slate-500 shrink-0" />
                                   <span className="truncate flex-1">{f.original_name}</span>
                                   <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">
                                     ({formatFileSize(parseInt(f.file_size.toString()))})
                                   </span>
                                 </a>
                               ))}
                               {!detail.bukti_link && (!detail.bukti_files || detail.bukti_files.length === 0) && (
                                 <span className="text-slate-400 italic text-xs">Tidak ada bukti fisik</span>
                               )}
                             </div>
                           </div>
                         </div>
                       </div>
                     );
                   })()
                 ) : (
                   <div className="text-red-500 text-xs">Gagal memuat detail data.</div>
                 )}
             </div>
          )}

          {!isUnsur && node.expanded && node.children && (
            <div className="mt-1">{renderTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0a2f6f]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0a2f6f] tracking-tight">
          Rekap AMI Prodi
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Rekapitulasi status pengisian setiap unsur AMI di prodi Anda. Klik unsur yang sudah terisi untuk melihat detail (View Only).
        </p>
      </div>

      {treeData.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
            <ClipboardList size={22} />
          </div>
          <p className="text-slate-500 text-sm">
            Belum ada instrumen aktif atau data kosong.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 animate-fade-in">
           <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label className="block text-sm font-bold text-slate-700">
                  Struktur Instrumen
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAllExpanded(true)}
                    className="text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                  >
                    Buka Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllExpanded(false)}
                    className="text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                  >
                    Tutup Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchStatusMap(prodiId)}
                    className="text-xs font-medium px-2.5 py-1 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    Refresh status
                  </button>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 max-h-[700px] overflow-y-auto bg-slate-50/50">
                <div className="space-y-1">{renderTree(treeData)}</div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}

function ParentStatChips({
  agg,
  compact = false,
}: {
  agg: { valid: number; total: number };
  compact?: boolean;
}) {
  const isAllValid = agg.valid === agg.total && agg.total > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      } ${
        isAllValid
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-slate-50 text-slate-600 border-slate-200'
      }`}
      title={`${agg.valid} Valid dari ${agg.total} Total`}
    >
      <CheckCircle size={10} className={isAllValid ? 'text-emerald-600' : 'text-slate-400'} />
      <span>{agg.valid}</span>
      <span className="text-slate-400 font-normal">/ {agg.total}</span>
    </span>
  );
}

function StatusDot({ status }: { status: UnsurStatus }) {
  const c = {
    valid: 'bg-emerald-500',
    proses: 'bg-amber-500',
    revisi: 'bg-rose-500',
    kosong: 'bg-slate-300',
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${c[status]}`} />;
}

function StatusBadge({ status }: { status: UnsurStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold ${m.bg} ${m.text} ${m.border}`}>
      {m.icon} {m.label}
    </span>
  );
}
