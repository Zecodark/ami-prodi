'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  CheckCircle2,
  Circle,
} from 'lucide-react';

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
  const router = useRouter();
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [instrumens, setInstrumens] = useState<Instrumen[]>([]);
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

  // Unsur status map from by-unsur API
  const [unsurStatusMap, setUnsurStatusMap] = useState<Record<string, UnsurStatusData>>({});

  // Fetch periodes
  useEffect(() => {
    const fetchPeriodes = async () => {
      try {
        const token = localStorage.getItem('ami_token');
        const res = await fetch('/api/periodes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPeriodes(data.data || []);
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

  // Fetch instrumens
  useEffect(() => {
    if (!selectedPeriode) return;
    const fetchInstrumens = async () => {
      try {
        const token = localStorage.getItem('ami_token');
        const res = await fetch(`/api/instrumens?periode_id=${selectedPeriode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setInstrumens(data.data || []);
        if (data.data?.length > 0) {
          setSelectedInstrumen(data.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch instrumens:', error);
      }
    };
    fetchInstrumens();
  }, [selectedPeriode]);

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
      } catch (error) {
        console.error('Failed to fetch kriterias:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchKriterias();
  }, [selectedInstrumen]);

  // Fetch unsur status (by-unsur API)
  useEffect(() => {
    if (!selectedPeriode) return;
    const fetchUnsurStatus = async () => {
      try {
        const token = localStorage.getItem('ami_token');
        const res = await fetch(`/api/isians/by-unsur?periode_id=${selectedPeriode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        // R.ok wraps as { success, message, data }
        // The by-unsur API passes { data: map, periode_id, prodi_id } to R.ok
        // So final structure: result.data = { data: { unsurId: statusObj }, periode_id, prodi_id }
        const statusData = result.data?.data || result.data || {};
        console.log('[by-unsur] raw result:', result);
        console.log('[by-unsur] statusData keys:', Object.keys(statusData));
        setUnsurStatusMap(statusData);
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
        </div>
      </div>
    </div>
  );
}
