'use client';

import { useEffect, useState } from 'react';

export default function TugasUploadContent({ token, user }: { token: string; user: any }) {
  const [activePeriode, setActivePeriode] = useState<any | null>(null);
  const [instrumens, setInstrumens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isians, setIsians] = useState<any[]>([]);

  // Form State
  const [activeButir, setActiveButir] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    judul_dokumen: '',
    ketersediaan_standar: 'tidak_ada',
    dokumen: 'tidak_ada',
    pencapaian_standar_spt_pt: false,
    pencapaian_standar_sn_dikti: false,
    lokal: false,
    nasional: false,
    internasional: false,
    bukti_link: '',
    tahun_pelaksanaan: new Date().getFullYear().toString(),
    capaian: '',
    keterangan: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const periodesRes = await fetch('/api/periodes', { headers });
      const periodesData = await periodesRes.json();
      const active = periodesData.data?.find((p: any) => p.is_active);
      
      if (!active) {
        setLoading(false);
        return;
      }
      setActivePeriode(active);

      // Fetch instrumens for active period that are active
      const instRes = await fetch(`/api/instrumens?periode_id=${active.id}&is_active=true`, { headers });
      const instData = await instRes.json();
      
      // Fetch all butirs for these instrumens
      // For simplicity, we'll fetch butirs one by one or we could have a bulk endpoint.
      // Since we don't have a bulk butir by periode_id endpoint, we'll fetch them per instrumen
      const instWithButirs = await Promise.all((instData.data || []).map(async (inst: any) => {
        const bRes = await fetch(`/api/butirs?instrumen_id=${inst.id}`, { headers });
        const bData = await bRes.json();
        return { ...inst, butirs: bData.data || [] };
      }));
      setInstrumens(instWithButirs);

      // Fetch user's current isians to know what is already filled
      const isianRes = await fetch(`/api/isians?periode_id=${active.id}`, { headers });
      const isianData = await isianRes.json();
      setIsians(isianData.data || []);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleOpenForm = (butir: any) => {
    setActiveButir(butir);
    setFormData({
      judul_dokumen: '',
      ketersediaan_standar: 'tidak_ada',
      dokumen: 'tidak_ada',
      pencapaian_standar_spt_pt: false,
      pencapaian_standar_sn_dikti: false,
      lokal: false,
      nasional: false,
      internasional: false,
      bukti_link: '',
      tahun_pelaksanaan: new Date().getFullYear().toString(),
      capaian: '',
      keterangan: ''
    });
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeButir || !activePeriode) return;

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('butir_id', activeButir.id.toString());
      data.append('periode_id', activePeriode.id.toString());
      
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          data.append(key, value ? 'true' : 'false');
        } else if (value) {
          data.append(key, value as string);
        }
      });

      if (file) {
        data.append('bukti_dokumen', file);
      }

      const res = await fetch('/api/isians', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      if (res.ok) {
        alert('Dokumen berhasil diunggah!');
        setActiveButir(null);
        fetchData(); // Refresh data to update status
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal mengunggah dokumen');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengunggah');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get status of a butir for this user
  const getButirStatus = (butirId: string) => {
    const isianList = isians.filter(i => i.butir_id === butirId);
    if (isianList.length === 0) return null;
    
    // Get the latest attempt
    const latest = isianList.reduce((prev, current) => (prev.attempt > current.attempt) ? prev : current);
    return latest.status; // pending, valid, revisi
  };

  if (loading) return <div className="text-slate-500 animate-pulse">Memuat instrumen...</div>;

  if (!activePeriode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-4">
        <div className="text-6xl opacity-40">📅</div>
        <h3 className="text-xl font-semibold text-slate-500 m-0">Belum Ada Periode Aktif</h3>
        <p className="text-slate-500 text-sm max-w-sm m-0">
          Admin belum mengaktifkan periode AMI. Anda baru bisa mengisi instrumen setelah periode ditetapkan.
        </p>
      </div>
    );
  }

  if (activeButir) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setActiveButir(null)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            ←
          </button>
          <div>
            <h3 className="text-xl font-semibold text-slate-800 m-0">Formulir Isian AMI</h3>
            <p className="text-slate-500 text-sm mt-1">Kode: {activeButir.kode_butir}</p>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-6">
          <h4 className="text-sm font-bold text-indigo-700 uppercase tracking-wider mb-2">Target / Syarat Dokumen</h4>
          <p className="text-slate-700 text-sm leading-relaxed mb-0">{activeButir.target_standar}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Judul Dokumen <span className="text-red-600">*</span></label>
            <input 
              type="text" required
              value={formData.judul_dokumen} onChange={e => setFormData({...formData, judul_dokumen: e.target.value})}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-all"
              placeholder="Masukkan judul dokumen bukti..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-600">Ketersediaan Standar</label>
              <select 
                value={formData.ketersediaan_standar} onChange={e => setFormData({...formData, ketersediaan_standar: e.target.value})}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="ada">Ada</option>
                <option value="tidak_ada">Tidak Ada</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-600">Tahun Pelaksanaan</label>
              <input 
                type="text" required minLength={4} maxLength={4}
                value={formData.tahun_pelaksanaan} onChange={e => setFormData({...formData, tahun_pelaksanaan: e.target.value})}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Link Google Drive Bukti (Opsional)</label>
            <input 
              type="url"
              value={formData.bukti_link} onChange={e => setFormData({...formData, bukti_link: e.target.value})}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-all"
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Atau Unggah File (Opsional, max 5MB)</label>
            <input 
              type="file"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-500/30 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">Capaian / Keterangan Tambahan</label>
            <textarea 
              rows={3}
              value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-all"
              placeholder="Catatan tambahan (jika ada)..."
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-slate-800 font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Submit Dokumen'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-slate-800 m-0">Tugas Upload Dokumen</h3>
        <p className="text-slate-500 text-sm mt-1">Periode Aktif: <strong className="text-slate-600">{activePeriode.tahun}</strong></p>
      </div>

      <div className="flex flex-col gap-8">
        {instrumens.map(inst => (
          <div key={inst.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 bg-white border-b border-slate-200">
              <h4 className="text-base font-bold text-slate-800 m-0">{inst.nama_instrumen}</h4>
            </div>
            
            {inst.butirs?.length === 0 ? (
              <div className="p-6 text-sm text-slate-400 text-center">Belum ada butir instrumen</div>
            ) : (
              <div className="divide-y divide-white/5">
                {inst.butirs.map((butir: any) => {
                  const status = getButirStatus(butir.id);
                  return (
                    <div key={butir.id} className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:bg-white/[0.02] transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-bold text-indigo-600">{butir.kode_butir}</span>
                          {status === 'proses' && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-600">Menunggu Validasi</span>}
                          {status === 'valid' && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-600">Valid</span>}
                          {status === 'revisi' && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600">Revisi</span>}
                        </div>
                        <p className="text-slate-700 text-sm mb-1">{butir.deskripsi_area_audit}</p>
                        <p className="text-slate-500 text-[13px] m-0">Syarat: {butir.target_standar}</p>
                      </div>
                      
                      <div className="shrink-0">
                        {!status ? (
                          <button 
                            onClick={() => handleOpenForm(butir)}
                            className="px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold hover:bg-indigo-100 hover:text-indigo-800 transition-colors border border-indigo-200"
                          >
                            Isi Form Upload
                          </button>
                        ) : status === 'revisi' ? (
                          <button 
                            onClick={() => handleOpenForm(butir)}
                            className="px-5 py-2.5 rounded-xl bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 hover:text-red-800 transition-colors border border-red-200"
                          >
                            Perbaiki
                          </button>
                        ) : (
                          <div className="px-5 py-2.5 rounded-xl bg-white text-slate-400 text-sm font-bold border border-transparent cursor-not-allowed">
                            {status === 'valid' ? 'Tervalidasi' : 'Diproses'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {instrumens.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm border border-slate-200 rounded-2xl border-dashed">
            Admin belum menambahkan instrumen untuk periode ini.
          </div>
        )}
      </div>
    </div>
  );
}
