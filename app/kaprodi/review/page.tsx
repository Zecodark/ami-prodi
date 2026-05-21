'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
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
        setIsians(data.data || []);
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
                  kriterias.map((kriteria) => (
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
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {kriteria.kode_kriteria}
                        </span>
                        <span className="text-sm font-medium text-gray-800 flex-1 italic">
                          {kriteria.nama_kriteria}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-gray-400 transition-transform ${
                            expandedKriteria === kriteria.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Kode AMI Items */}
                      {expandedKriteria === kriteria.id && (
                        <div className="pb-2 px-3 space-y-1">
                          {kriteria.kode_amis.map((kodeAmi) => {
                            const isSelected =
                              selectedKodeAmi?.kodeAmi.id === kodeAmi.id;
                            return (
                              <button
                                key={kodeAmi.id}
                                onClick={() => handleSelectKodeAmi(kriteria, kodeAmi)}
                                className={`w-full text-left px-3 py-2 rounded-md text-xs transition border ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200'
                                }`}
                              >
                                <span className="font-semibold">{kodeAmi.kode_ami}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
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
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedKodeAmi.kodeAmi.deskripsi_areas.flatMap((area) =>
                        area.pemeriksaan_unsurs.map((unsur) => (
                          <button
                            key={unsur.id}
                            onClick={() => setSelectedUnsurId(unsur.id)}
                            className={`w-full text-left px-3 py-2 rounded text-xs border transition ${
                              unsur.id === selectedUnsurId
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                            }`}
                          >
                            {unsur.isi_unsur}
                          </button>
                        ))
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
