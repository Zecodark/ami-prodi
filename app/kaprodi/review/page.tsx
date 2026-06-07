'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
<<<<<<< HEAD
  ChevronRight,
=======
  CheckCircle2,
  AlertCircle,
>>>>>>> 3771f88 (perbaiki fungsi rekap dan tampilan kaprodi)
  Clock,
  FileText,
  CheckCircle2,
  Circle,
} from 'lucide-react';

<<<<<<< HEAD
interface Periode {
  id: string;
  tahun: string;
  is_active?: boolean;
}

interface Instrumen {
  id: string;
  nama_instrumen: string;
}

interface KriteriaData {
  id: string;
  kode_kriteria: string;
  nama_kriteria: string;
  urutan: number;
  kode_amis: KodeAmi[];
}

interface KodeAmi {
  id: string;
=======
interface BuktiFile {
  id: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
}

interface IsianDetail {
  id: string;
  judul_dokumen: string;
  ketersediaan_standar: string;
  dokumen: string;
  pencapaian_standar_spt_pt: boolean;
  pencapaian_standar_sn_dikti: boolean;
  daya_saing_lokal: boolean;
  daya_saing_nasional: boolean;
  daya_saing_internasional: boolean;
  bukti_link: string | null;
  tahun_pelaksanaan: string | null;
  capaian: string | null;
  keterangan: string | null;
  status: 'proses' | 'valid' | 'revisi';
  catatan_kaprodi: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  dosen: { nama_lengkap: string; nip: string };
  prodi: { nama_prodi: string; jenjang: string };
  bukti_files: BuktiFile[];
  pemeriksaan_unsur: {
    id: number;
    isi_unsur: string;
    deskripsi_area: {
      deskripsi_area_audit: string;
      kode_ami: {
        kode_ami: string;
        kriteria: {
          nama_kriteria: string;
        };
      };
    };
  };
  review_logs?: Array<{
    id: string;
    status_sebelum: string;
    status_sesudah: string;
    catatan: string | null;
    created_at: string;
  }>;
}

interface InstrumenRow {
  no: number;
>>>>>>> 3771f88 (perbaiki fungsi rekap dan tampilan kaprodi)
  kode_ami: string;
  urutan: number;
  deskripsi_areas: DeskripsiArea[];
  butir_standars: ButirStandar[];
}

interface ButirStandar {
  id: string;
  no_butir: string;
  isi_butir: string;
}

interface DeskripsiArea {
  id: string;
  deskripsi_area_audit: string;
  urutan: number;
  pemeriksaan_unsurs: PemeriksaanUnsur[];
}

interface PemeriksaanUnsur {
  id: string;
  isi_unsur: string;
  urutan: number;
}

interface IsianItem {
  id: string;
  judul_dokumen: string | null;
  status: 'proses' | 'valid' | 'revisi' | 'draft';
  submitted_at: string | null;
  reviewed_at: string | null;
  dosen: {
    id: string;
    nip: string;
    nama_lengkap: string;
  };
}

interface UnsurStatusData {
  status: 'valid' | 'revisi' | 'proses' | 'kosong';
  counts: { valid: number; revisi: number; proses: number; total: number };
  latest_dosen_nama: string | null;
}

export default function KaprodiReviewPage() {
<<<<<<< HEAD
  const router = useRouter();
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [instrumens, setInstrumens] = useState<Instrumen[]>([]);
=======
>>>>>>> 3771f88 (perbaiki fungsi rekap dan tampilan kaprodi)
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [selectedInstrumen, setSelectedInstrumen] = useState<string>('');

  const [kriterias, setKriterias] = useState<KriteriaData[]>([]);
  const [expandedKriteria, setExpandedKriteria] = useState<string>('');
  const [selectedKodeAmi, setSelectedKodeAmi] = useState<{
    kriteria: KriteriaData;
    kodeAmi: KodeAmi;
  } | null>(null);

  // Selected unsur
  const [selectedUnsurId, setSelectedUnsurId] = useState<string>('');

  // Isians for selected unsur
  const [isians, setIsians] = useState<IsianItem[]>([]);
  const [loadingIsians, setLoadingIsians] = useState(false);
  const [loading, setLoading] = useState(false);

<<<<<<< HEAD
  // Unsur status map from by-unsur API
  const [unsurStatusMap, setUnsurStatusMap] = useState<Record<string, UnsurStatusData>>({});

  // Fetch periodes
=======
  // Fetch active periode
>>>>>>> 3771f88 (perbaiki fungsi rekap dan tampilan kaprodi)
  useEffect(() => {
    const fetchPeriodes = async () => {
      try {
        const token = localStorage.getItem('ami_token');
        const res = await fetch('/api/periodes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.data?.length > 0) {
          const active = data.data.find((p: any) => p.is_active) || data.data[0];
          setSelectedPeriode(active.id);
        }
      } catch (error) {
        console.error('Failed to fetch periodes:', error);
      }
    };
    fetchPeriodes();
  }, []);

  // Fetch instrumens for active periode
  useEffect(() => {
    if (!selectedPeriode) return;
    const fetchInstrumens = async () => {
      try {
        const token = localStorage.getItem('ami_token');
        const res = await fetch(`/api/instrumens?periode_id=${selectedPeriode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.data?.length > 0) {
          setSelectedInstrumen(data.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch instrumens:', error);
      }
    };
    fetchInstrumens();
  }, [selectedPeriode]);

<<<<<<< HEAD
  // Fetch kriteria
  useEffect(() => {
    if (!selectedInstrumen) return;
    const fetchKriterias = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('ami_token');
        const res = await fetch(`/api/kriteria?instrumen_id=${selectedInstrumen}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setKriterias(data.data || []);
        if (data.data?.length > 0) {
          setExpandedKriteria(data.data[0].id);
        }
        setSelectedKodeAmi(null);
        setSelectedUnsurId('');
        setIsians([]);
=======
  // Fetch isians
  useEffect(() => {
    if (!selectedPeriode || !selectedInstrumen) return;

    const fetchIsians = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('ami_token');
        const url = `/api/isians?periode_id=${selectedPeriode}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        const iisiansData: IsianDetail[] = data.data || [];
        
        // Cari unsur mana saja yang sudah memiliki isian 'valid'
        const validUnsurIds = new Set<number>();
        iisiansData.forEach((isian) => {
          if (isian.status === 'valid') {
            validUnsurIds.add(isian.pemeriksaan_unsur.id);
          }
        });

        const rowsMap = new Map<string, InstrumenRow>();

        iisiansData.forEach((isian) => {
          // Jika unsur ini sudah memiliki setidaknya satu isian yang valid, sembunyikan seluruh isian pada unsur ini
          if (validUnsurIds.has(isian.pemeriksaan_unsur.id)) {
            return;
          }

          if (!rowsMap.has(isian.id)) {
            rowsMap.set(isian.id, {
              no: rowsMap.size + 1,
              kode_ami: isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kode_ami,
              kriteria: isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.nama_kriteria,
              area: isian.pemeriksaan_unsur.deskripsi_area.deskripsi_area_audit,
              status: isian.status,
              unsur: isian.pemeriksaan_unsur.isi_unsur,
              isian_id: isian.id,
            });
          }
        });

        const sortedRows = Array.from(rowsMap.values()).sort((a, b) => {
          return a.kode_ami.localeCompare(b.kode_ami, undefined, { numeric: true, sensitivity: 'base' });
        });
        sortedRows.forEach((row, index) => { row.no = index + 1; });
        setRows(sortedRows);
        setSelectedRowId('');
        setDetailData(null);
>>>>>>> 3771f88 (perbaiki fungsi rekap dan tampilan kaprodi)
      } catch (error) {
        console.error('Failed to fetch kriterias:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchKriterias();
  }, [selectedInstrumen]);

<<<<<<< HEAD
  // Fetch unsur status - use isians summary to build status map
  useEffect(() => {
    if (!selectedPeriode) return;
    const fetchUnsurStatus = async () => {
=======
    fetchIsians();
  }, [selectedPeriode, selectedInstrumen]);

  // Listen for refresh event
  useEffect(() => {
    const handleRefresh = () => {
      setSelectedRowId('');
      setDetailData(null);
      if (selectedPeriode && selectedInstrumen) {
        const fetchIsians = async () => {
          try {
            setLoading(true);
            const token = localStorage.getItem('ami_token');
            const url = `/api/isians?periode_id=${selectedPeriode}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            const iisiansData: IsianDetail[] = data.data || [];
            
            const validUnsurIds = new Set<number>();
            iisiansData.forEach((isian) => {
              if (isian.status === 'valid') validUnsurIds.add(isian.pemeriksaan_unsur.id);
            });

            const rowsMap = new Map<string, InstrumenRow>();
            iisiansData.forEach((isian) => {
              if (validUnsurIds.has(isian.pemeriksaan_unsur.id)) return;
              if (!rowsMap.has(isian.id)) {
                rowsMap.set(isian.id, {
                  no: rowsMap.size + 1,
                  kode_ami: isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kode_ami,
                  kriteria: isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.nama_kriteria,
                  area: isian.pemeriksaan_unsur.deskripsi_area.deskripsi_area_audit,
                  status: isian.status,
                  unsur: isian.pemeriksaan_unsur.isi_unsur,
                  isian_id: isian.id,
                });
              }
            });

            const sortedRows = Array.from(rowsMap.values()).sort((a, b) => a.kode_ami.localeCompare(b.kode_ami, undefined, { numeric: true, sensitivity: 'base' }));
            sortedRows.forEach((row, index) => { row.no = index + 1; });
            setRows(sortedRows);
          } catch (error) {
            console.error('Failed to refresh isians:', error);
          } finally {
            setLoading(false);
          }
        };
        fetchIsians();
      }
    };

    window.addEventListener('refresh-rows', handleRefresh);
    return () => window.removeEventListener('refresh-rows', handleRefresh);
  }, [selectedPeriode, selectedInstrumen]);

  // Fetch detail when row is selected
  useEffect(() => {
    if (!selectedRowId) {
      setDetailData(null);
      return;
    }

    const fetchDetail = async () => {
>>>>>>> 3771f88 (perbaiki fungsi rekap dan tampilan kaprodi)
      try {
        const token = localStorage.getItem('ami_token');
        // Fetch all isians for this periode (kaprodi sees only their prodi)
        const res = await fetch(`/api/isians?periode_id=${selectedPeriode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        const allIsians: any[] = result.data || [];

        // Build status map grouped by pemeriksaan_unsur_id
        const map: Record<string, UnsurStatusData> = {};
        for (const isian of allIsians) {
          const unsurId = isian.pemeriksaan_unsur?.id?.toString() ||
            isian.pemeriksaan_unsur_id?.toString();
          if (!unsurId) continue;

          if (!map[unsurId]) {
            map[unsurId] = {
              status: 'kosong',
              counts: { valid: 0, revisi: 0, proses: 0, total: 0 },
              latest_dosen_nama: null,
            };
          }

          const entry = map[unsurId];
          entry.counts.total++;
          if (isian.status === 'valid') entry.counts.valid++;
          else if (isian.status === 'revisi') entry.counts.revisi++;
          else if (isian.status === 'proses') entry.counts.proses++;

          // Determine overall status
          if (entry.counts.valid > 0) entry.status = 'valid';
          else if (entry.counts.proses > 0 || entry.counts.revisi > 0) entry.status = 'proses';

          // Track latest dosen
          entry.latest_dosen_nama = isian.dosen?.nama_lengkap || entry.latest_dosen_nama;
        }

        setUnsurStatusMap(map);
      } catch (error) {
        console.error('Failed to fetch unsur status:', error);
      }
    };
    fetchUnsurStatus();
  }, [selectedPeriode]);

  // Fetch isians when unsur is selected
  useEffect(() => {
    if (!selectedUnsurId || !selectedPeriode) return;
    const fetchIsians = async () => {
      try {
        setLoadingIsians(true);
        const token = localStorage.getItem('ami_token');
        const res = await fetch(
          `/api/isians?pemeriksaan_unsur_id=${selectedUnsurId}&periode_id=${selectedPeriode}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        const isianList = data.data || [];
        setIsians(isianList);

        // Update unsurStatusMap locally based on fetched isians
        if (isianList.length > 0) {
          const validCount = isianList.filter((i: any) => i.status === 'valid').length;
          const prosesCount = isianList.filter((i: any) => i.status === 'proses' || i.status === 'revisi').length;
          let status: 'valid' | 'proses' | 'revisi' | 'kosong' = 'kosong';
          if (validCount > 0) status = 'valid';
          else if (prosesCount > 0) status = 'proses';

          const latestIsian = isianList[0];
          setUnsurStatusMap((prev) => ({
            ...prev,
            [selectedUnsurId]: {
              status,
              counts: { valid: validCount, revisi: 0, proses: prosesCount, total: isianList.length },
              latest_dosen_nama: latestIsian?.dosen?.nama_lengkap || null,
            },
          }));
        }
      } catch (error) {
        console.error('Failed to fetch isians:', error);
      } finally {
        setLoadingIsians(false);
      }
    };
    fetchIsians();
  }, [selectedUnsurId, selectedPeriode]);

  const activePeriode = periodes.find((p: any) => p.is_active);

<<<<<<< HEAD
  const handleSelectKodeAmi = (kriteria: KriteriaData, kodeAmi: KodeAmi) => {
    setSelectedKodeAmi({ kriteria, kodeAmi });
    setSelectedUnsurId('');
    setIsians([]);
  };

  const validIsians = isians.filter((i) => i.status === 'valid');
  const pengajuanIsians = isians.filter((i) => i.status !== 'valid' && i.status !== 'draft');

  // Helper: get status counts for a kode AMI (sum all unsurs under it)
  const getKodeAmiCounts = (kodeAmi: KodeAmi) => {
    let valid = 0;
    let proses = 0;
    let kosong = 0;
    let total = 0;

    kodeAmi.deskripsi_areas.forEach((area) => {
      area.pemeriksaan_unsurs.forEach((unsur) => {
        total++;
        const st = unsurStatusMap[unsur.id];
        if (!st || st.status === 'kosong') kosong++;
        else if (st.status === 'valid') valid++;
        else proses++; // proses or revisi = menunggu review
      });
    });

    return { valid, proses, kosong, total };
  };

  // Helper: get status counts for a kriteria (sum all kode AMIs)
  const getKriteriaCounts = (kriteria: KriteriaData) => {
    let valid = 0;
    let proses = 0;
    let kosong = 0;
    let total = 0;

    kriteria.kode_amis.forEach((kodeAmi) => {
      const c = getKodeAmiCounts(kodeAmi);
      valid += c.valid;
      proses += c.proses;
      kosong += c.kosong;
      total += c.total;
    });

    return { valid, proses, kosong, total };
  };

  // Helper: get unsur dot color class
  const getUnsurDotColor = (unsurId: string) => {
    const st = unsurStatusMap[unsurId];
    if (!st || st.status === 'kosong') return 'bg-gray-300';
    if (st.status === 'valid') return 'bg-green-500';
    return 'bg-amber-400'; // proses or revisi
  };

  // Helper: get unsur status label
  const getUnsurStatusLabel = (unsurId: string) => {
    const st = unsurStatusMap[unsurId];
    if (!st || st.status === 'kosong') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 text-[10px] font-medium">
          <Circle size={9} /> Belum Diisi
        </span>
      );
    }
    if (st.status === 'valid') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-green-200 bg-green-50 text-green-700 text-[10px] font-medium">
          <CheckCircle2 size={9} /> Valid
        </span>
      );
=======
      // Refresh data
      setTimeout(() => {
        setMessage(null);
        setSelectedRowId('');
        setReviewCatatan('');
        setReviewStatus('valid');
        // Trigger refresh rows
        const event = new CustomEvent('refresh-rows');
        window.dispatchEvent(event);
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan review' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
            <CheckCircle2 size={14} />
            Valid
          </span>
        );
      case 'revisi':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded">
            <AlertCircle size={14} />
            Revisi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
            <Clock size={14} />
            Proses
          </span>
        );
>>>>>>> 3771f88 (perbaiki fungsi rekap dan tampilan kaprodi)
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-medium">
        <Clock size={9} /> Menunggu Review
      </span>
    );
  };

  // Status count badges component
  const StatusBadges = ({ valid, proses, kosong, total }: { valid: number; proses: number; kosong: number; total: number }) => (
    <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-green-200 bg-green-50 text-green-700 font-medium">
        <CheckCircle2 size={10} /> {valid}
      </span>
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 font-medium">
        <Clock size={10} /> {proses}
      </span>
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 font-medium">
        <Circle size={10} /> {kosong}
      </span>
      <span className="text-gray-400 font-medium">/ {total}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
<<<<<<< HEAD
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Verifikasi Dokumen AMI</h1>
            <p className="text-gray-600 mt-1">Periksa Kriteria dan Unsur dokumen AMI</p>
          </div>
          {activePeriode && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-5 py-3 rounded-xl shadow-lg">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Clock size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-100">Periode Aktif:</p>
                <p className="text-sm font-bold">{activePeriode.tahun}</p>
              </div>
              <ChevronRight size={18} className="text-blue-200 ml-1" />
            </div>
          )}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Daftar Pemeriksaan Unsur */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <h2 className="text-sm font-bold uppercase tracking-wide">
                  Daftar Pemeriksaan Unsur
                </h2>
              </div>

              <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
                {loading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Memuat data...</div>
                ) : kriterias.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Tidak ada kriteria</div>
                ) : (
                  kriterias.map((kriteria) => {
                    const kriteriaCounts = getKriteriaCounts(kriteria);
                    // Determine dot color for kriteria
                    const kriteriaDot = kriteriaCounts.valid > 0 && kriteriaCounts.proses === 0 && kriteriaCounts.kosong === 0
                      ? 'bg-green-500'
                      : kriteriaCounts.proses > 0
                        ? 'bg-amber-400'
                        : 'bg-gray-300';
                    return (
                      <div key={kriteria.id} className="border-b border-gray-200 last:border-b-0">
                        {/* Kriteria Header */}
                        <button
                          onClick={() =>
                            setExpandedKriteria(
                              expandedKriteria === kriteria.id ? '' : kriteria.id
                            )
                          }
                          className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition"
                        >
                          <ChevronDown
                            size={14}
                            className={`text-gray-400 transition-transform flex-shrink-0 ${
                              expandedKriteria === kriteria.id ? 'rotate-0' : '-rotate-90'
                            }`}
                          />
                          <span className={`flex-shrink-0 w-3.5 h-3.5 rounded-full ${kriteriaDot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-gray-800">
                                [{kriteria.kode_kriteria}] {kriteria.nama_kriteria}
                              </span>
                              <StatusBadges {...kriteriaCounts} />
                            </div>
                          </div>
                        </button>

                        {/* Kode AMI Items */}
                        {expandedKriteria === kriteria.id && (
                          <div className="pb-2 pl-8 pr-3 space-y-1">
                            {kriteria.kode_amis.map((kodeAmi) => {
                              const isSelected = selectedKodeAmi?.kodeAmi.id === kodeAmi.id;
                              const kodeAmiCounts = getKodeAmiCounts(kodeAmi);
                              // Determine dot color for kode AMI based on its unsurs
                              const kodeAmiDot = kodeAmiCounts.valid > 0 && kodeAmiCounts.proses === 0 && kodeAmiCounts.kosong === 0
                                ? 'bg-green-500'
                                : kodeAmiCounts.proses > 0
                                  ? 'bg-amber-400'
                                  : 'bg-gray-300';
                              return (
                                <button
                                  key={kodeAmi.id}
                                  onClick={() => handleSelectKodeAmi(kriteria, kodeAmi)}
                                  className={`w-full text-left px-3 py-2.5 rounded-md text-xs transition border ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`flex-shrink-0 w-3 h-3 rounded-full ${isSelected ? 'bg-white' : kodeAmiDot}`} />
                                    <span className="font-semibold flex-1">{kodeAmi.kode_ami}</span>
                                  </div>
                                  <div className={`mt-1.5 ml-5 ${isSelected ? '' : ''}`}>
                                    {isSelected ? (
                                      <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-white/30 bg-white/10 text-white font-medium">
                                          <CheckCircle2 size={10} /> {kodeAmiCounts.valid}
                                        </span>
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-white/30 bg-white/10 text-white font-medium">
                                          <Clock size={10} /> {kodeAmiCounts.proses}
                                        </span>
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-white/30 bg-white/10 text-white font-medium">
                                          <Circle size={10} /> {kodeAmiCounts.kosong}
                                        </span>
                                        <span className="text-white/70 font-medium">/ {kodeAmiCounts.total}</span>
                                      </div>
                                    ) : (
                                      <StatusBadges {...kodeAmiCounts} />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-8 space-y-6">
            {selectedKodeAmi ? (
              <>
                {/* Top Info Box */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {/* Left: Kriteria & Kode AMI Info */}
                  <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">
                      KRITERIA {selectedKodeAmi.kriteria.kode_kriteria}:{' '}
                      {selectedKodeAmi.kriteria.nama_kriteria}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">No. Butir Standar : </span>
                        <span className="text-gray-600">
                          {selectedKodeAmi.kodeAmi.butir_standars?.[0]?.no_butir || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">No. Kode AMI : </span>
                        <span className="text-gray-600">
                          {selectedKodeAmi.kodeAmi.kode_ami}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Deskripsi Area Audit : </span>
                        <span className="text-gray-600">
                          {selectedKodeAmi.kodeAmi.deskripsi_areas
                            .map((a) => a.deskripsi_area_audit)
                            .join('; ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Unsur Isian AMI */}
                  <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Unsur Isian AMI</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedKodeAmi.kodeAmi.deskripsi_areas.flatMap((area) =>
                        area.pemeriksaan_unsurs.map((unsur) => {
                          const isActive = unsur.id === selectedUnsurId;
                          const st = unsurStatusMap[unsur.id];
                          return (
                            <button
                              key={unsur.id}
                              onClick={() => setSelectedUnsurId(unsur.id)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs border transition ${
                                isActive
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className={`flex-shrink-0 w-3 h-3 rounded-full mt-0.5 ${isActive ? 'bg-white' : getUnsurDotColor(unsur.id)}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium leading-tight ${isActive ? 'text-white' : 'text-gray-800'}`}>
                                    {unsur.isi_unsur}
                                  </p>
                                  {!isActive && (
                                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                      {getUnsurStatusLabel(unsur.id)}
                                      {st && st.latest_dosen_nama && (
                                        <span className="text-[10px] text-gray-400">
                                          {st.counts.total} isian dari prodi • terakhir oleh <span className="font-semibold text-gray-600">{st.latest_dosen_nama}</span>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Isian Section */}
                {selectedUnsurId ? (
                  <>
                    {/* Isian Unsur Valid */}
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-3">
                        Isian Unsur Valid :
                      </h3>
                      {loadingIsians ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-gray-500 text-sm">
                          Memuat data...
                        </div>
                      ) : validIsians.length === 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-gray-500 text-sm">
                          Belum ada isian yang divalidasi
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {validIsians.map((isian) => (
                            <button
                              key={isian.id}
                              onClick={() => router.push(`/kaprodi/review/${isian.id}`)}
                              className="w-full bg-blue-600 text-white rounded-lg p-4 flex items-center justify-between hover:bg-blue-700 transition text-left"
                            >
                              <div>
                                <p className="text-sm font-semibold">
                                  {isian.judul_dokumen || '(Tanpa judul)'}
                                </p>
                                <p className="text-xs text-blue-100">
                                  Diisi oleh : {isian.dosen.nama_lengkap}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-blue-100">
                                  {isian.reviewed_at
                                    ? new Date(isian.reviewed_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : '-'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pengajuan Pengisian Unsur */}
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-3">
                        Pengajuan Pengisian Unsur :
                      </h3>
                      {loadingIsians ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-gray-500 text-sm">
                          Memuat data...
                        </div>
                      ) : pengajuanIsians.length === 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-gray-500 text-sm">
                          Belum ada pengajuan
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {pengajuanIsians.map((isian) => (
                            <button
                              key={isian.id}
                              onClick={() => router.push(`/kaprodi/review/${isian.id}`)}
                              className="w-full bg-white rounded-lg border border-blue-200 p-4 flex items-center justify-between hover:bg-blue-50 transition text-left"
                            >
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {isian.judul_dokumen || '(Tanpa judul)'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Diisi oleh : {isian.dosen.nama_lengkap}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  {isian.submitted_at
                                    ? new Date(isian.submitted_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : '-'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">
                      Pilih unsur dari daftar di atas untuk melihat isian
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-sm">
                  Pilih kode AMI dari daftar pemeriksaan di sebelah kiri untuk melihat detail
                </p>
              </div>
            )}
          </div>
=======
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Verifikasi Dokumen AMI</h1>

        {/* Message Toast */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Isian Dokumen (Aktif)</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {rows.length} isian perlu diverifikasi
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border p-10 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              Memuat data isian...
            </div>
          ) : rows.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-10 text-center text-gray-500 flex flex-col items-center">
              <CheckCircle2 size={48} className="text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Semua Selesai!</h3>
              <p>Tidak ada isian dokumen yang perlu diverifikasi pada periode ini.</p>
            </div>
          ) : (
            rows.map((row) => (
              <div 
                key={row.isian_id}
                className={`bg-white rounded-xl shadow-sm border transition-all duration-200 ${
                  selectedRowId === row.isian_id ? 'border-blue-400 ring-1 ring-blue-400 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Header Row (Clickable) */}
                <div 
                  className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center gap-4"
                  onClick={() => setSelectedRowId(selectedRowId === row.isian_id ? '' : row.isian_id)}
                >
                  <div className="px-3 py-2 bg-blue-600 border border-blue-700 rounded text-sm font-semibold text-white whitespace-nowrap self-start sm:self-auto w-48 flex-shrink-0 text-center shadow-sm">
                    {row.kode_ami}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">{row.kriteria || row.area}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {row.kriteria ? row.area : row.unsur}
                    </p>
                  </div>
                  <div className="self-start sm:self-center flex items-center gap-3">
                    {getStatusBadge(row.status)}
                    <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${selectedRowId === row.isian_id ? 'rotate-180 text-blue-500' : ''}`} />
                  </div>
                </div>

                {/* Detail Accordion */}
                {selectedRowId === row.isian_id && detailData && detailData.id === row.isian_id && (
                  <div className="border-t border-blue-100 bg-slate-50/50">
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left Column: Data Dokumen */}
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Informasi Pengisi</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 mb-1">Dosen</p>
                              <p className="font-medium text-gray-900">{detailData.dosen.nama_lengkap}</p>
                              <p className="text-xs text-gray-500">{detailData.dosen.nip}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Program Studi</p>
                              <p className="font-medium text-gray-900">{detailData.prodi.nama_prodi}</p>
                              <p className="text-xs text-gray-500">{detailData.prodi.jenjang}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Detail Dokumen</h4>
                          <div className="space-y-4 text-sm">
                            <div>
                              <p className="text-gray-500 mb-1">Judul Dokumen</p>
                              <p className="font-medium text-gray-900">{detailData.judul_dokumen || '-'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Ketersediaan Standar</p>
                              <p className="font-medium text-gray-900 capitalize">{detailData.ketersediaan_standar?.replace('_', ' ') || '-'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Dokumen</p>
                              <p className="font-medium text-gray-900 capitalize">{detailData.dokumen?.replace('_', ' ') || '-'}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Pencapaian & Keterangan</h4>
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-2">
                                {detailData.pencapaian_standar_spt_pt ? <CheckCircle2 size={16} className="text-green-500"/> : <X size={16} className="text-red-500"/>}
                                <span>Standar SPT PT</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {detailData.pencapaian_standar_sn_dikti ? <CheckCircle2 size={16} className="text-green-500"/> : <X size={16} className="text-red-500"/>}
                                <span>Standar SN Dikti</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="flex items-center gap-2">
                                {detailData.daya_saing_lokal ? <CheckCircle2 size={16} className="text-green-500"/> : <X size={16} className="text-red-500"/>}
                                <span>Lokal</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {detailData.daya_saing_nasional ? <CheckCircle2 size={16} className="text-green-500"/> : <X size={16} className="text-red-500"/>}
                                <span>Nasional</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {detailData.daya_saing_internasional ? <CheckCircle2 size={16} className="text-green-500"/> : <X size={16} className="text-red-500"/>}
                                <span>Internasional</span>
                              </div>
                            </div>

                            <div className="mt-4 bg-white border rounded p-3 text-gray-700">
                              <span className="text-xs font-semibold text-gray-500 block mb-1">Keterangan Tambahan:</span>
                              {detailData.keterangan || '-'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Files & Action */}
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Bukti Fisik</h4>
                          
                          {detailData.bukti_link && (
                            <a 
                              href={detailData.bukti_link} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition text-sm mb-3"
                            >
                              <ExternalLink size={16} />
                              <span className="font-medium truncate">{detailData.bukti_link}</span>
                            </a>
                          )}

                          {detailData.bukti_files?.length > 0 ? (
                            <div className="space-y-2">
                              {detailData.bukti_files.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                      <FileText size={18} />
                                    </div>
                                    <div className="truncate">
                                      <p className="text-sm font-medium text-gray-900 truncate">{file.original_name}</p>
                                      <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                                    </div>
                                  </div>
                                  <a 
                                    href={`/api/files/${file.id}`}
                                    download={file.original_name}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Download"
                                  >
                                    <Download size={18} />
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : (
                            !detailData.bukti_link && (
                              <div className="text-center p-6 border-2 border-dashed rounded-lg bg-white">
                                <File className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">Tidak ada file bukti yang dilampirkan</p>
                              </div>
                            )
                          )}
                        </div>

                        {/* Validasi Action Area */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h4 className="text-sm font-bold text-gray-900">Tindakan Kaprodi</h4>
                            <button
                              onClick={() => setShowHistory(!showHistory)}
                              className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                              <History size={14} /> Riwayat
                            </button>
                          </div>
                          
                          <div className="p-4 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Status Verifikasi</label>
                              <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${reviewStatus === 'valid' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                  <input type="radio" name="status" value="valid" checked={reviewStatus === 'valid'} onChange={() => setReviewStatus('valid')} className="sr-only" />
                                  <CheckCircle2 size={18} />
                                  <span className="font-semibold text-sm">Valid</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${reviewStatus === 'revisi' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                  <input type="radio" name="status" value="revisi" checked={reviewStatus === 'revisi'} onChange={() => setReviewStatus('revisi')} className="sr-only" />
                                  <AlertCircle size={18} />
                                  <span className="font-semibold text-sm">Revisi</span>
                                </label>
                              </div>
                            </div>

                            {reviewStatus === 'revisi' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Revisi <span className="text-red-500">*</span></label>
                                <textarea
                                  value={reviewCatatan}
                                  onChange={(e) => setReviewCatatan(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  rows={3}
                                  placeholder="Berikan catatan perbaikan untuk dosen..."
                                />
                              </div>
                            )}

                            {reviewStatus === 'valid' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Tambahan (Opsional)</label>
                                <textarea
                                  value={reviewCatatan}
                                  onChange={(e) => setReviewCatatan(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  rows={2}
                                  placeholder="Catatan persetujuan jika ada..."
                                />
                              </div>
                            )}

                            <button
                              onClick={() => handleReviewSubmit(reviewStatus)}
                              disabled={isSubmitting || (reviewStatus === 'revisi' && !reviewCatatan.trim())}
                              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Menyimpan...
                                </>
                              ) : (
                                <>
                                  <Save size={18} />
                                  Simpan Verifikasi
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* History Overlay */}
                        {showHistory && (
                          <div className="mt-4 bg-gray-50 border rounded-lg p-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                              Riwayat Perubahan
                              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
                            </h5>
                            {reviewHistory.length > 0 ? (
                              <div className="space-y-3">
                                {reviewHistory.map((log) => (
                                  <div key={log.id} className="text-xs bg-white p-3 rounded border">
                                    <div className="flex justify-between text-gray-500 mb-1">
                                      <span>{new Date(log.created_at).toLocaleString('id-ID')}</span>
                                      <span className="font-medium capitalize">{log.status_sebelum} &rarr; {log.status_sesudah}</span>
                                    </div>
                                    <p className="text-gray-800 mt-1">{log.catatan || '-'}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 text-center py-2">Belum ada riwayat review.</p>
                            )}
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
>>>>>>> 3771f88 (perbaiki fungsi rekap dan tampilan kaprodi)
        </div>
      </div>
    </div>
  );
}
