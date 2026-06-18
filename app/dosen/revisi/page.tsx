'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Edit2, ArrowRight } from 'lucide-react';
import Link from 'next/link';


interface RevisiData {
  id: string;
  pemeriksaan_unsur_id: number;
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
            nama_instrumen: string;
          };
        };
      };
    };
  };
  periode: { tahun: string };
  judul_dokumen: string;
  catatan_kaprodi: string | null;
  reviewed_at: string;
  attempt: number;
}

export default function RevisiSayaPage() {
  const [revisis, setRevisis] = useState<RevisiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRevisi();
  }, []);

  const fetchRevisi = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ami_token');
      const res = await fetch('/api/isians?status=revisi', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data) {
        setRevisis(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Revisi Saya</h1>
        <p className="text-slate-500 text-sm mt-1">Isian yang perlu diperbaiki sesuai catatan Kaprodi</p>
      </div>

      {revisis.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Tidak ada isian yang perlu direvisi. Semua isian Anda sudah ok!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {revisis.map((revisi) => (
            <div key={revisi.id} className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div 
                className="p-5 bg-gradient-to-r from-rose-50 to-rose-100/50 border-b border-rose-200 cursor-pointer hover:from-rose-100 hover:to-rose-100 transition-colors flex items-center justify-between gap-4"
                onClick={() => setExpandedId(expandedId === revisi.id ? null : revisi.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-600 rounded-full text-white shrink-0">
                      <AlertCircle size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{revisi.judul_dokumen || 'Tanpa Judul'}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {revisi.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.instrumen.nama_instrumen}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-rose-700 bg-rose-100 px-2 py-1 rounded">Attempt #{revisi.attempt}</p>
                </div>
              </div>

              {/* Content */}
              {expandedId === revisi.id && (
                <div className="p-6 space-y-4 border-t border-slate-200 bg-slate-50">
                  {/* Info Grid */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <label className="text-xs font-medium text-slate-500 uppercase">Instrumen</label>
                      <p className="text-slate-800 font-medium mt-1 text-sm">
                        {revisi.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.instrumen.nama_instrumen}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <label className="text-xs font-medium text-slate-500 uppercase">Periode</label>
                      <p className="text-slate-800 font-medium mt-1 text-sm">{revisi.periode.tahun}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <label className="text-xs font-medium text-slate-500 uppercase">Kriteria</label>
                      <p className="text-slate-800 font-medium mt-1 text-sm">
                        [{revisi.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.kode_kriteria}] {revisi.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.nama_kriteria}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <label className="text-xs font-medium text-slate-500 uppercase">Kode AMI</label>
                      <p className="text-slate-800 font-medium mt-1 text-sm">
                        {revisi.pemeriksaan_unsur.deskripsi_area.kode_ami.kode_ami}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <label className="text-xs font-medium text-slate-500 uppercase">Deskripsi Area Audit</label>
                    <p className="text-slate-800 mt-1 text-sm">{revisi.pemeriksaan_unsur.deskripsi_area.deskripsi_area_audit}</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <label className="text-xs font-medium text-slate-500 uppercase">Pemeriksaan Unsur</label>
                    <p className="text-slate-800 mt-1 text-sm">{revisi.pemeriksaan_unsur.isi_unsur}</p>
                  </div>

                  {/* Catatan Kaprodi */}
                  {revisi.catatan_kaprodi && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-rose-100 rounded-full text-rose-600 shrink-0 mt-0.5">
                          <AlertCircle size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-rose-800 mb-1">Catatan dari Kaprodi</h4>
                          <p className="text-sm text-rose-700 leading-relaxed whitespace-pre-wrap">{revisi.catatan_kaprodi}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <label className="text-xs font-medium text-slate-500 uppercase">Tanggal Review</label>
                    <p className="text-slate-800 mt-1 text-sm">
                      {revisi.reviewed_at ? new Date(revisi.reviewed_at).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
                      onClick={() => setExpandedId(null)}
                    >
                      Tutup
                    </button>
                     
                    <Link
                      href={`/dosen/isi-ami?pemeriksaan_unsur_id=${revisi.pemeriksaan_unsur_id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium"
                    >
                      <Edit2 size={16} />
                      Perbaiki Isian
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {revisis.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>
              Mohon segera perbaiki isian sesuai dengan catatan yang diberikan oleh Kaprodi. 
              Anda dapat klik "Perbaiki Isian" di atas untuk mengedit isian dan mengirimkan versi terbaru.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
