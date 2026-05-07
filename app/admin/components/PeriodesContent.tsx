'use client';

import { useEffect, useState } from 'react';

export default function PeriodesContent({ token }: { token: string }) {
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tahun, setTahun] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPeriodes = () => {
    setLoading(true);
    fetch('/api/periodes', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setPeriodes(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPeriodes();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/periodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tahun })
      });
      const result = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setTahun('');
        fetchPeriodes();
      } else {
        alert(result.message || 'Gagal menambahkan periode');
      }
    } catch (err) {
      alert('Terjadi kesalahan server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActivate = async (id: string) => {
    if (!confirm('Aktifkan periode ini? Periode lain akan otomatis non-aktif.')) return;
    try {
      const res = await fetch(`/api/periodes/${id}/activate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchPeriodes();
      else alert('Gagal mengaktifkan periode');
    } catch (err) {
      alert('Terjadi kesalahan server');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-xl font-semibold text-slate-800 m-0">Manajemen Periode Audit</h3>
          <p className="text-slate-500 text-sm mt-1">Kelola tahun akademik yang akan menjadi periode audit aktif.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
        >
          ➕ Tambah Periode
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Memuat data periode...</div>
        ) : periodes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl">Belum ada data periode</div>
        ) : (
          periodes.map((p) => (
            <div key={p.id} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${p.is_active ? 'bg-indigo-50 border-indigo-500/30' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${p.is_active ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400'}`}>
                  📅
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800 m-0">{p.tahun}</h4>
                  <p className="text-sm text-slate-500 m-0 mt-0.5">
                    Total Instrumen: <span className="text-slate-600">{p._count?.instrumens || 0}</span> • Total Isian: <span className="text-slate-600">{p._count?.isians || 0}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {p.is_active ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Aktif
                  </span>
                ) : (
                  <button 
                    onClick={() => toggleActivate(p.id)}
                    className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-500 text-sm font-medium transition-colors border border-slate-200"
                  >
                    Set Aktif
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Tambah Periode Baru</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-500">Tahun Akademik</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: 2024/2025"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '...' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
