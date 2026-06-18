'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileUp,
  FileText,
  ChevronDown,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit3,
  CircleDashed,
  Plus,
  X,
} from 'lucide-react';

type UnsurStatus = 'valid' | 'revisi' | 'proses' | 'kosong';

interface UnsurStatusInfo {
  status: UnsurStatus;
  counts: { valid: number; revisi: number; proses: number; total: number };
  latest_isian_id: string | null;
  latest_dosen_nama: string | null;
  reviewed_at: string | null;
  updated_at: string | null;
}

type UnsurStatusMap = Record<string, UnsurStatusInfo>;

interface TreeNode {
  id: string;
  kode_kriteria?: string;
  nama_kriteria?: string;
  kode_ami?: string;
  isi_unsur?: string;
  deskripsi_area_audit?: string;
  type: 'kriteria' | 'ami' | 'area' | 'unsur';
  children?: TreeNode[];
  expanded?: boolean;
}

interface FileEntry {
  file: File | null;
  judul_dokumen: string;
  keterangan_dokumen: string;
  tahun_dokumen: string;
}

interface IsianForm {
  id?: number;
  status: UnsurStatus;
  pemeriksaan_unsur_id: string;
  judul_dokumen: string;
  ketersediaan_standar: 'ada' | 'tidak_ada';
  dokumen: 'ada' | 'tidak_ada';
  pencapaian_standar_spt_pt: boolean;
  pencapaian_standar_sn_dikti: boolean;
  daya_saing_lokal: boolean;
  daya_saing_nasional: boolean;
  daya_saing_internasional: boolean;
  bukti_link: string;
  tahun_pelaksanaan: string;
  capaian: string;
  keterangan: string;
  catatan_kaprodi?: string;
  bukti_files: FileEntry[];
  existing_files?: Array<{ id: string; file_name: string; original_name: string; file_path: string; judul_dokumen: string | null; keterangan_dokumen: string | null; tahun_dokumen: string | null }>;
}

// =====================================================================
// Helpers UI status
// =====================================================================
const STATUS_META: Record<
  UnsurStatus,
  { label: string; tone: string; bg: string; text: string; border: string; ring: string; icon: React.ReactNode }
> = {
  valid: {
    label: 'Valid',
    tone: 'emerald',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    ring: 'ring-emerald-300',
    icon: <CheckCircle size={12} />,
  },
  proses: {
    label: 'Menunggu Review',
    tone: 'amber',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    ring: 'ring-amber-300',
    icon: <Clock size={12} />,
  },
  revisi: {
    label: 'Perlu Revisi',
    tone: 'rose',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    ring: 'ring-rose-300',
    icon: <Edit3 size={12} />,
  },
  kosong: {
    label: 'Belum Diisi',
    tone: 'slate',
    bg: 'bg-slate-50',
    text: 'text-slate-500',
    border: 'border-slate-200',
    ring: 'ring-slate-300',
    icon: <CircleDashed size={12} />,
  },
};

function StatusBadge({
  status,
  size = 'sm',
}: {
  status: UnsurStatus;
  size?: 'sm' | 'xs';
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${meta.bg} ${meta.text} ${meta.border} ${
        size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      }`}
    >
      {meta.icon}
      <span>{meta.label}</span>
    </span>
  );
}

function StatusDot({ status }: { status: UnsurStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-white ${meta.ring} ${
        status === 'valid'
          ? 'bg-emerald-500'
          : status === 'proses'
          ? 'bg-amber-500'
          : status === 'revisi'
          ? 'bg-rose-500'
          : 'bg-slate-300'
      }`}
      aria-label={meta.label}
    />
  );
}

// Aggregate parent status mengikuti aturan: revisi > proses > valid > kosong (untuk perhatian)
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
    else if (s === 'proses') proses++;
    else if (s === 'revisi') revisi++;
    else kosong++;
  }
  let primary: UnsurStatus = 'kosong';
  if (revisi > 0) primary = 'revisi';
  else if (proses > 0) primary = 'proses';
  else if (valid > 0 && kosong === 0) primary = 'valid';
  else if (valid > 0) primary = 'proses';
  return { total: children.length, valid, proses, revisi, kosong, primary };
}

// =====================================================================
// Page
// =====================================================================
export default function IsiAmiPage() {
  const [instrumenName, setInstrumenName] = useState<string>('');
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedUnsur, setSelectedUnsur] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [statusMap, setStatusMap] = useState<UnsurStatusMap>({});

  const [isianForm, setIsianForm] = useState<IsianForm | null>(null);
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  useEffect(() => {
    loadActiveInstrumen();
    fetchStatusMap();
  }, []);

  const loadActiveInstrumen = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ami_token');
      const res = await fetch('/api/instrumens?is_active=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const aktif = data.data?.[0];
      if (!aktif) {
        setErrorMsg('Tidak ada instrumen aktif saat ini.');
        return;
      }
      setInstrumenName(aktif.nama_instrumen);
      // Langsung load struktur
      await fetchInstrumenStructure(aktif.id.toString());
    } catch (e) {
      console.error(e);
      setErrorMsg('Gagal memuat instrumen aktif');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusMap = async () => {
    try {
      const token = localStorage.getItem('ami_token');
      const res = await fetch('/api/isians/by-unsur', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.data?.data) setStatusMap(data.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInstrumenStructure = async (instrumenId: string) => {
    try {
      setLoading(true);
      setSelectedUnsur(null);
      setTreeData([]);

      const token = localStorage.getItem('ami_token');
      const res = await fetch(`/api/kriteria?instrumen_id=${instrumenId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.data) buildTree(data.data);
    } catch (e) {
      console.error(e);
      setErrorMsg('Gagal memuat struktur instrumen');
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (kriteria: any[]) => {
    const tree: TreeNode[] = kriteria.map((k) => {
      const kodeAmis = (k.kode_amis || []).map((ami: any) => {
        const deskripsiAreas = (ami.deskripsi_areas || []).map((area: any) => ({
          id: area.id ? `area-${area.id}` : `area-rnd-${Math.random()}`,
          deskripsi_area_audit: area.deskripsi_area_audit,
          type: 'area' as const,
          expanded: false,
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
          expanded: false,
          children: deskripsiAreas,
        };
      });

      return {
        id: k.id ? `kriteria-${k.id}` : `kriteria-rnd-${Math.random()}`,
        kode_kriteria: k.kode_kriteria,
        nama_kriteria: k.nama_kriteria,
        type: 'kriteria' as const,
        expanded: false,
        children: kodeAmis,
      };
    });
    setTreeData(tree);
  };

  // Set semua node expanded / collapsed
  const setAllExpanded = (expanded: boolean) => {
    const recurse = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => ({
        ...n,
        expanded: n.type === 'unsur' ? n.expanded : expanded,
        children: n.children ? recurse(n.children) : n.children,
      }));
    setTreeData((prev) => recurse(prev));
  };

  // Hitung rollup status untuk parent node (kriteria/ami/area)
  const collectChildrenStatuses = (node: TreeNode): UnsurStatus[] => {
    const out: UnsurStatus[] = [];
    if (node.type === 'unsur') {
      out.push(statusMap[node.id]?.status ?? 'kosong');
      return out;
    }
    for (const child of node.children ?? []) {
      out.push(...collectChildrenStatuses(child));
    }
    return out;
  };

  // Rekap global untuk progress bar atas
  const overallStats = useMemo(() => {
    const all: UnsurStatus[] = [];
    for (const k of treeData) all.push(...collectChildrenStatuses(k));
    return aggregateParentStatus(all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeData, statusMap]);

  const toggleExpanded = (id: string, nodes: TreeNode[]): TreeNode[] => {
    return nodes.map((node) => {
      if (node.id === id) return { ...node, expanded: !node.expanded };
      if (node.children)
        return { ...node, children: toggleExpanded(id, node.children) };
      return node;
    });
  };


  const handleNodeClick = async (e: React.MouseEvent | any, id: string) => {
    if(e?.stopPropagation) e.stopPropagation();
    setSelectedUnsur(id);
    resetForm(id);

    try {
      const token = localStorage.getItem('ami_token');
      const res = await fetch(
        `/api/isians?pemeriksaan_unsur_id=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      const items = json.data ?? [];
      
      if (items.length > 0) {
        const item = items[0]; // Hanya ambil isian pertama (1 unsur 1 isian)
        setIsianForm({
          id: item.id,
          status: item.status,
          pemeriksaan_unsur_id: id,
          judul_dokumen: item.judul_dokumen ?? '',
          ketersediaan_standar: item.ketersediaan_standar ?? 'tidak_ada',
          dokumen: item.dokumen ?? 'tidak_ada',
          pencapaian_standar_spt_pt: item.pencapaian_standar_spt_pt ?? false,
          pencapaian_standar_sn_dikti: item.pencapaian_standar_sn_dikti ?? false,
          daya_saing_lokal: item.daya_saing_lokal ?? false,
          daya_saing_nasional: item.daya_saing_nasional ?? false,
          daya_saing_internasional: item.daya_saing_internasional ?? false,
          bukti_link: item.bukti_link ?? '',
          tahun_pelaksanaan: item.tahun_pelaksanaan ?? '',
          capaian: item.capaian ?? '',
          keterangan: item.keterangan ?? '',
          catatan_kaprodi: item.catatan_kaprodi ?? '',
          bukti_files: [{ file: null, judul_dokumen: '', keterangan_dokumen: '', tahun_dokumen: '' }],
          existing_files: item.bukti_files ?? [],
        });
        setSuccessMsg('Memuat isian.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      // ignore
    }
  };
  const handleToggle = (id: string) => {
    setTreeData(toggleExpanded(id, treeData));
  };

  const resetForm = (newId?: string) => {
    setIsianForm({
      status: 'kosong',
      pemeriksaan_unsur_id: newId !== undefined ? newId : (selectedUnsur || ''),
      judul_dokumen: '',
      ketersediaan_standar: 'tidak_ada',
      dokumen: 'tidak_ada',
      pencapaian_standar_spt_pt: false,
      pencapaian_standar_sn_dikti: false,
      daya_saing_lokal: false,
      daya_saing_nasional: false,
      daya_saing_internasional: false,
      bukti_link: '',
      tahun_pelaksanaan: '',
      capaian: '',
      keterangan: '',
      bukti_files: [{ file: null, judul_dokumen: '', keterangan_dokumen: '', tahun_dokumen: '' }],
      existing_files: [],
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setIsianForm((prev) => {
      if (!prev) return prev;
      if (type === 'checkbox') {
        return { ...prev, [name]: (e.target as HTMLInputElement).checked };
      }
      return { ...prev, [name]: value };
    });
  };
  const handleFileMetaChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setIsianForm((prev) => {
      if (!prev) return prev;
      const newFiles = [...prev.bukti_files];
      newFiles[index] = { ...newFiles[index], [name]: value };
      return { ...prev, bukti_files: newFiles };
    });
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setIsianForm((prev) => {
      if (!prev) return prev;
      const newFiles = [...prev.bukti_files];
      newFiles[index] = { ...newFiles[index], file };
      return { ...prev, bukti_files: newFiles };
    });
  };

  const addFileField = () => {
    setIsianForm((prev) => {
      if (!prev) return prev;
      return { 
        ...prev, 
        bukti_files: [...prev.bukti_files, { file: null, judul_dokumen: '', keterangan_dokumen: '', tahun_dokumen: '' }] 
      };
    });
  };

  const removeFileField = (index: number) => {
    setIsianForm((prev) => {
      if (!prev) return prev;
      const newFiles = [...prev.bukti_files];
      newFiles.splice(index, 1);
      if (newFiles.length === 0) newFiles.push({ file: null, judul_dokumen: '', keterangan_dokumen: '', tahun_dokumen: '' });
      return { ...prev, bukti_files: newFiles };
    });
  };
  const handleSubmit = async (isDraft: boolean = false) => {
    if (!selectedUnsur || !isianForm) {
      setErrorMsg('Pilih unsur yang akan diisi');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const token = localStorage.getItem('ami_token');
      const periode = await fetch('/api/periodes?is_active=true', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());

      if (!periode.data || periode.data.length === 0) {
        setErrorMsg('Tidak ada periode aktif');
        return;
      }

      if (isianForm.status === 'valid') {
        setErrorMsg('Isian yang sudah valid tidak dapat diubah');
        return;
      }

      const formDataObj = new FormData();
      formDataObj.append('pemeriksaan_unsur_id', isianForm.pemeriksaan_unsur_id);
      formDataObj.append('periode_id', periode.data[0].id.toString());
      formDataObj.append('is_draft', isDraft.toString());
      formDataObj.append('judul_dokumen', isianForm.judul_dokumen);
      formDataObj.append('ketersediaan_standar', isianForm.ketersediaan_standar);
      formDataObj.append('dokumen', isianForm.dokumen);
      formDataObj.append('pencapaian_standar_spt_pt', isianForm.pencapaian_standar_spt_pt.toString());
      formDataObj.append('pencapaian_standar_sn_dikti', isianForm.pencapaian_standar_sn_dikti.toString());
      formDataObj.append('daya_saing_lokal', isianForm.daya_saing_lokal.toString());
      formDataObj.append('daya_saing_nasional', isianForm.daya_saing_nasional.toString());
      formDataObj.append('daya_saing_internasional', isianForm.daya_saing_internasional.toString());
      formDataObj.append('bukti_link', isianForm.bukti_link);
      formDataObj.append('tahun_pelaksanaan', isianForm.tahun_pelaksanaan);
      formDataObj.append('capaian', isianForm.capaian);
      formDataObj.append('keterangan', isianForm.keterangan);
      
      for (const f of isianForm.bukti_files) {
        if (f.file) {
          formDataObj.append('bukti_files[]', f.file);
          formDataObj.append('judul_dokumen_file[]', f.judul_dokumen);
          formDataObj.append('keterangan_dokumen_file[]', f.keterangan_dokumen);
          formDataObj.append('tahun_dokumen_file[]', f.tahun_dokumen);
        }
      }

      const res = await fetch('/api/isians', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataObj,
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.message || 'Gagal menyimpan isian');
      }

      setSuccessMsg(isDraft ? 'Draft berhasil disimpan' : 'Isian berhasil dikirim untuk review');
      
      handleNodeClick({ stopPropagation: () => {} } as any, selectedUnsur);
      fetchStatusMap();

    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Terjadi kesalahan server saat menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  // ===================================================================
  // Tree renderer dengan indikator status
  // ===================================================================
  const renderTree = (nodes: TreeNode[], level: number = 0) => {
    return nodes.map((node) => {
      const isUnsur = node.type === 'unsur';
      const isSelected = selectedUnsur === node.id;

      let unsurStatus: UnsurStatus = 'kosong';
      let unsurInfo: UnsurStatusInfo | null = null;
      let agg: ReturnType<typeof aggregateParentStatus> | null = null;

      if (isUnsur) {
        unsurInfo = statusMap[node.id] ?? null;
        unsurStatus = unsurInfo?.status ?? 'kosong';
      } else {
        const childStatuses = collectChildrenStatuses(node);
        agg = aggregateParentStatus(childStatuses);
      }

      return (
        <div key={node.id} className={level > 0 ? 'pl-3 ml-2 border-l border-slate-200' : ''}>
          <div
            className={`group flex items-start gap-2 py-2 px-2.5 rounded-md transition-colors ${
              isSelected
                ? 'bg-indigo-50 ring-1 ring-indigo-200'
                : 'hover:bg-slate-50'
            } ${isUnsur ? 'cursor-pointer' : ''}`}
            onClick={(e) => {
              if (isUnsur) handleNodeClick(e, node.id);
            }}
            role={isUnsur ? 'button' : undefined}
          >
            {/* expand caret (separate clickable button untuk parent) */}
            {!isUnsur && node.children && node.children.length > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(node.id);
                }}
                className="mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500 transition-colors"
                aria-label={node.expanded ? 'Tutup' : 'Buka'}
              >
                <ChevronDown
                  size={15}
                  className={`transition-transform ${
                    node.expanded ? '' : '-rotate-90'
                  }`}
                />
              </button>
            ) : (
              <span className="w-5 shrink-0" />
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
              className={`flex-1 min-w-0 ${
                !isUnsur ? 'cursor-pointer select-none' : ''
              }`}
              onClick={(e) => {
                if (!isUnsur) {
                  e.stopPropagation();
                  handleToggle(node.id);
                }
              }}
            >
              {node.type === 'kriteria' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 text-sm">
                    [{node.kode_kriteria}] {node.nama_kriteria}
                  </span>
                  {agg && agg.total > 0 && (
                    <ParentStatChips agg={agg} />
                  )}
                </div>
              )}

              {node.type === 'ami' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-700 text-sm">
                    {node.kode_ami}
                  </span>
                  {agg && agg.total > 0 && <ParentStatChips agg={agg} compact />}
                </div>
              )}

              {node.type === 'area' && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-slate-700">
                    📋 {node.deskripsi_area_audit}
                  </span>
                  {agg && agg.total > 0 && (
                    <ParentStatChips agg={agg} compact />
                  )}
                </div>
              )}

              {node.type === 'unsur' && (
                <div className="flex flex-col gap-1">
                  <div
                    className={`flex items-start gap-2 text-sm ${
                      isSelected ? 'text-indigo-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
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
                            • terakhir oleh{' '}
                            <span className="text-slate-600 font-medium">
                              {unsurInfo.latest_dosen_nama}
                            </span>
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isUnsur && node.expanded && node.children && (
            <div className="mt-1">{renderTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  // ===================================================================
  // Main JSX
  // ===================================================================
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Isi AMI</h1>
        <p className="text-slate-500 text-sm mt-1">
          Lengkapi instrumen AMI dengan data dan bukti yang diperlukan. Status di setiap unsur
          mencerminkan kondisi pengisian seluruh prodi.
        </p>
      </div>

      {/* === Legenda + Progres Prodi === */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Status Pengisian Prodi</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Wadah AMI bersifat kolektif. Indikator pada tiap unsur dihitung dari isian
              seluruh dosen di prodi Anda.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="valid" />
            <StatusBadge status="proses" />
            <StatusBadge status="revisi" />
            <StatusBadge status="kosong" />
          </div>
        </div>

        {overallStats.total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>
                {overallStats.total - overallStats.kosong} dari {overallStats.total} unsur sudah
                memiliki isian
              </span>
              <span className="font-semibold text-slate-700">
                {Math.round(
                  ((overallStats.total - overallStats.kosong) / overallStats.total) * 100
                )}
                %
              </span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
              <div
                className="bg-emerald-500"
                style={{ width: `${(overallStats.valid / overallStats.total) * 100}%` }}
                title={`${overallStats.valid} valid`}
              />
              <div
                className="bg-amber-500"
                style={{ width: `${(overallStats.proses / overallStats.total) * 100}%` }}
                title={`${overallStats.proses} menunggu review`}
              />
              <div
                className="bg-rose-500"
                style={{ width: `${(overallStats.revisi / overallStats.total) * 100}%` }}
                title={`${overallStats.revisi} perlu revisi`}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
              <CounterCell color="emerald" label="Valid" value={overallStats.valid} />
              <CounterCell color="amber" label="Menunggu Review" value={overallStats.proses} />
              <CounterCell color="rose" label="Perlu Revisi" value={overallStats.revisi} />
              <CounterCell color="slate" label="Belum Diisi" value={overallStats.kosong} />
            </div>
          </div>
        )}
      </div>

      {!selectedUnsur ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Info instrumen aktif */}
          {instrumenName && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#eef4ff] border border-[#cfdbf2]">
              <FileText size={18} className="text-[#0a2f6f] shrink-0" />
              <div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[#0a2f6f]/70">
                  Instrumen Aktif
                </div>
                <div className="text-sm font-semibold text-[#0a2f6f]">{instrumenName}</div>
              </div>
            </div>
          )}

          {treeData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label className="block text-sm font-bold text-slate-700">
                  Struktur Instrumen
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !isAllExpanded;
                      setIsAllExpanded(nextState);
                      setAllExpanded(nextState);
                    }}
                    className="text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                  >
                    {isAllExpanded ? 'Tutup Semua' : 'Buka Semua'}
                  </button>
                  <button
                    type="button"
                    onClick={fetchStatusMap}
                    className="text-xs font-medium px-2.5 py-1 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    Refresh status
                  </button>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 max-h-[640px] overflow-y-auto bg-slate-50">
                <div className="space-y-1">{renderTree(treeData)}</div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Klik baris <strong>unsur</strong> (titik kecil) untuk mengisi formulir AMI.
                Klik chevron / nama parent untuk membuka isinya.
              </p>
            </div>
          )}

          {!loading && treeData.length === 0 && !errorMsg && (
            <p className="text-sm text-slate-500 text-center py-8">
              Tidak ada data struktur instrumen.
            </p>
          )}

          {loading && treeData.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setSelectedUnsur(null)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Kembali ke Struktur"
              >
                <ChevronDown size={20} className="rotate-90" />
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                <CheckCircle size={18} className="text-indigo-600" />
                <span className="text-sm text-indigo-700 font-medium">
                  Mengisi form unsur terpilih
                </span>
              </div>
              {statusMap[selectedUnsur] && (
                <StatusBadge status={statusMap[selectedUnsur].status} />
              )}
            </div>
          </div>

          {/* Breadcrumb posisi unsur */}
          <UnsurBreadcrumb treeData={treeData} selectedUnsurId={selectedUnsur} />

          {/* Info kolektif unsur ini */}
          {statusMap[selectedUnsur] && statusMap[selectedUnsur].counts.total > 0 && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
              Unsur ini sudah memiliki <strong>{statusMap[selectedUnsur].counts.total}</strong>{' '}
              isian dari dosen prodi.
              {statusMap[selectedUnsur].counts.valid > 0 &&
                ` ${statusMap[selectedUnsur].counts.valid} sudah valid.`}
              {statusMap[selectedUnsur].counts.proses > 0 &&
                ` ${statusMap[selectedUnsur].counts.proses} menunggu review.`}
              {statusMap[selectedUnsur].counts.revisi > 0 &&
                ` ${statusMap[selectedUnsur].counts.revisi} perlu revisi.`}{' '}
              Anda boleh menambah isian baru bila perlu.
            </div>
          )}

                    <div className="space-y-8">
            {isianForm && (() => {
              const formData = isianForm;
              const isUnsurValid = formData.status === 'valid';
              const inputClasses = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-800 disabled:border-transparent disabled:opacity-100 disabled:shadow-none";
              const selectClasses = "w-full appearance-none border border-slate-300 rounded-lg pl-3 pr-10 py-2.5 text-sm bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer hover:border-indigo-400 transition-colors disabled:bg-slate-50 disabled:text-slate-800 disabled:border-transparent disabled:opacity-100 disabled:cursor-default disabled:appearance-none disabled:shadow-none disabled:hover:border-transparent";

              return (
                <div className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm space-y-5 relative">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                        1
                      </span>
                      Formulir Isian AMI
                    </h3>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={formData.status} />
                    </div>
                  </div>

                  {formData.catatan_kaprodi && (
                    <div className="bg-rose-50 text-rose-700 p-4 rounded-lg border border-rose-200 text-sm">
                      <strong className="font-semibold block mb-1">Catatan Revisi Kaprodi:</strong>
                      {formData.catatan_kaprodi}
                    </div>
                  )}

                  <fieldset disabled={isUnsurValid} className="space-y-5">
                    {/* Row 1 */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Judul Isian <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          name="judul_dokumen"
                          value={formData.judul_dokumen}
                          onChange={(e) => handleInputChange(e)}
                          placeholder="Judul pokok isian"
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Pelaksanaan</label>
                        <input
                          type="number"
                          name="tahun_pelaksanaan"
                          value={formData.tahun_pelaksanaan}
                          onChange={(e) => handleInputChange(e)}
                          placeholder="2024"
                          min="1900"
                          max="2099"
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    {/* Ketersediaan & Dokumen */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ketersediaan Standar</label>
                        <div className="relative">
                          <select
                            name="ketersediaan_standar"
                            value={formData.ketersediaan_standar}
                            onChange={(e) => handleInputChange(e)}
                            className={selectClasses}
                          >
                            <option value="ada">Ada</option>
                            <option value="tidak_ada">Tidak Ada</option>
                          </select>
                          {!isUnsurValid && (
                            <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dokumen / Bukti Fisik</label>
                        <div className="relative">
                          <select
                            name="dokumen"
                            value={formData.dokumen}
                            onChange={(e) => handleInputChange(e)}
                            className={selectClasses}
                          >
                            <option value="ada">Ada</option>
                            <option value="tidak_ada">Tidak Ada</option>
                          </select>
                          {!isUnsurValid && (
                            <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pencapaian Standar */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-slate-700 mb-3">Pencapaian Standar</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="pencapaian_standar_spt_pt"
                            checked={formData.pencapaian_standar_spt_pt}
                            onChange={(e) => handleInputChange(e)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span className="text-sm text-slate-700">Pencapaian Standar SPT PT</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="pencapaian_standar_sn_dikti"
                            checked={formData.pencapaian_standar_sn_dikti}
                            onChange={(e) => handleInputChange(e)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span className="text-sm text-slate-700">Pencapaian Standar SN Dikti</span>
                        </label>
                      </div>
                    </div>

                    {/* Daya Saing */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-slate-700 mb-3">Daya Saing</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="daya_saing_lokal"
                            checked={formData.daya_saing_lokal}
                            onChange={(e) => handleInputChange(e)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span className="text-sm text-slate-700">Daya Saing Lokal</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="daya_saing_nasional"
                            checked={formData.daya_saing_nasional}
                            onChange={(e) => handleInputChange(e)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span className="text-sm text-slate-700">Daya Saing Nasional</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="daya_saing_internasional"
                            checked={formData.daya_saing_internasional}
                            onChange={(e) => handleInputChange(e)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span className="text-sm text-slate-700">Daya Saing Internasional</span>
                        </label>
                      </div>
                    </div>

                    {/* Bukti Link */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Link Bukti (URL)</label>
                      <input
                        type="url"
                        name="bukti_link"
                        value={formData.bukti_link}
                        onChange={(e) => handleInputChange(e)}
                        placeholder="https://..."
                        className={inputClasses}
                      />
                    </div>

                    {/* File Upload / Existing Files */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">
                          {isUnsurValid ? 'Dokumen Bukti' : 'Upload Multi Dokumen Bukti'}
                        </label>
                        {!isUnsurValid && (
                          <button
                            type="button"
                            onClick={() => addFileField()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                          >
                            <Plus size={14} /> Tambah Dokumen Baru
                          </button>
                        )}
                      </div>

                      {isUnsurValid ? (
                        <div className="space-y-3">
                          {formData.existing_files && formData.existing_files.length > 0 ? (
                            formData.existing_files.map((file: any) => (
                              <div key={file.id} className="p-4 rounded-lg border border-slate-200 bg-white">
                                <a
                                  href={file.file_path}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-3 hover:text-indigo-600 mb-2"
                                >
                                  <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                    <FileText size={20} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold text-slate-800 truncate">{file.judul_dokumen || file.original_name}</div>
                                    {file.tahun_dokumen && <div className="text-xs text-slate-500 mt-0.5">Tahun: {file.tahun_dokumen}</div>}
                                  </div>
                                </a>
                                {file.keterangan_dokumen && (
                                  <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                    {file.keterangan_dokumen}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-slate-500 italic p-3 rounded-lg bg-slate-50 border border-transparent">
                              Tidak ada dokumen yang diunggah.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {formData.existing_files && formData.existing_files.length > 0 && (
                            <div className="mb-4 space-y-3">
                              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dokumen Tersimpan (Read Only)</div>
                              {formData.existing_files.map((file: any) => (
                                <div key={file.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                                  <a
                                    href={file.file_path}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 hover:text-indigo-600 mb-2"
                                  >
                                    <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                      <FileText size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-bold text-slate-800 truncate">{file.judul_dokumen || file.original_name}</div>
                                      {file.tahun_dokumen && <div className="text-xs text-slate-500 mt-0.5">Tahun: {file.tahun_dokumen}</div>}
                                    </div>
                                  </a>
                                  {file.keterangan_dokumen && (
                                    <div className="mt-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-200">
                                      {file.keterangan_dokumen}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-4 border-t border-slate-200 pt-4">
                            {formData.bukti_files.map((fileEntry, fileIndex) => (
                              <div key={fileIndex} className="p-4 border border-indigo-100 rounded-lg bg-indigo-50/30 relative space-y-4">
                                {fileIndex > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => removeFileField(fileIndex)}
                                    className="absolute top-3 right-3 p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                                    title="Hapus kolom ini"
                                  >
                                    <X size={18} />
                                  </button>
                                )}
                                
                                <div className="grid sm:grid-cols-2 gap-4 pr-8">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Judul File <span className="text-rose-500">*</span></label>
                                    <input
                                      type="text"
                                      name="judul_dokumen"
                                      value={fileEntry.judul_dokumen}
                                      onChange={(e) => handleFileMetaChange(fileIndex, e)}
                                      placeholder="Misal: Sertifikat A"
                                      className={inputClasses}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Tahun File</label>
                                    <input
                                      type="text"
                                      name="tahun_dokumen"
                                      value={fileEntry.tahun_dokumen}
                                      onChange={(e) => handleFileMetaChange(fileIndex, e)}
                                      placeholder="2024"
                                      className={inputClasses}
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Keterangan File</label>
                                  <textarea
                                    name="keterangan_dokumen"
                                    value={fileEntry.keterangan_dokumen}
                                    onChange={(e) => handleFileMetaChange(fileIndex, e)}
                                    placeholder="Penjelasan singkat tentang dokumen ini..."
                                    rows={2}
                                    className={inputClasses}
                                  />
                                </div>

                                <div className="mt-2">
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Upload PDF/JPG/PNG <span className="text-rose-500">*</span></label>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 border border-dashed border-slate-300 rounded-lg p-3 text-center hover:border-indigo-400 transition-colors cursor-pointer relative bg-white">
                                      <input
                                        type="file"
                                        onChange={(e) => handleFileChange(fileIndex, e)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                      />
                                      <div className="flex flex-col items-center gap-1">
                                        <FileUp size={16} className="text-slate-400" />
                                        <div>
                                          <p className="text-xs font-medium text-slate-700">{fileEntry.file ? 'Ganti file' : 'Pilih file upload'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {fileEntry.file && <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1"><CheckCircle size={12}/> {fileEntry.file.name}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Capaian */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Capaian</label>
                      <textarea
                        name="capaian"
                        value={formData.capaian}
                        onChange={(e) => handleInputChange(e)}
                        placeholder="Jelaskan capaian yang sudah dicapai..."
                        rows={3}
                        className={`${inputClasses} resize-none`}
                      />
                    </div>

                    {/* Keterangan */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Tambahan</label>
                      <textarea
                        name="keterangan"
                        value={formData.keterangan}
                        onChange={(e) => handleInputChange(e)}
                        placeholder="Catatan atau penjelasan lainnya..."
                        rows={3}
                        className={`${inputClasses} resize-none`}
                      />
                    </div>
                  </fieldset>
                </div>
              );
            })()}
            </div>

            {/* Messages */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
                <CheckCircle size={16} /> {successMsg}
              </div>
            )}

            {/* Global Submit Buttons */}
            <div className="flex gap-3 pt-6 border-t border-slate-200 sticky bottom-0 bg-white/90 backdrop-blur pb-4 z-10">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm font-semibold shadow-sm"
              >
                <Save size={18} /> Simpan Draft Semua
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-semibold shadow-sm"
              >
                <Send size={18} /> Kirim untuk Review
              </button>
            </div>
          </div>
      )}
    </div>
  );
}

// =====================================================================
// Sub-komponen kecil
// =====================================================================
function ParentStatChips({
  agg,
  compact = false,
}: {
  agg: { valid: number; proses: number; revisi: number; kosong: number; total: number };
  compact?: boolean;
}) {
  const items: Array<{ s: UnsurStatus; n: number }> = [
    { s: 'valid', n: agg.valid },
    { s: 'proses', n: agg.proses },
    { s: 'revisi', n: agg.revisi },
    { s: 'kosong', n: agg.kosong },
  ];
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {items.map(({ s, n }) =>
        n > 0 ? (
          <span
            key={s}
            className={`inline-flex items-center gap-1 rounded-full ${STATUS_META[s].bg} ${STATUS_META[s].text} ${STATUS_META[s].border} border ${
              compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
            } font-semibold`}
            title={`${STATUS_META[s].label}: ${n}`}
          >
            {STATUS_META[s].icon}
            <span>{n}</span>
          </span>
        ) : null
      )}
      <span className="text-[10px] text-slate-400 ml-0.5">/ {agg.total}</span>
    </span>
  );
}

function CounterCell({
  color,
  label,
  value,
}: {
  color: 'emerald' | 'amber' | 'rose' | 'slate';
  label: string;
  value: number;
}) {
  const map = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-300',
  };
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
      <span className={`w-2 h-2 rounded-full ${map[color]}`} />
      <span className="text-slate-600">{label}</span>
      <span className="ml-auto font-bold text-slate-800">{value}</span>
    </div>
  );
}

function UnsurBreadcrumb({
  treeData,
  selectedUnsurId,
}: {
  treeData: TreeNode[];
  selectedUnsurId: string;
}) {
  // Cari path dari root ke unsur terpilih
  const findPath = (
    nodes: TreeNode[],
    targetId: string,
    path: TreeNode[] = []
  ): TreeNode[] | null => {
    for (const node of nodes) {
      const currentPath = [...path, node];
      if (node.id === targetId) return currentPath;
      if (node.children) {
        const found = findPath(node.children, targetId, currentPath);
        if (found) return found;
      }
    }
    return null;
  };

  const path = findPath(treeData, selectedUnsurId);
  if (!path || path.length === 0) return null;

  const kriteria = path.find((n) => n.type === 'kriteria');
  const ami = path.find((n) => n.type === 'ami');
  const area = path.find((n) => n.type === 'area');
  const unsur = path.find((n) => n.type === 'unsur');

  return (
    <div className="rounded-xl bg-[#eef4ff] border border-[#cfdbf2] p-4 space-y-2">
      <div className="text-[11px] uppercase tracking-wider font-semibold text-[#0a2f6f]/70">
        Posisi Unsur yang Sedang Diisi
      </div>

      {/* Breadcrumb path */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
        {kriteria && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-[#0a2f6f]">
            {kriteria.kode_kriteria}
          </span>
        )}
        {ami && (
          <>
            <span className="text-slate-400">›</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 font-medium text-slate-700">
              {ami.kode_ami}
            </span>
          </>
        )}
      </div>

      {/* Area audit */}
      {area && (
        <div className="text-sm text-slate-700 leading-relaxed">
          <span className="font-semibold text-[#0a2f6f]">Area Audit:</span>{' '}
          <span className="line-clamp-3">{area.deskripsi_area_audit}</span>
        </div>
      )}

      {/* Unsur yang diisi */}
      {unsur && (
        <div className="text-sm text-slate-800 bg-white rounded-lg border border-[#cfdbf2] p-3 mt-1">
          <span className="font-semibold text-[#0a2f6f]">Unsur Pemeriksaan:</span>{' '}
          <span>{unsur.isi_unsur}</span>
        </div>
      )}

      {/* Nama kriteria lengkap */}
      {kriteria?.nama_kriteria && (
        <div className="text-[11px] text-slate-500 mt-1">
          Kriteria: {kriteria.nama_kriteria}
        </div>
      )}
    </div>
  );
}
