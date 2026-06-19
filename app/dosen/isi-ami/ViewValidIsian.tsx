'use client';

import { 
  CheckCircle, 
  Award, 
  Calendar, 
  FileText, 
  ExternalLink, 
  Download,
  Shield,
  TrendingUp,
  Globe,
  MapPin,
  Flag,
  User,
  Clock,
  X
} from 'lucide-react';

interface ValidIsianData {
  id: number;
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
  reviewed_at?: string;
  submitted_at?: string;
  dosen?: {
    nama_lengkap: string;
    nip: string;
  };
  existing_files?: Array<{
    id: string;
    original_name: string;
    file_path: string;
    file_size: number;
    judul_dokumen: string | null;
    keterangan_dokumen: string | null;
    tahun_dokumen: string | null;
  }>;
}

interface ViewValidIsianProps {
  data: ValidIsianData;
  unsurInfo: {
    isi_unsur: string;
    deskripsi_area_audit: string;
    kode_ami: string;
    nama_kriteria: string;
  };
  onClose: () => void;
}

export default function ViewValidIsian({ data, unsurInfo, onClose }: ViewValidIsianProps) {
  return (
    <div className="space-y-6">
      {/* Header Badge */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Shield size={32} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-wider">
                  Tervalidasi
                </span>
                <CheckCircle size={20} className="text-emerald-100" />
              </div>
              <h2 className="text-2xl font-bold mb-1">{data.judul_dokumen || 'Dokumen Isian AMI'}</h2>
              <p className="text-emerald-50 text-sm">
                Isian ini telah divalidasi oleh Kaprodi dan tidak dapat diubah lagi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Tutup"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Dosen Info */}
        {data.dosen && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User size={18} className="text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pengisi
              </span>
            </div>
            <p className="font-bold text-slate-800 text-sm">{data.dosen.nama_lengkap}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{data.dosen.nip}</p>
          </div>
        )}

        {/* Submit Date */}
        {data.submitted_at && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Calendar size={18} className="text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tanggal Submit
              </span>
            </div>
            <p className="font-bold text-slate-800 text-sm">
              {new Date(data.submitted_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(data.submitted_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
              })} WIB
            </p>
          </div>
        )}

        {/* Validated Date */}
        {data.reviewed_at && (
          <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm bg-emerald-50/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle size={18} className="text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Divalidasi
              </span>
            </div>
            <p className="font-bold text-emerald-800 text-sm">
              {new Date(data.reviewed_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {new Date(data.reviewed_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
              })} WIB
            </p>
          </div>
        )}
      </div>

      {/* Unsur Info */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <FileText size={18} className="text-slate-600" />
          Informasi Unsur AMI
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Kode AMI
            </p>
            <p className="font-mono font-bold text-slate-800">{unsurInfo.kode_ami}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Kriteria
            </p>
            <p className="font-medium text-slate-700">{unsurInfo.nama_kriteria}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Deskripsi Area Audit
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {unsurInfo.deskripsi_area_audit}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Pemeriksaan Unsur
            </p>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {unsurInfo.isi_unsur}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Dokumen Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-slate-600" />
              Detail Dokumen
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1 font-medium">Ketersediaan Standar</p>
                  <p className={`text-sm font-bold capitalize ${
                    data.ketersediaan_standar === 'ada' 
                      ? 'text-emerald-600' 
                      : 'text-slate-500'
                  }`}>
                    {data.ketersediaan_standar === 'ada' ? '✓ Ada' : '✗ Tidak Ada'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1 font-medium">Status Dokumen</p>
                  <p className={`text-sm font-bold capitalize ${
                    data.dokumen === 'ada' 
                      ? 'text-emerald-600' 
                      : 'text-slate-500'
                  }`}>
                    {data.dokumen === 'ada' ? '✓ Ada' : '✗ Tidak Ada'}
                  </p>
                </div>
              </div>

              {data.tahun_pelaksanaan && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-blue-600 mb-1 font-medium flex items-center gap-1">
                    <Calendar size={14} />
                    Tahun Pelaksanaan
                  </p>
                  <p className="text-lg font-bold text-blue-700">{data.tahun_pelaksanaan}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pencapaian Standar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Award size={18} className="text-slate-600" />
              Pencapaian Standar
            </h3>
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                data.pencapaian_standar_spt_pt
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                {data.pencapaian_standar_spt_pt ? (
                  <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                )}
                <span className={`text-sm font-medium ${
                  data.pencapaian_standar_spt_pt ? 'text-emerald-800' : 'text-slate-600'
                }`}>
                  Standar SPT PT
                </span>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                data.pencapaian_standar_sn_dikti
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                {data.pencapaian_standar_sn_dikti ? (
                  <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                )}
                <span className={`text-sm font-medium ${
                  data.pencapaian_standar_sn_dikti ? 'text-emerald-800' : 'text-slate-600'
                }`}>
                  Standar SN Dikti
                </span>
              </div>
            </div>
          </div>

          {/* Daya Saing */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-slate-600" />
              Daya Saing
            </h3>
            <div className="flex flex-wrap gap-3">
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border shadow-sm ${
                data.daya_saing_lokal
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                {data.daya_saing_lokal ? (
                  <MapPin size={16} className="text-blue-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
                <span className={`text-sm font-semibold ${
                  data.daya_saing_lokal ? 'text-blue-700' : 'text-slate-500'
                }`}>
                  Lokal
                </span>
              </div>

              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border shadow-sm ${
                data.daya_saing_nasional
                  ? 'bg-indigo-50 border-indigo-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                {data.daya_saing_nasional ? (
                  <Flag size={16} className="text-indigo-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
                <span className={`text-sm font-semibold ${
                  data.daya_saing_nasional ? 'text-indigo-700' : 'text-slate-500'
                }`}>
                  Nasional
                </span>
              </div>

              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border shadow-sm ${
                data.daya_saing_internasional
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                {data.daya_saing_internasional ? (
                  <Globe size={16} className="text-purple-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
                <span className={`text-sm font-semibold ${
                  data.daya_saing_internasional ? 'text-purple-700' : 'text-slate-500'
                }`}>
                  Internasional
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Capaian */}
          {data.capaian && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Award size={18} className="text-slate-600" />
                Capaian
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {data.capaian}
                </p>
              </div>
            </div>
          )}

          {/* Keterangan */}
          {data.keterangan && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <FileText size={18} className="text-slate-600" />
                Keterangan Tambahan
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {data.keterangan}
                </p>
              </div>
            </div>
          )}

          {/* Catatan Kaprodi */}
          {data.catatan_kaprodi && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 shadow-md">
              <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-600" />
                Catatan Kaprodi
              </h3>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-emerald-100">
                <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap">
                  {data.catatan_kaprodi}
                </p>
              </div>
            </div>
          )}

          {/* Bukti Link */}
          {data.bukti_link && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <ExternalLink size={18} className="text-slate-600" />
                Tautan Bukti Eksternal
              </h3>
              <a
                href={data.bukti_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors group"
              >
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <ExternalLink size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800 truncate">
                    {data.bukti_link}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">Klik untuk membuka</p>
                </div>
              </a>
            </div>
          )}

          {/* Bukti Files */}
          {data.existing_files && data.existing_files.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-slate-600" />
                Dokumen Bukti ({data.existing_files.length})
              </h3>
              <div className="space-y-3">
                {data.existing_files.map((file, idx) => (
                  <div
                    key={file.id}
                    className="flex items-start justify-between gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors group"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                        <FileText size={20} className="text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {file.judul_dokumen || file.original_name}
                        </p>
                        {file.keterangan_dokumen && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {file.keterangan_dokumen}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {(file.file_size / 1024).toFixed(1)} KB
                          </span>
                          {file.tahun_dokumen && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-200">
                              {file.tahun_dokumen}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`/api/files/${file.id}`}
                      download={file.original_name}
                      className="p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all group-hover:scale-105 shrink-0"
                      title="Download"
                    >
                      <Download size={18} className="text-slate-600 group-hover:text-blue-600" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
            <Shield size={20} className="text-emerald-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-800 mb-1">
              Isian Terproteksi
            </h4>
            <p className="text-sm text-emerald-700 leading-relaxed">
              Dokumen ini telah divalidasi oleh Kaprodi dan tidak dapat diubah atau dihapus. 
              Data ini akan digunakan untuk keperluan audit dan pelaporan AMI program studi.
            </p>
          </div>
        </div>
      </div>

      {/* Close Button */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
