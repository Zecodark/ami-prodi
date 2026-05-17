'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
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

interface Periode {
  id: string;
  tahun: string;
}

interface Instrumen {
  id: string;
  nama_instrumen: string;
}

interface Dosen {
  id: string;
  nama_lengkap: string;
  nip: string;
}

interface Prodi {
  id: string;
  nama_prodi: string;
  jenjang: string;
}

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
  dosen: Dosen;
  prodi: Prodi;
  bukti_files: BuktiFile[];
  pemeriksaan_unsur: {
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
  isian_id: string;
}

export default function KaprodiReviewPage() {
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [instrumens, setInstrumens] = useState<Instrumen[]>([]);
  const [dosens, setDosens] = useState<Dosen[]>([]);
  const [prodis, setProdis] = useState<Prodi[]>([]);

  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [selectedInstrumen, setSelectedInstrumen] = useState<string>('');
  const [selectedDosen, setSelectedDosen] = useState<string>('');
  const [selectedProdi, setSelectedProdi] = useState<string>('');
  const [filterType, setFilterType] = useState<'dosen' | 'prodi'>('prodi');

  const [rows, setRows] = useState<InstrumenRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string>('');
  const [detailData, setDetailData] = useState<IsianDetail | null>(null);

  const [reviewStatus, setReviewStatus] = useState<'valid' | 'revisi'>('valid');
  const [reviewCatatan, setReviewCatatan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  interface ReviewLog {
    id: string;
    status_sebelum: string;
    status_sesudah: string;
    catatan: string | null;
    created_at: string;
  }

  // Fetch periodes
  useEffect(() => {
    const fetchPeriodes = async () => {
      try {
        const res = await fetch('/api/periodes');
        const data = await res.json();
        setPeriodes(data.data || []);
        if (data.data?.length > 0) {
          const activePeriode = data.data.find((p: any) => p.is_active) || data.data[0];
          setSelectedPeriode(activePeriode.id);
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
        const res = await fetch(`/api/instrumens?periode_id=${selectedPeriode}`);
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

  // Fetch dosens & prodis
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [dosenRes, prodiRes] = await Promise.all([
          fetch('/api/dosens'),
          fetch('/api/prodis'),
        ]);
        const dosenData = await dosenRes.json();
        const prodiData = await prodiRes.json();
        setDosens(dosenData.data || []);
        setProdis(prodiData.data || []);
        if (prodiData.data?.length > 0) {
          setSelectedProdi(prodiData.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch options:', error);
      }
    };
    fetchOptions();
  }, []);

  // Fetch isians based on filters
  useEffect(() => {
    if (!selectedPeriode || !selectedInstrumen) return;

    const fetchIsians = async () => {
      try {
        setLoading(true);
        let url = `/api/isians?periode_id=${selectedPeriode}`;

        if (filterType === 'dosen' && selectedDosen) {
          url += `&dosen_id=${selectedDosen}`;
        } else if (filterType === 'prodi' && selectedProdi) {
          url += `&prodi_id=${selectedProdi}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        // Group isians by instrumen row
        const iisiansData: IsianDetail[] = data.data || [];
        const rowsMap = new Map<string, InstrumenRow>();

        iisiansData.forEach((isian) => {
          const key = isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kode_ami;
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

        setRows(Array.from(rowsMap.values()));
        setSelectedRowId('');
        setDetailData(null);
      } catch (error) {
        console.error('Failed to fetch isians:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIsians();
  }, [selectedPeriode, selectedInstrumen, selectedDosen, selectedProdi, filterType]);

  // Listen for refresh event
  useEffect(() => {
    const handleRefresh = () => {
      // Refetch isians
      if (selectedPeriode && selectedInstrumen) {
        const fetchIsians = async () => {
          try {
            setLoading(true);
            let url = `/api/isians?periode_id=${selectedPeriode}`;

            if (filterType === 'dosen' && selectedDosen) {
              url += `&dosen_id=${selectedDosen}`;
            } else if (filterType === 'prodi' && selectedProdi) {
              url += `&prodi_id=${selectedProdi}`;
            }

            const res = await fetch(url);
            const data = await res.json();

            const iisiansData: IsianDetail[] = data.data || [];
            const rowsMap = new Map<string, InstrumenRow>();

            iisiansData.forEach((isian) => {
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

            setRows(Array.from(rowsMap.values()));
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
  }, [selectedPeriode, selectedInstrumen, selectedDosen, selectedProdi, filterType]);

  // Fetch detail when row is selected
  useEffect(() => {
    if (!selectedRowId) {
      setDetailData(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/isians/${selectedRowId}`);
        const data = await res.json();
        setDetailData(data.data);
        setReviewStatus(data.data.status === 'valid' ? 'valid' : 'revisi');
        setReviewCatatan(data.data.catatan_kaprodi || '');
        setReviewHistory(data.data.review_history || []);
      } catch (error) {
        console.error('Failed to fetch detail:', error);
      }
    };

    fetchDetail();
  }, [selectedRowId]);

  const handleReviewSubmit = async (status: 'valid' | 'revisi') => {
    if (!selectedRowId) return;
    if (status === 'revisi' && !reviewCatatan.trim()) {
      setMessage({ type: 'error', text: 'Catatan wajib diisi jika memilih Revisi' });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/isians/${selectedRowId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

  const handleReview = async () => {
    await handleReviewSubmit(reviewStatus);
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Review Instrumen AMI</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Periode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Periode</label>
              <select
                value={selectedPeriode}
                onChange={(e) => setSelectedPeriode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Pilih Periode</option>
                {periodes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.tahun}
                  </option>
                ))}
              </select>
            </div>

            {/* Instrumen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instrumen</label>
              <select
                value={selectedInstrumen}
                onChange={(e) => setSelectedInstrumen(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Pilih Instrumen</option>
                {instrumens.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nama_instrumen}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Berdasarkan</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'dosen' | 'prodi')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="prodi">Prodi</option>
                <option value="dosen">Dosen</option>
              </select>
            </div>

            {/* Dosen or Prodi */}
            {filterType === 'dosen' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dosen</label>
                <select
                  value={selectedDosen}
                  onChange={(e) => setSelectedDosen(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Semua Dosen</option>
                  {dosens.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama_lengkap}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prodi</label>
                <select
                  value={selectedProdi}
                  onChange={(e) => setSelectedProdi(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Semua Prodi</option>
                  {prodis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama_prodi} ({p.jenjang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Daftar Isian ({rows.length})</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">Kode AMI</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">Area</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                          Memuat data...
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                          Tidak ada isian
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={row.isian_id}
                          onClick={() => setSelectedRowId(row.isian_id)}
                          className={`border-b border-gray-200 cursor-pointer transition ${
                            selectedRowId === row.isian_id
                              ? 'bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">{row.kode_ami}</td>
                          <td className="px-6 py-4 text-gray-600 truncate">{row.area.substring(0, 40)}...</td>
                          <td className="px-6 py-4">{getStatusBadge(row.status)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel - Detail */}
          <div className="lg:col-span-1">
            {detailData ? (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
                {/* Detail Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Detail Isian</h3>
                    <button
                      onClick={() => setSelectedRowId('')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Status:</span>
                    {getStatusBadge(detailData.status)}
                  </div>
                </div>

                <div className="overflow-y-auto flex-1">
                  {/* Dokumen Info */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Judul Dokumen</p>
                        <p className="text-sm text-gray-900">{detailData.judul_dokumen || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Dosen Pengisi</p>
                        <p className="text-sm text-gray-900">{detailData.dosen.nama_lengkap}</p>
                        <p className="text-xs text-gray-500">{detailData.dosen.nip}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Program Studi</p>
                        <p className="text-sm text-gray-900">
                          {detailData.prodi.nama_prodi} ({detailData.prodi.jenjang})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Standar */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-3">Standar yang Dicapai</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        {detailData.pencapaian_standar_spt_pt ? (
                          <CheckCircle2 size={16} className="text-green-600 mr-2 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={16} className="text-gray-300 mr-2 flex-shrink-0" />
                        )}
                        <span className="text-gray-700">SPT PT</span>
                      </div>
                      <div className="flex items-center">
                        {detailData.pencapaian_standar_sn_dikti ? (
                          <CheckCircle2 size={16} className="text-green-600 mr-2 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={16} className="text-gray-300 mr-2 flex-shrink-0" />
                        )}
                        <span className="text-gray-700">SN DIKTI</span>
                      </div>
                    </div>
                  </div>

                  {/* Daya Saing */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-3">Daya Saing</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        {detailData.daya_saing_lokal ? (
                          <CheckCircle2 size={16} className="text-green-600 mr-2 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={16} className="text-gray-300 mr-2 flex-shrink-0" />
                        )}
                        <span className="text-gray-700">Lokal</span>
                      </div>
                      <div className="flex items-center">
                        {detailData.daya_saing_nasional ? (
                          <CheckCircle2 size={16} className="text-green-600 mr-2 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={16} className="text-gray-300 mr-2 flex-shrink-0" />
                        )}
                        <span className="text-gray-700">Nasional</span>
                      </div>
                      <div className="flex items-center">
                        {detailData.daya_saing_internasional ? (
                          <CheckCircle2 size={16} className="text-green-600 mr-2 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={16} className="text-gray-300 mr-2 flex-shrink-0" />
                        )}
                        <span className="text-gray-700">Internasional</span>
                      </div>
                    </div>
                  </div>

                  {/* Bukti */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-3">Bukti</p>
                    <div className="space-y-2">
                      {detailData.bukti_link && (
                        <a
                          href={detailData.bukti_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink size={16} />
                          Lihat Link
                        </a>
                      )}
                      {detailData.bukti_files && detailData.bukti_files.length > 0 && (
                        <div className="space-y-1">
                          {detailData.bukti_files.map((file) => (
                            <a
                              key={file.id}
                              href={file.file_path}
                              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 w-full"
                            >
                              <Download size={16} />
                              <span className="truncate">{file.original_name}</span>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                ({formatFileSize(parseInt(file.file_size.toString()))})
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Catatan Kaprodi Sebelumnya */}
                  {detailData.catatan_kaprodi && (
                    <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
                      <p className="text-xs font-medium text-orange-900 mb-2">Catatan Kaprodi Sebelumnya</p>
                      <p className="text-sm text-orange-900">{detailData.catatan_kaprodi}</p>
                    </div>
                  )}

                  {/* Review History */}
                  {reviewHistory && reviewHistory.length > 0 && (
                    <div className="px-6 py-4 border-b border-gray-200">
                      <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full flex items-center justify-between text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        <span className="flex items-center gap-2">
                          <History size={16} />
                          Riwayat Review ({reviewHistory.length})
                        </span>
                        <ChevronDown
                          size={16}
                          className={`transition ${showHistory ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {showHistory && (
                        <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                          {reviewHistory.map((log, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-gray-50 border border-gray-200 rounded text-sm"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-gray-900">
                                  {new Date(log.created_at).toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-block px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded">
                                  {log.status_sebelum}
                                </span>
                                <ChevronRight size={14} className="text-gray-400" />
                                <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded">
                                  {log.status_sesudah}
                                </span>
                              </div>
                              {log.catatan && (
                                <p className="text-xs text-gray-700 italic">"{log.catatan}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Review Form */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="space-y-4">
                    {/* Status */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Status Review
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setReviewStatus('valid');
                            setReviewCatatan('');
                          }}
                          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                            reviewStatus === 'valid'
                              ? 'bg-green-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <CheckCircle2 size={14} className="inline mr-1" />
                          Valid
                        </button>
                        <button
                          onClick={() => setReviewStatus('revisi')}
                          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                            reviewStatus === 'revisi'
                              ? 'bg-orange-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <AlertCircle size={14} className="inline mr-1" />
                          Revisi
                        </button>
                      </div>
                    </div>

                  {/* Catatan */}
                  {reviewStatus === 'revisi' && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                      <label className="block text-xs font-medium text-orange-900 mb-2">
                        Catatan Revisi <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={reviewCatatan}
                        onChange={(e) => setReviewCatatan(e.target.value)}
                        placeholder="Jelaskan alasan atau perbaikan yang diperlukan..."
                        className="w-full px-3 py-2 border border-orange-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                        rows={4}
                      />
                      <p className={`text-xs mt-1 ${reviewCatatan.trim() ? 'text-green-600' : 'text-red-600'}`}>
                        {reviewCatatan.trim() ? '✓ Catatan sudah diisi' : '⚠ Catatan wajib diisi untuk revisi'}
                      </p>
                      <button
                        onClick={() => handleReviewSubmit('revisi')}
                        disabled={isSubmitting || !reviewCatatan.trim()}
                        className="w-full mt-3 px-4 py-2 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                      >
                        <AlertCircle size={16} />
                        {isSubmitting && reviewStatus === 'revisi' ? 'Mengembalikan...' : 'Kembalikan untuk Revisi'}
                      </button>
                    </div>
                  )}

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReviewSubmit('valid')}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                      >
                        <CheckCircle2 size={16} />
                        {isSubmitting && reviewStatus === 'valid' ? 'Validkan...' : 'Validkan'}
                      </button>
                      <button
                        onClick={() => setReviewStatus('revisi')}
                        className={`flex-1 px-4 py-2 rounded text-sm font-medium transition ${
                          reviewStatus === 'revisi'
                            ? 'bg-orange-600 text-white'
                            : 'bg-white border border-orange-600 text-orange-600 hover:bg-orange-50'
                        }`}
                      >
                        <AlertCircle size={16} className="inline mr-1" />
                        Kembalikan Revisi
                      </button>
                    </div>

                    {/* Message */}
                    {message && (
                      <div
                        className={`p-3 rounded text-sm ${
                          message.type === 'success'
                            ? 'bg-green-50 text-green-800'
                            : 'bg-red-50 text-red-800'
                        }`}
                      >
                        {message.text}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
                Pilih isian untuk melihat detail
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
