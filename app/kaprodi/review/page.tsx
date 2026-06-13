'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  File,
  FileText,
  ExternalLink,
  Download,
  Save,
  X,
  History,
} from 'lucide-react';

interface BuktiFile {
  id: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  judul_dokumen: string | null;
  keterangan_dokumen: string | null;
  tahun_dokumen: string | null;
}

interface IsianDetail {
  id: number;
  urutan_isian: number;
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
  kode_ami: string;
  kriteria: string;
  area: string;
  status: 'proses' | 'valid' | 'revisi';
  unsur: string;
  isian_id: number;
  urutan_isian: number;
  dosen_nama: string;
  submitted_at: string;
}

interface PeriodeSummary {
  id: string;
  is_active: boolean;
}

type ReviewLog = NonNullable<IsianDetail['review_logs']>[number];

export default function KaprodiReviewPage() {
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [selectedInstrumen, setSelectedInstrumen] = useState<string>('');

  const [rows, setRows] = useState<InstrumenRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<IsianDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [reviewStatus, setReviewStatus] = useState<'valid' | 'revisi' | null>(null);
  const [reviewCatatan, setReviewCatatan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [reviewHistory, setReviewHistory] = useState<ReviewLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'kode' | 'terbaru' | 'terlama'>('kode');
  const [dosenFilter, setDosenFilter] = useState('');
  const [kodeFilter, setKodeFilter] = useState('');

  // Fetch active periode
  useEffect(() => {
    const fetchPeriodes = async () => {
      try {
        const token = localStorage.getItem('ami_token');
        const res = await fetch('/api/periodes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.data?.length > 0) {
          const activePeriode =
            (data.data as PeriodeSummary[]).find((periode) => periode.is_active) ||
            data.data[0];
          setSelectedPeriode(activePeriode.id);
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
          headers: { Authorization: `Bearer ${token}` }
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
        
        const rowsMap = new Map<number, InstrumenRow>();

        iisiansData.forEach((isian) => {
          // Kaprodi hanya memverifikasi isian yang sedang menunggu review.
          if (isian.status !== 'proses') {
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
              urutan_isian: isian.urutan_isian,
              dosen_nama: isian.dosen?.nama_lengkap || 'Tanpa Nama',
              submitted_at: isian.submitted_at,
            });
          }
        });

        const sortedRows = Array.from(rowsMap.values()).sort((a, b) => {
          return a.kode_ami.localeCompare(b.kode_ami, undefined, { numeric: true, sensitivity: 'base' });
        });
        sortedRows.forEach((row, index) => { row.no = index + 1; });
        setRows(sortedRows);
        setSelectedRowId(null);
        setDetailData(null);
      } catch (error) {
        console.error('Failed to fetch isians:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIsians();
  }, [selectedPeriode, selectedInstrumen]);

  // Listen for refresh event
  useEffect(() => {
    const handleRefresh = () => {
      setSelectedRowId(null);
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
            
            const rowsMap = new Map<number, InstrumenRow>();
            iisiansData.forEach((isian) => {
              if (isian.status !== 'proses') return;
              if (!rowsMap.has(isian.id)) {
                rowsMap.set(isian.id, {
                  no: rowsMap.size + 1,
                  kode_ami: isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kode_ami,
                  kriteria: isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.nama_kriteria,
                  area: isian.pemeriksaan_unsur.deskripsi_area.deskripsi_area_audit,
                  status: isian.status,
                  unsur: isian.pemeriksaan_unsur.isi_unsur,
                  isian_id: isian.id,
                  urutan_isian: isian.urutan_isian,
                  dosen_nama: isian.dosen?.nama_lengkap || 'Tanpa Nama',
                  submitted_at: isian.submitted_at,
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
      return;
    }

    const fetchDetail = async () => {
      try {
        setDetailLoading(true);
        setDetailData(null);
        const token = localStorage.getItem('ami_token');
        const res = await fetch(`/api/isians/${selectedRowId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error('Gagal memuat detail isian');
        }
        const data = await res.json();
        setDetailData(data.data);
        setReviewStatus(null);
        setReviewCatatan('');
        setReviewHistory(data.data.review_logs || []);
      } catch (error) {
        console.error('Failed to fetch detail:', error);
        setMessage({ type: 'error', text: 'Gagal memuat detail isian' });
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [selectedRowId]);

  const handleReviewSubmit = async (status: 'valid' | 'revisi' | null) => {
    if (!selectedRowId || !status) {
      setMessage({ type: 'error', text: 'Pilih status Valid atau Revisi terlebih dahulu' });
      return;
    }
    if (status === 'revisi' && !reviewCatatan.trim()) {
      setMessage({ type: 'error', text: 'Catatan wajib diisi jika memilih Revisi' });
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('ami_token');
      const res = await fetch(`/api/isians/${selectedRowId}/review`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: status,
          catatan_kaprodi: status === 'revisi' ? reviewCatatan : null,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan review');
      }

      setMessage({ type: 'success', text: `Isian berhasil di-${status === 'valid' ? 'validkan' : 'kembalikan untuk revisi'}` });

      // Refresh data
      setTimeout(() => {
        setMessage(null);
        setSelectedRowId(null);
        setReviewCatatan('');
        setReviewStatus(null);
        // Trigger refresh rows
        const event = new CustomEvent('refresh-rows');
        window.dispatchEvent(event);
      }, 1500);
    } catch {
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
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const truncateText = (text: string, maxLength = 100) =>
    text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}...` : text;

  const dosenOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.dosen_nama))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const kodeOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.kode_ami))).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      ),
    [rows]
  );

  const visibleRows = useMemo(() => {
    const filteredRows = rows.filter((row) => {
      const matchesDosen =
        !dosenFilter || row.dosen_nama.toLowerCase().includes(dosenFilter.toLowerCase());
      const matchesKode = !kodeFilter || row.kode_ami === kodeFilter;
      return matchesDosen && matchesKode;
    });

    return [...filteredRows]
      .sort((a, b) => {
        const aSubmittedAt = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
        const bSubmittedAt = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;

        if (sortBy === 'terbaru') {
          return bSubmittedAt - aSubmittedAt || b.isian_id - a.isian_id;
        }
        if (sortBy === 'terlama') {
          return aSubmittedAt - bSubmittedAt || a.isian_id - b.isian_id;
        }
        return a.kode_ami.localeCompare(b.kode_ami, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      })
      .map((row, index) => ({ ...row, no: index + 1 }));
  }, [rows, sortBy, dosenFilter, kodeFilter]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0a2f6f] tracking-tight">
                Verifikasi Dokumen AMI
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Daftar isian dokumen aktif yang perlu Anda periksa dan verifikasi.
              </p>
            </div>
            <div className="flex flex-row items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-800 h-9">
                {rows.length} isian perlu diverifikasi
              </span>
              <Link href="/kaprodi/riwayat" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0a2f6f] hover:bg-blue-800 rounded-lg shadow-sm transition-all h-9">
                <History size={16} />
                Riwayat Review
              </Link>
            </div>
          </div>
        </div>

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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                <div className="lg:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Urutkan
                  </label>
                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(event.target.value as 'kode' | 'terbaru' | 'terlama')
                    }
                    className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  >
                    <option value="kode">Urutan Kode AMI</option>
                    <option value="terbaru">Submit Terbaru</option>
                    <option value="terlama">Submit Terlama</option>
                  </select>
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Dosen Pengisi
                  </label>
                  <input
                    list="review-dosen-list"
                    value={dosenFilter}
                    onChange={(event) => setDosenFilter(event.target.value)}
                    placeholder="Ketik untuk mencari nama dosen..."
                    className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  />
                  <datalist id="review-dosen-list">
                    {dosenOptions.map((dosen) => (
                      <option key={dosen} value={dosen} />
                    ))}
                  </datalist>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Kode AMI
                  </label>
                  <select
                    value={kodeFilter}
                    onChange={(event) => setKodeFilter(event.target.value)}
                    className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  >
                    <option value="">Semua Kode</option>
                    {kodeOptions.map((kode) => (
                      <option key={kode} value={kode}>
                        {kode}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2 h-[42px]">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('kode');
                      setDosenFilter('');
                      setKodeFilter('');
                    }}
                    className="w-full h-full px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 bg-white border border-slate-300 hover:border-blue-300 hover:bg-blue-50 rounded-lg shadow-sm transition-all"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            </div>
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
          ) : visibleRows.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-10 text-center text-gray-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Isian tidak ditemukan</h3>
              <p>Tidak ada isian yang sesuai dengan filter yang dipilih.</p>
            </div>
          ) : (
            visibleRows.map((row) => (
              <div 
                key={row.isian_id}
                className={`bg-white rounded-xl shadow-sm border transition-all duration-200 ${
                  selectedRowId === row.isian_id ? 'border-blue-400 ring-1 ring-blue-400 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Header Row (Clickable) */}
                <div 
                  className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center gap-4"
                  onClick={() => {
                    const nextRowId = selectedRowId === row.isian_id ? null : row.isian_id;
                    setSelectedRowId(nextRowId);
                    if (!nextRowId) setDetailData(null);
                  }}
                >
                  <div 
                    className="px-3 py-2 bg-blue-600 border border-blue-700 rounded text-sm font-semibold text-white self-start sm:self-auto w-48 flex-shrink-0 flex items-center justify-center min-h-[3.5rem] shadow-sm"
                    title={row.kode_ami}
                  >
                    <span className="line-clamp-2 text-center w-full">{row.kode_ami}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">Blok Isian {row.urutan_isian} - {row.kriteria || row.area}</h3>
                    <p
                      className="text-gray-500 text-sm mt-1"
                      title={row.kriteria ? row.area : row.unsur}
                    >
                      {truncateText(row.kriteria ? row.area : row.unsur)}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
                      <span>Disubmit oleh <strong className="font-semibold text-slate-600">{row.dosen_nama}</strong></span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        Disubmit pada{' '}
                        <strong className="font-semibold text-slate-600">
                          {row.submitted_at
                            ? new Date(row.submitted_at).toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <div className="self-start sm:self-center flex items-center gap-3">
                    {getStatusBadge(row.status)}
                    <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${selectedRowId === row.isian_id ? 'rotate-180 text-blue-500' : ''}`} />
                  </div>
                </div>

                {/* Detail Accordion */}
                {selectedRowId === row.isian_id && detailLoading && (
                  <div className="border-t border-gray-100 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mx-auto mb-3" />
                    Memuat detail isian...
                  </div>
                )}
                {selectedRowId === row.isian_id && detailData && detailData.id === row.isian_id && (
                  <div className="border-t border-gray-100 bg-slate-50/50">
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Full Width Card: Informasi Instrumen */}
                      <div className="lg:col-span-12 bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
                          Informasi Instrumen
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-sm">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              Kriteria
                            </p>
                            <p className="font-bold text-gray-900">
                              {detailData.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.nama_kriteria}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              Kode AMI
                            </p>
                            <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 font-bold text-blue-700">
                              {detailData.pemeriksaan_unsur.deskripsi_area.kode_ami.kode_ami}
                            </span>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              Deskripsi Area Audit
                            </p>
                            <p className="text-gray-800 leading-relaxed">
                              {detailData.pemeriksaan_unsur.deskripsi_area.deskripsi_area_audit}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              Unsur Pemeriksaan
                            </p>
                            <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                              {detailData.pemeriksaan_unsur.isi_unsur}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Left Column: Data Dokumen */}
                      <div className="lg:col-span-7 space-y-6">
                        
                        {/* Card: Informasi Pengisi */}
                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                          <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                            Informasi Pengisi
                          </h4>
                          <div className="grid grid-cols-2 gap-6 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Dosen</p>
                              <p className="font-bold text-gray-900">{detailData.dosen.nama_lengkap}</p>
                              <p className="text-xs text-gray-500 font-mono mt-1">{detailData.dosen.nip}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Program Studi</p>
                              <p className="font-bold text-gray-900">{detailData.prodi.nama_prodi}</p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 mt-1.5 border border-blue-100">
                                {detailData.prodi.jenjang}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card: Detail Dokumen */}
                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                          <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                            Detail Dokumen
                          </h4>
                          <div className="space-y-5 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Judul Dokumen</p>
                              <p className="font-medium text-gray-900 leading-relaxed">{detailData.judul_dokumen || '-'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                                <p className="text-xs font-medium text-gray-500 mb-1">Ketersediaan Standar</p>
                                <p className="font-semibold text-gray-900 capitalize">{detailData.ketersediaan_standar?.replace('_', ' ') || '-'}</p>
                              </div>
                              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                                <p className="text-xs font-medium text-gray-500 mb-1">Dokumen</p>
                                <p className="font-semibold text-gray-900 capitalize">{detailData.dokumen?.replace('_', ' ') || '-'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card: Pencapaian & Keterangan */}
                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                          <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
                            Pencapaian & Keterangan
                          </h4>
                          <div className="space-y-6 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${detailData.pencapaian_standar_spt_pt ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                {detailData.pencapaian_standar_spt_pt ? <CheckCircle2 size={20} className="text-green-600"/> : <X size={20} className="text-red-600"/>}
                                <span className={`font-semibold ${detailData.pencapaian_standar_spt_pt ? 'text-green-800' : 'text-red-800'}`}>Standar SPT PT</span>
                              </div>
                              <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${detailData.pencapaian_standar_sn_dikti ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                {detailData.pencapaian_standar_sn_dikti ? <CheckCircle2 size={20} className="text-green-600"/> : <X size={20} className="text-red-600"/>}
                                <span className={`font-semibold ${detailData.pencapaian_standar_sn_dikti ? 'text-green-800' : 'text-red-800'}`}>Standar SN Dikti</span>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Daya Saing</p>
                              <div className="flex flex-wrap gap-3">
                                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-sm ${detailData.daya_saing_lokal ? 'bg-green-50 border-green-300 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                  {detailData.daya_saing_lokal ? <CheckCircle2 size={16} /> : <X size={16} />} Lokal
                                </div>
                                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-sm ${detailData.daya_saing_nasional ? 'bg-green-50 border-green-300 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                  {detailData.daya_saing_nasional ? <CheckCircle2 size={16} /> : <X size={16} />} Nasional
                                </div>
                                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-sm ${detailData.daya_saing_internasional ? 'bg-green-50 border-green-300 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                  {detailData.daya_saing_internasional ? <CheckCircle2 size={16} /> : <X size={16} />} Internasional
                                </div>
                              </div>
                            </div>

                            {detailData.keterangan && (
                              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-4 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300"></div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Keterangan Tambahan</p>
                                <p className="text-slate-800 text-sm leading-relaxed">{detailData.keterangan}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Files & Action */}
                      <div className="lg:col-span-5 space-y-6">
                        
                        {/* Card: Bukti Fisik */}
                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                          <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                            Bukti Fisik
                          </h4>
                          
                          <div className="space-y-3">
                            {detailData.bukti_link && (
                              <a 
                                href={detailData.bukti_link} 
                                target="_blank" 
                                rel="noreferrer"
                                className="group flex items-center gap-3 p-3.5 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-lg transition-all"
                              >
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <ExternalLink size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-blue-800 truncate mb-0.5">Tautan Eksternal</p>
                                  <p className="text-xs text-blue-500 truncate">{detailData.bukti_link}</p>
                                </div>
                              </a>
                            )}

                            {detailData.bukti_files?.length > 0 ? (
                              <div className="space-y-4">
                                {detailData.bukti_files.map((file) => (
                                  <div key={file.id} className="group flex flex-col p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all relative overflow-hidden">
                                    <div className="flex items-start justify-between gap-3 relative z-10">
                                      <div className="flex items-start gap-3 overflow-hidden">
                                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                                          <FileText size={24} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-sm font-bold text-slate-800 truncate leading-tight mb-1">{file.judul_dokumen || file.original_name}</p>
                                          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{formatFileSize(file.file_size)}</span>
                                            {file.tahun_dokumen && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">Tahun: {file.tahun_dokumen}</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <a 
                                        href={`/api/files/${file.id}`}
                                        download={file.original_name}
                                        className="p-2.5 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 hover:border-blue-200 shadow-sm shrink-0"
                                        title="Download Dokumen"
                                      >
                                        <Download size={20} />
                                      </a>
                                    </div>
                                    {file.keterangan_dokumen && (
                                      <div className="mt-3 pt-3 border-t border-slate-100 relative z-10">
                                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                          <span className="font-semibold block mb-0.5 text-slate-700">Keterangan:</span>
                                          {file.keterangan_dokumen}
                                        </p>
                                      </div>
                                    )}
                                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none transform rotate-12">
                                      <FileText size={120} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              !detailData.bukti_link && (
                                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                  <File className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                                  <p className="text-sm text-slate-600 font-bold mb-1">Tidak ada file bukti</p>
                                  <p className="text-xs text-slate-400">Dosen tidak melampirkan file dokumen</p>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {/* Validasi Action Area */}
                        <div className="bg-white rounded-xl border border-blue-100 shadow-md shadow-blue-50 overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-blue-100 flex justify-between items-center">
                            <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2.5">
                              <Save size={18} className="text-blue-600" />
                              Tindakan Kaprodi
                            </h4>
                            <button
                              onClick={() => setShowHistory(!showHistory)}
                              className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 rounded-md shadow-sm border border-blue-100 hover:bg-blue-600 hover:text-white transition-colors font-semibold"
                            >
                              <History size={14} /> Riwayat
                            </button>
                          </div>
                          
                          <div className="p-6 space-y-6">
                            <div>
                              <label className="block text-sm font-bold text-slate-800 mb-3">Status Verifikasi</label>
                              <div className="flex gap-4">
                                <label className={`relative flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${reviewStatus === 'valid' ? 'bg-green-50 border-green-500 text-green-700 shadow-md scale-105' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>
                                  <input type="radio" name="status" value="valid" checked={reviewStatus === 'valid'} onChange={() => setReviewStatus('valid')} className="sr-only" />
                                  <CheckCircle2 size={28} className={reviewStatus === 'valid' ? 'text-green-600' : 'text-slate-400'} />
                                  <span className="font-bold text-sm">Valid</span>
                                </label>
                                <label className={`relative flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${reviewStatus === 'revisi' ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-md scale-105' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>
                                  <input type="radio" name="status" value="revisi" checked={reviewStatus === 'revisi'} onChange={() => setReviewStatus('revisi')} className="sr-only" />
                                  <AlertCircle size={28} className={reviewStatus === 'revisi' ? 'text-orange-600' : 'text-slate-400'} />
                                  <span className="font-bold text-sm">Revisi</span>
                                </label>
                              </div>
                            </div>

                            {reviewStatus === 'revisi' && (
                              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-bold text-slate-800 mb-2">Catatan Revisi <span className="text-red-500">*</span></label>
                                <textarea
                                  value={reviewCatatan}
                                  onChange={(e) => setReviewCatatan(e.target.value)}
                                  className="w-full px-4 py-3 border border-orange-200 bg-orange-50/50 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm transition-all shadow-inner placeholder:text-orange-300 text-orange-900"
                                  rows={4}
                                  placeholder="Berikan catatan spesifik bagian mana yang harus diperbaiki..."
                                />
                              </div>
                            )}

                            {reviewStatus === 'valid' && (
                              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-bold text-slate-800 mb-2">Catatan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span></label>
                                <textarea
                                  value={reviewCatatan}
                                  onChange={(e) => setReviewCatatan(e.target.value)}
                                  className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all placeholder:text-slate-400"
                                  rows={3}
                                  placeholder="Catatan apresiasi atau keterangan persetujuan..."
                                />
                              </div>
                            )}

                            <button
                              onClick={() => handleReviewSubmit(reviewStatus)}
                              disabled={
                                isSubmitting ||
                                !reviewStatus ||
                                (reviewStatus === 'revisi' && !reviewCatatan.trim())
                              }
                              className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                reviewStatus === 'valid' 
                                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-green-200 hover:shadow-lg' 
                                  : reviewStatus === 'revisi'
                                    ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 shadow-orange-200 hover:shadow-lg'
                                    : 'bg-slate-400 focus:ring-slate-300 shadow-slate-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isSubmitting ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  Menyimpan...
                                </>
                              ) : (
                                <>
                                  <Save size={20} />
                                  {reviewStatus
                                    ? `Simpan Verifikasi ${reviewStatus === 'valid' ? 'Valid' : 'Revisi'}`
                                    : 'Pilih Status Verifikasi'}
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* History Overlay */}
                        {showHistory && (
                          <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden animate-in fade-in slide-in-from-top-4">
                            <div className="bg-slate-50 px-5 py-4 border-b flex justify-between items-center">
                              <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2.5">
                                <History size={18} className="text-slate-500" />
                                Riwayat Perubahan
                              </h5>
                              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-200 transition-colors"><X size={18}/></button>
                            </div>
                            <div className="p-5">
                              {reviewHistory.length > 0 ? (
                                <div className="space-y-5 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
                                  {reviewHistory.map((log) => (
                                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${log.status_sesudah === 'valid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {log.status_sesudah === 'valid' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                                      </div>
                                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm text-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between space-x-2 mb-2">
                                          <div className="font-bold text-slate-900 capitalize flex items-center gap-2">
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{log.status_sebelum}</span>
                                            <span className="text-slate-300">&rarr;</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${log.status_sesudah === 'valid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{log.status_sesudah}</span>
                                          </div>
                                          <time className="font-mono text-[10px] text-slate-400 font-medium">{new Date(log.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</time>
                                        </div>
                                        <div className="text-slate-700 text-xs mt-2 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                                          {log.catatan || <span className="italic text-slate-400">Tidak ada catatan ditambahkan</span>}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                                    <History className="h-8 w-8 text-slate-300" />
                                  </div>
                                  <p className="text-sm font-bold text-slate-600">Belum Ada Riwayat</p>
                                  <p className="text-xs text-slate-400 mt-1">Dokumen ini belum pernah diverifikasi sebelumnya.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
