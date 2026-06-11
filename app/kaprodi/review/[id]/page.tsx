'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Download,
  Save,
  FileText,
} from 'lucide-react';

interface IsianDetail {
  id: string;
  judul_dokumen: string | null;
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
  status: 'proses' | 'valid' | 'revisi' | 'draft';
  catatan_kaprodi: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  attempt: number;
  dosen: {
    id: string;
    nip: string;
    nama_lengkap: string;
    prodi?: {
      id: string;
      nama_prodi: string;
      jenjang: string;
    };
  };
  prodi: {
    id: string;
    nama_prodi: string;
    jenjang: string;
  };
  periode: {
    id: string;
    tahun: string;
  };
  pemeriksaan_unsur: {
    isi_unsur: string;
    deskripsi_area: {
      deskripsi_area_audit: string;
      kode_ami: {
        kode_ami: string;
        kriteria: {
          kode_kriteria: string;
          nama_kriteria: string;
          instrumen: {
            id: string;
            nama_instrumen: string;
          };
        };
      };
    };
  };
  bukti_files: Array<{
    id: string;
    original_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
  }>;
  review_logs?: Array<{
    id: string;
    status_sebelum: string;
    status_sesudah: string;
    catatan: string | null;
    created_at: string;
  }>;
}

export default function IsianDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<IsianDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Review form
  const [reviewStatus, setReviewStatus] = useState<'valid' | 'revisi'>('valid');
  const [reviewCatatan, setReviewCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('ami_token');
        const res = await fetch(`/api/isians/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        setData(result.data);
        if (result.data) {
          setReviewCatatan(result.data.catatan_kaprodi || '');
        }
      } catch (error) {
        console.error('Failed to fetch isian detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleReviewSubmit = async (status: 'valid' | 'revisi') => {
    if (!id) return;
    if (status === 'revisi' && !reviewCatatan.trim()) {
      setMessage({ type: 'error', text: 'Catatan wajib diisi jika memilih Revisi' });
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('ami_token');
      const res = await fetch(`/api/isians/${id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          catatan_kaprodi: status === 'revisi' ? reviewCatatan : null,
        }),
      });

      if (!res.ok) throw new Error('Gagal menyimpan review');

      const result = await res.json();
      setData(result.data);
      setMessage({
        type: 'success',
        text: `Isian berhasil di-${status === 'valid' ? 'validkan' : 'kembalikan untuk revisi'}`,
      });
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
          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
            <CheckCircle2 size={14} /> Valid
          </span>
        );
      case 'revisi':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-orange-700 bg-orange-100 rounded-full">
            <AlertCircle size={14} /> Revisi
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">
            <FileText size={14} /> Draft
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
            <Clock size={14} /> Proses
          </span>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-500">Memuat data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-500">Data tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/kaprodi/review')}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-4 transition"
        >
          <ArrowLeft size={16} />
          Kembali ke Verifikasi Dokumen
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Isian AMI</h1>
            <p className="text-gray-600 mt-1">
              {data.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.instrumen.nama_instrumen}
            </p>
          </div>
          {getStatusBadge(data.status)}
        </div>

        {/* Kriteria & Kode AMI Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase mb-4">
            Kriteria {data.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.kode_kriteria}:{' '}
            {data.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.nama_kriteria}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">No. Kode AMI</p>
              <p className="font-medium text-gray-900">
                {data.pemeriksaan_unsur.deskripsi_area.kode_ami.kode_ami}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Deskripsi Area Audit</p>
              <p className="font-medium text-gray-900">
                {data.pemeriksaan_unsur.deskripsi_area.deskripsi_area_audit}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Unsur Pemeriksaan</p>
              <p className="font-medium text-gray-900">{data.pemeriksaan_unsur.isi_unsur}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Periode</p>
              <p className="font-medium text-gray-900">{data.periode.tahun}</p>
            </div>
          </div>
        </div>

        {/* Dosen Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase mb-4">Informasi Dosen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Nama Dosen</p>
              <p className="font-medium text-gray-900">{data.dosen.nama_lengkap}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">NIP</p>
              <p className="font-medium text-gray-900">{data.dosen.nip}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Program Studi</p>
              <p className="font-medium text-gray-900">
                {data.prodi.nama_prodi} ({data.prodi.jenjang})
              </p>
            </div>
          </div>
        </div>

        {/* Isian Detail */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase mb-4">Data Isian</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Judul Dokumen</p>
              <p className="font-medium text-gray-900">{data.judul_dokumen || '-'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 mb-1">Ketersediaan Standar</p>
                <p className="font-medium text-gray-900 capitalize">
                  {data.ketersediaan_standar.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Dokumen</p>
                <p className="font-medium text-gray-900 capitalize">
                  {data.dokumen.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Pencapaian Standar */}
            <div>
              <p className="text-gray-500 mb-2">Pencapaian Standar</p>
              <div className="flex flex-wrap gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    data.pencapaian_standar_spt_pt
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {data.pencapaian_standar_spt_pt ? '✓' : '✗'} SPT PT
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    data.pencapaian_standar_sn_dikti
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {data.pencapaian_standar_sn_dikti ? '✓' : '✗'} SN DIKTI
                </span>
              </div>
            </div>

            {/* Daya Saing */}
            <div>
              <p className="text-gray-500 mb-2">Daya Saing</p>
              <div className="flex flex-wrap gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    data.daya_saing_lokal
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {data.daya_saing_lokal ? '✓' : '✗'} Lokal
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    data.daya_saing_nasional
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {data.daya_saing_nasional ? '✓' : '✗'} Nasional
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    data.daya_saing_internasional
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {data.daya_saing_internasional ? '✓' : '✗'} Internasional
                </span>
              </div>
            </div>

            {/* Tahun & Capaian */}
            <div className="grid grid-cols-2 gap-4">
              {data.tahun_pelaksanaan && (
                <div>
                  <p className="text-gray-500 mb-1">Tahun Pelaksanaan</p>
                  <p className="font-medium text-gray-900">{data.tahun_pelaksanaan}</p>
                </div>
              )}
              {data.capaian && (
                <div>
                  <p className="text-gray-500 mb-1">Capaian</p>
                  <p className="font-medium text-gray-900">{data.capaian}</p>
                </div>
              )}
            </div>

            {data.keterangan && (
              <div>
                <p className="text-gray-500 mb-1">Keterangan</p>
                <p className="font-medium text-gray-900">{data.keterangan}</p>
              </div>
            )}

            {/* Bukti */}
            <div>
              <p className="text-gray-500 mb-2">Bukti</p>
              <div className="space-y-2">
                {data.bukti_link && (
                  <a
                    href={data.bukti_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink size={16} />
                    Lihat Link Bukti
                  </a>
                )}
                {data.bukti_files && data.bukti_files.length > 0 && (
                  <div className="space-y-1">
                    {data.bukti_files.map((file) => (
                      <a
                        key={file.id}
                        href={file.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Download size={16} />
                        <span>{file.original_name}</span>
                        <span className="text-xs text-gray-400">
                          ({formatFileSize(Number(file.file_size))})
                        </span>
                      </a>
                    ))}
                  </div>
                )}
                {!data.bukti_link && (!data.bukti_files || data.bukti_files.length === 0) && (
                  <p className="text-gray-400 text-sm">Tidak ada bukti</p>
                )}
              </div>
            </div>

            {/* Waktu */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              <div>
                <p className="text-gray-500 mb-1">Disubmit pada</p>
                <p className="font-medium text-gray-900">
                  {data.submitted_at
                    ? new Date(data.submitted_at).toLocaleString('id-ID')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Direview pada</p>
                <p className="font-medium text-gray-900">
                  {data.reviewed_at
                    ? new Date(data.reviewed_at).toLocaleString('id-ID')
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Catatan Kaprodi Sebelumnya */}
        {data.catatan_kaprodi && (
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-6 mb-6">
            <h2 className="text-sm font-bold text-orange-900 mb-2">Catatan Kaprodi</h2>
            <p className="text-sm text-orange-800">{data.catatan_kaprodi}</p>
          </div>
        )}

        {/* Review History */}
        {data.review_logs && data.review_logs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase mb-4">Riwayat Review</h2>
            <div className="space-y-3">
              {data.review_logs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-gray-500 w-36">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                    {log.status_sebelum}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded">
                    {log.status_sesudah}
                  </span>
                  {log.catatan && (
                    <span className="text-xs text-gray-600 italic ml-2">
                      &quot;{log.catatan}&quot;
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Form - only show if status is proses */}
        {data.status === 'proses' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase mb-4">Review Isian</h2>

            <div className="space-y-4">
              {/* Catatan Revisi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (wajib jika revisi)
                </label>
                <textarea
                  value={reviewCatatan}
                  onChange={(e) => setReviewCatatan(e.target.value)}
                  placeholder="Tuliskan catatan atau alasan revisi..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleReviewSubmit('valid')}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle2 size={16} />
                  {isSubmitting ? 'Memproses...' : 'Validkan'}
                </button>
                <button
                  onClick={() => handleReviewSubmit('revisi')}
                  disabled={isSubmitting || !reviewCatatan.trim()}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                >
                  <AlertCircle size={16} />
                  {isSubmitting ? 'Memproses...' : 'Kembalikan untuk Revisi'}
                </button>
              </div>

              {/* Message */}
              {message && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
