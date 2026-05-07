'use client';

import { useEffect, useState } from 'react';

export default function InstrumensContent({ token }: { token: string }) {
  const [instrumens, setInstrumens] = useState<any[]>([]);
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sub-view state
  const [activeInstrumen, setActiveInstrumen] = useState<any | null>(null);
  const [butirs, setButirs] = useState<any[]>([]);
  const [loadingButir, setLoadingButir] = useState(false);

  // Modal State - Standar
  const [isStandarModalOpen, setIsStandarModalOpen] = useState(false);
  const [standarForm, setStandarForm] = useState({ id: '', nama_instrumen: '', periode_id: '', is_active: true });
  
  // Modal State - Butir
  const [isButirModalOpen, setIsButirModalOpen] = useState(false);
  const [butirForm, setButirForm] = useState({ kode_butir: '', deskripsi_area_audit: '', target_standar: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/instrumens', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch('/api/periodes', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
    ])
      .then(([resInstrumen, resPeriode]) => {
        if (resInstrumen.data) setInstrumens(resInstrumen.data);
        if (resPeriode.data) setPeriodes(resPeriode.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const viewButir = (instrumen: any) => {
    setActiveInstrumen(instrumen);
    fetchButir(instrumen.id);
  };

  const fetchButir = (instrumenId: string) => {
    setLoadingButir(true);
    fetch(`/api/butirs?instrumen_id=${instrumenId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setButirs(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingButir(false));
  };

  const handleImport = () => {
    alert('Fitur Import Excel/CSV massal sedang dalam pengembangan');
  };

  const submitStandar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = standarForm.id ? `/api/instrumens/${standarForm.id}` : '/api/instrumens';
      const method = standarForm.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          nama_instrumen: standarForm.nama_instrumen,
          periode_id: standarForm.periode_id ? parseInt(standarForm.periode_id) : undefined,
          is_active: standarForm.is_active
        })
      });
      
      if (res.ok) {
        setIsStandarModalOpen(false);
        setStandarForm({ id: '', nama_instrumen: '', periode_id: '', is_active: true });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal menyimpan standar');
      }
    } catch (err) {
      alert('Terjadi kesalahan server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteStandar = async (id: string) => {
    if (!confirm('Yakin ingin menghapus standar ini beserta seluruh butirnya?')) return;
    try {
      const res = await fetch(`/api/instrumens/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
      else alert('Gagal menghapus standar');
    } catch (err) {
      alert('Terjadi kesalahan server');
    }
  };

  const toggleStandarActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/instrumens/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const submitButir = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/butirs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          instrumen_id: activeInstrumen.id,
          kode_butir: butirForm.kode_butir,
          deskripsi_area_audit: butirForm.deskripsi_area_audit,
          target_standar: butirForm.target_standar
        })
      });
      if (res.ok) {
        setIsButirModalOpen(false);
        setButirForm({ kode_butir: '', deskripsi_area_audit: '', target_standar: '' });
        fetchButir(activeInstrumen.id);
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal menambahkan butir');
      }
    } catch (err) {
      alert('Terjadi kesalahan server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditStandar = (inst: any) => {
    setStandarForm({
      id: inst.id,
      nama_instrumen: inst.nama_instrumen,
      periode_id: inst.periode_id ? inst.periode_id.toString() : '',
      is_active: inst.is_active
    });
    setIsStandarModalOpen(true);
  };

  const openCreateStandar = () => {
    setStandarForm({ id: '', nama_instrumen: '', periode_id: '', is_active: true });
    setIsStandarModalOpen(true);
  };

  if (activeInstrumen) {
    return (
      <div className="flex flex-col gap-6 relative">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => setActiveInstrumen(null)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            ←
          </button>
          <div>
            <h3 className="text-xl font-semibold text-slate-800 m-0">Butir Daftar Tilik</h3>
            <p className="text-slate-500 text-sm mt-1">Standar: {activeInstrumen.nama_instrumen}</p>
          </div>
        </div>

        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
          <button 
            onClick={() => setIsButirModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 font-medium hover:bg-indigo-500/30 transition-colors text-sm"
          >
            ➕ Tambah Butir
          </button>
          <button 
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-medium hover:bg-emerald-500/30 transition-colors text-sm"
          >
            📥 Import Excel/CSV
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loadingButir ? (
            <div className="p-8 text-center text-slate-500 text-sm">Memuat daftar tilik...</div>
          ) : butirs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Belum ada butir untuk standar ini.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Kode</th>
                  <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold w-1/3">Deskripsi Area Audit</th>
                  <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold w-1/3">Target Standar</th>
                  <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {butirs.map((b) => (
                  <tr key={b.id} className="hover:bg-white transition-colors border-b border-slate-200 last:border-0">
                    <td className="p-4 text-slate-700 text-sm font-bold whitespace-nowrap align-top">{b.kode_butir}</td>
                    <td className="p-4 text-slate-700 text-sm align-top">{b.deskripsi_area_audit}</td>
                    <td className="p-4 text-slate-700 text-sm align-top">{b.target_standar}</td>
                    <td className="p-4 text-slate-700 text-sm align-top">
                      <div className="flex gap-2">
                        <button className="bg-transparent border-none text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded transition-colors text-xs cursor-pointer">
                          Edit
                        </button>
                        <button className="bg-transparent border-none text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors text-xs cursor-pointer">
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Tambah Butir */}
        {isButirModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Tambah Butir Instrumen</h3>
              <form onSubmit={submitButir} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-slate-500">Kode Butir</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Misal: AMI 1.1"
                    value={butirForm.kode_butir}
                    onChange={(e) => setButirForm({...butirForm, kode_butir: e.target.value})}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-slate-500">Deskripsi Area Audit</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Deskripsikan area yang diaudit..."
                    value={butirForm.deskripsi_area_audit}
                    onChange={(e) => setButirForm({...butirForm, deskripsi_area_audit: e.target.value})}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-slate-500">Target Standar / Syarat Dokumen</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Sebutkan target atau dokumen yang dipersyaratkan..."
                    value={butirForm.target_standar}
                    onChange={(e) => setButirForm({...butirForm, target_standar: e.target.value})}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="flex gap-3 justify-end mt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsButirModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 text-sm font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? '...' : 'Simpan Butir'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-xl font-semibold text-slate-800 m-0">Standar AMI (Kategori Induk)</h3>
          <p className="text-slate-500 text-sm mt-1">Kelola standar utama untuk pelaksanaan audit.</p>
        </div>
        <button 
          onClick={openCreateStandar}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
        >
          ➕ Tambah Standar
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Memuat data standar...</div>
        ) : instrumens.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Belum ada data standar AMI</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold w-[40%]">Nama Standar / Kategori</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Periode</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Status</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold">Kelola Butir</th>
                <th className="p-4 text-left border-b border-slate-200 bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {instrumens.map((i) => (
                <tr key={i.id} className={`hover:bg-white transition-colors border-b border-slate-200 last:border-0 group ${!i.is_active ? 'opacity-50' : ''}`}>
                  <td className="p-4 text-slate-800 font-medium text-[15px]">{i.nama_instrumen}</td>
                  <td className="p-4 text-slate-700 text-sm">
                    {i.periode ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${i.periode.is_active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                        {i.periode.tahun}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-700 text-sm">
                    <button
                      onClick={() => toggleStandarActive(i.id, i.is_active)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${i.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${i.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => viewButir(i)}
                      className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-all text-sm font-medium cursor-pointer"
                    >
                      Daftar Tilik ({i._count?.butir_instrumens || 0}) ➔
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => openEditStandar(i)}
                        className="bg-transparent border-none text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded transition-colors text-xs cursor-pointer font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteStandar(i.id)}
                        className="bg-transparent border-none text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors text-xs cursor-pointer font-medium"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Tambah/Edit Standar */}
      {isStandarModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{standarForm.id ? 'Edit' : 'Tambah'} Standar Kriteria</h3>
            <form onSubmit={submitStandar} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-500">Nama Standar / Kriteria</label>
                <input 
                  type="text" 
                  required
                  placeholder="Misal: Standar Pendidikan"
                  value={standarForm.nama_instrumen}
                  onChange={(e) => setStandarForm({...standarForm, nama_instrumen: e.target.value})}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-500">Periode</label>
                <select 
                  value={standarForm.periode_id}
                  onChange={(e) => setStandarForm({...standarForm, periode_id: e.target.value})}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
                >
                  <option value="">Pilih Periode (Opsional)</option>
                  {periodes.map(p => (
                    <option key={p.id} value={p.id}>{p.tahun} {p.is_active ? '(Aktif)' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsStandarModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
