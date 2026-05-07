'use client';

import { useEffect, useState } from 'react';

export default function RiwayatContent({ token, user }: { token: string; user: any }) {
  const [isians, setIsians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Edit Revisi
  const [activeIsian, setActiveIsian] = useState<any | null>(null);
  const [buktiLink, setBuktiLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRiwayat = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const periodesRes = await fetch('/api/periodes', { headers });
      const periodesData = await periodesRes.json();
      const activePeriode = periodesData.data?.find((p: any) => p.is_active);

      let url = '/api/isians';
      if (activePeriode) {
        url += `?periode_id=${activePeriode.id}`;
      }

      const isiansRes = await fetch(url, { headers });
      const isiansData = await isiansRes.json();
      setIsians(isiansData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, [token]);

  const handleEditRevisi = (isian: any) => {
    setActiveIsian(isian);
    setBuktiLink(isian.bukti_link || '');
  };

  const submitRevisi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('bukti_link', buktiLink);

      const res = await fetch(`/api/isians/${activeIsian.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      if (res.ok) {
        alert('Tautan bukti berhasil diperbarui. Status kembali diproses.');
        setActiveIsian(null);
        fetchRiwayat();
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal memperbarui tautan');
      }
    } catch (err) {
      alert('Terjadi kesalahan server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-xl font-semibold text-slate-800 m-0">Status Dokumen Saya</h3>
          <p className="text-slate-500 text-sm mt-1">Pantau status validasi dari Kaprodi dan perbaiki dokumen jika diperlukan.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Memuat riwayat dokumen...</div>
        ) : isians.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Belum ada riwayat dokumen yang diunggah.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Butir Instrumen</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Judul Dokumen</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Waktu Upload</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Status</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isians.map((i) => (
                <tr key={i.id} className={`hover:bg-white transition-colors border-b border-slate-200 last:border-0 ${i.status === 'revisi' ? 'bg-red-50' : ''}`}>
                  <td className="p-4 text-slate-700 text-sm">
                    <div className="font-bold text-indigo-600">{i.butir_instrumen?.kode_butir || '-'}</div>
                    <div className="text-xs text-slate-500 max-w-xs truncate">{i.butir_instrumen?.instrumen?.nama_instrumen}</div>
                  </td>
                  <td className="p-4 text-slate-700 text-sm max-w-xs truncate">
                    {i.judul_dokumen}
                    {i.bukti_link && (
                      <a href={i.bukti_link} target="_blank" rel="noreferrer" className="block text-xs text-indigo-600 hover:text-indigo-700 mt-1">
                        Lihat Tautan ↗
                      </a>
                    )}
                  </td>
                  <td className="p-4 text-slate-500 text-sm whitespace-nowrap">
                    {new Date(i.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4">
                    {i.status === 'proses' || i.status === 'pending' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-600">
                        🟡 Pending
                      </span>
                    ) : i.status === 'valid' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-600">
                        🟢 Valid
                      </span>
                    ) : (
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-100 text-red-600">
                          🔴 Revisi
                        </span>
                        {i.catatan_kaprodi && (
                          <span className="text-xs text-red-700/80 max-w-[200px] leading-snug">
                            <strong>Catatan:</strong> {i.catatan_kaprodi}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {i.status === 'revisi' ? (
                      <button 
                        onClick={() => handleEditRevisi(i)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors border border-red-200 whitespace-nowrap"
                      >
                        Perbaiki Tautan
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Edit Revisi */}
      {activeIsian && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Perbaiki Dokumen</h3>
            <p className="text-slate-500 text-sm mb-4">
              <strong>Catatan Kaprodi:</strong> {activeIsian.catatan_kaprodi || 'Tidak ada catatan'}
            </p>
            <form onSubmit={submitRevisi} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-500">Perbarui Tautan GDrive (Link Bukti)</label>
                <input 
                  type="url" 
                  required
                  placeholder="https://drive.google.com/..."
                  value={buktiLink}
                  onChange={(e) => setBuktiLink(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button 
                  type="button" 
                  onClick={() => setActiveIsian(null)}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-slate-800 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '...' : 'Kirim Ulang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
