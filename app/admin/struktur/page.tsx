'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, FolderTree, FileText, AlertCircle, X, ChevronUp } from 'lucide-react';

// Interfaces for our nested data structure
interface UnsurData {
  id: string;
  isi_unsur: string;
  urutan: number;
}

interface DeskripsiData {
  id: string;
  deskripsi_area_audit: string;
  target_standar: string | null;
  urutan: number;
  pemeriksaan_unsurs: UnsurData[];
}

interface KodeAmiData {
  id: string;
  kode_ami: string;
  urutan: number;
  deskripsi_areas: DeskripsiData[];
}

interface KriteriaData {
  id: string;
  kode_kriteria: string;
  nama_kriteria: string;
  urutan: number;
  kode_amis: KodeAmiData[];
}

interface InstrumenData {
  id: string;
  nama_instrumen: string;
}

type NodeType = 'kriteria' | 'kode_ami' | 'deskripsi' | 'unsur';

function StrukturContent() {
  const searchParams = useSearchParams();
  const initInstrumenId = searchParams?.get('instrumen_id') || '';

  const [instrumens, setInstrumens] = useState<InstrumenData[]>([]);
  const [selectedInstrumen, setSelectedInstrumen] = useState(initInstrumenId);
  const [treeData, setTreeData] = useState<KriteriaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<NodeType>('kriteria');
  const [editId, setEditId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null); // To store parent ID for POST
  const [formData, setFormData] = useState<any>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchInstrumens();
  }, []);

  useEffect(() => {
    if (selectedInstrumen) {
      fetchTreeData(selectedInstrumen);
    } else {
      setTreeData([]);
    }
  }, [selectedInstrumen]);

  const fetchInstrumens = async () => {
    try {
      const token = localStorage.getItem('ami_token');
      const res = await fetch('/api/instrumens', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.data) {
        setInstrumens(data.data);
        if (!initInstrumenId && data.data.length > 0) {
          setSelectedInstrumen(data.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTreeData = async (instrumenId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ami_token');
      const res = await fetch(`/api/kriteria?instrumen_id=${instrumenId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.data) {
        setTreeData(data.data);
        // Expand criteria by default
        const initialExpanded: Record<string, boolean> = { ...expandedNodes };
        data.data.forEach((k: any) => {
          initialExpanded[`k-${k.id}`] = true;
        });
        setExpandedNodes(initialExpanded);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const collapseAll = () => setExpandedNodes({});
  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    treeData.forEach(k => {
      allExp[`k-${k.id}`] = true;
      k.kode_amis.forEach(a => {
        allExp[`a-${a.id}`] = true;
        a.deskripsi_areas.forEach(d => {
          allExp[`d-${d.id}`] = true;
        });
      });
    });
    setExpandedNodes(allExp);
  };

  const openModal = (type: NodeType, isEdit: boolean, nodeData?: any, parent?: string) => {
    setModalType(type);
    setEditId(isEdit && nodeData ? nodeData.id : null);
    setParentId(!isEdit && parent ? parent : null);
    setErrorMsg('');

    if (type === 'kriteria') {
      setFormData(isEdit ? {
        kode_kriteria: nodeData.kode_kriteria,
        nama_kriteria: nodeData.nama_kriteria,
        urutan: nodeData.urutan || 1
      } : { kode_kriteria: '', nama_kriteria: '', urutan: treeData.length + 1 });
    } else if (type === 'kode_ami') {
      setFormData(isEdit ? {
        kode_ami: nodeData.kode_ami,
        urutan: nodeData.urutan || 1
      } : { kode_ami: '', urutan: 1 });
    } else if (type === 'deskripsi') {
      setFormData(isEdit ? {
        deskripsi_area_audit: nodeData.deskripsi_area_audit,
        target_standar: nodeData.target_standar || '',
        urutan: nodeData.urutan || 1
      } : { deskripsi_area_audit: '', target_standar: '', urutan: 1 });
    } else if (type === 'unsur') {
      setFormData(isEdit ? {
        isi_unsur: nodeData.isi_unsur,
        urutan: nodeData.urutan || 1
      } : { isi_unsur: '', urutan: 1 });
    }
    
    setIsModalOpen(true);
  };

  const handleDelete = async (type: NodeType, id: string, title: string) => {
    if (!confirm(`Hapus ${title}? Semua data di bawahnya akan terhapus.`)) return;
    try {
      const token = localStorage.getItem('ami_token');
      let endpoint = '';
      if (type === 'kriteria') endpoint = `/api/kriteria/${id}`;
      else if (type === 'kode_ami') endpoint = `/api/kode-ami/${id}`;
      else if (type === 'deskripsi') endpoint = `/api/deskripsi-area/${id}`;
      else if (type === 'unsur') endpoint = `/api/pemeriksaan-unsur/${id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTreeData(selectedInstrumen);
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal menghapus data');
      }
    } catch (e) {
      alert('Terjadi kesalahan server');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitLoading(true);

    try {
      const token = localStorage.getItem('ami_token');
      const method = editId ? 'PUT' : 'POST';
      let endpoint = '';
      let payload: any = { ...formData };

      if (modalType === 'kriteria') {
        endpoint = editId ? `/api/kriteria/${editId}` : '/api/kriteria';
        if (!editId) payload.instrumen_id = selectedInstrumen;
      } else if (modalType === 'kode_ami') {
        endpoint = editId ? `/api/kode-ami/${editId}` : '/api/kode-ami';
        if (!editId) payload.kriteria_id = parentId;
      } else if (modalType === 'deskripsi') {
        endpoint = editId ? `/api/deskripsi-area/${editId}` : '/api/deskripsi-area';
        if (!editId) payload.kode_ami_id = parentId;
      } else if (modalType === 'unsur') {
        endpoint = editId ? `/api/pemeriksaan-unsur/${editId}` : '/api/pemeriksaan-unsur';
        if (!editId) payload.deskripsi_area_id = parentId;
      }

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchTreeData(selectedInstrumen);
        // If adding new, auto-expand parent
        if (!editId && parentId) {
           const prefix = modalType === 'kode_ami' ? 'k-' : modalType === 'deskripsi' ? 'a-' : 'd-';
           setExpandedNodes(prev => ({...prev, [`${prefix}${parentId}`]: true}));
        }
      } else {
        setErrorMsg(data.message || 'Terjadi kesalahan');
      }
    } catch (e) {
      setErrorMsg('Kesalahan jaringan');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Node Renderers
  const renderUnsur = (u: UnsurData, dId: string) => {
    return (
      <div key={`u-${u.id}`} className="w-full">
        <div className="flex items-center gap-3 p-3 border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors group" style={{ paddingLeft: `7rem` }}>
          <div className="w-6" />
          <div className="shrink-0"><div className="w-2 h-2 rounded-full bg-emerald-500" /></div>
          <div className="flex-1 text-sm text-slate-700">{u.isi_unsur}</div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openModal('unsur', true, u)} className="p-1 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded transition-colors" title="Edit"><Edit2 size={14} /></button>
            <button onClick={() => handleDelete('unsur', u.id, u.isi_unsur)} className="p-1 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded transition-colors" title="Hapus"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeskripsi = (d: DeskripsiData, aId: string) => {
    const isExpanded = expandedNodes[`d-${d.id}`];
    const hasChildren = d.pemeriksaan_unsurs && d.pemeriksaan_unsurs.length > 0;
    return (
      <div key={`d-${d.id}`} className="w-full">
        <div className="flex items-center gap-3 p-3 border-b border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors group" style={{ paddingLeft: `5rem` }}>
          <button onClick={() => toggleNode(`d-${d.id}`)} className={`p-1 rounded text-slate-500 transition-colors ${hasChildren ? 'hover:bg-slate-200' : 'opacity-30'}`}>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <div className="shrink-0"><FileText size={14} className="text-slate-500" /></div>
          <div className="flex-1 text-sm text-slate-700">
             {d.deskripsi_area_audit}
             {d.target_standar && <span className="ml-2 text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">Target: {d.target_standar}</span>}
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openModal('unsur', false, undefined, d.id)} className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 text-xs font-medium text-slate-600 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
              <Plus size={12} /> Tambah Unsur
            </button>
            <button onClick={() => openModal('deskripsi', true, d)} className="p-1 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded transition-colors"><Edit2 size={14} /></button>
            <button onClick={() => handleDelete('deskripsi', d.id, d.deskripsi_area_audit)} className="p-1 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
        {isExpanded && d.pemeriksaan_unsurs.map(u => renderUnsur(u, d.id))}
      </div>
    );
  };

  const renderKodeAmi = (a: KodeAmiData, kId: string) => {
    const isExpanded = expandedNodes[`a-${a.id}`];
    const hasChildren = a.deskripsi_areas && a.deskripsi_areas.length > 0;
    return (
      <div key={`a-${a.id}`} className="w-full">
        <div className="flex items-center gap-3 p-3 border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors group" style={{ paddingLeft: `3rem` }}>
          <button onClick={() => toggleNode(`a-${a.id}`)} className={`p-1 rounded text-slate-500 transition-colors ${hasChildren ? 'hover:bg-slate-200' : 'opacity-30'}`}>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <div className="shrink-0"><div className="w-6 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">AMI</div></div>
          <div className="flex-1 flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700 border border-slate-200">{a.kode_ami}</span>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openModal('deskripsi', false, undefined, a.id)} className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 text-xs font-medium text-slate-600 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
              <Plus size={12} /> Tambah Deskripsi
            </button>
            <button onClick={() => openModal('kode_ami', true, a)} className="p-1 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded transition-colors"><Edit2 size={14} /></button>
            <button onClick={() => handleDelete('kode_ami', a.id, a.kode_ami)} className="p-1 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
        {isExpanded && a.deskripsi_areas.map(d => renderDeskripsi(d, a.id))}
      </div>
    );
  };

  const renderKriteria = (k: KriteriaData) => {
    const isExpanded = expandedNodes[`k-${k.id}`];
    const hasChildren = k.kode_amis && k.kode_amis.length > 0;
    return (
      <div key={`k-${k.id}`} className="w-full">
        <div className="flex items-center gap-3 p-3 border-b border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 transition-colors group" style={{ paddingLeft: `1rem` }}>
          <button onClick={() => toggleNode(`k-${k.id}`)} className={`p-1 rounded text-slate-500 transition-colors ${hasChildren ? 'hover:bg-indigo-100' : 'opacity-30'}`}>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <div className="shrink-0"><FolderTree size={16} className="text-indigo-600" /></div>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-white rounded text-indigo-700 border border-indigo-200">{k.kode_kriteria}</span>
            <span className="text-sm font-bold text-slate-800">{k.nama_kriteria}</span>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openModal('kode_ami', false, undefined, k.id)} className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 text-xs font-medium text-slate-600 rounded hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
              <Plus size={12} /> Tambah Kode AMI
            </button>
            <button onClick={() => openModal('kriteria', true, k)} className="p-1 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded transition-colors"><Edit2 size={14} /></button>
            <button onClick={() => handleDelete('kriteria', k.id, k.kode_kriteria)} className="p-1 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
        {isExpanded && k.kode_amis.map(a => renderKodeAmi(a, k.id))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Struktur Instrumen</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola hierarki Kriteria, Kode AMI, Deskripsi, hingga Pemeriksaan Unsur</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
             <label className="text-sm font-medium text-slate-700 shrink-0">Instrumen:</label>
             <select 
               className="w-full lg:w-64 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-indigo-500 shadow-sm"
               value={selectedInstrumen}
               onChange={(e) => setSelectedInstrumen(e.target.value)}
             >
               {instrumens.length === 0 && <option value="">Tidak ada instrumen</option>}
               {instrumens.map(i => (
                 <option key={i.id} value={i.id}>{i.nama_instrumen}</option>
               ))}
             </select>
          </div>
          
          <div className="flex gap-2 w-full lg:w-auto justify-end">
            <button onClick={collapseAll} className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm">
              <ChevronUp size={16} className="inline mr-1"/> Lipat
            </button>
            <button onClick={expandAll} className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm">
              <ChevronDown size={16} className="inline mr-1"/> Bentangkan
            </button>
            <button 
              onClick={() => openModal('kriteria', false)}
              disabled={!selectedInstrumen}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} /> Tambah Kriteria
            </button>
          </div>
        </div>

        {/* Tree Header */}
        <div className="bg-slate-100 border-b border-slate-200 px-10 py-3 flex text-xs font-bold text-slate-500 uppercase tracking-wider">
           Hierarki Struktur Item Audit
        </div>

        {/* Tree Body */}
        <div className="w-full overflow-x-auto pb-10 min-h-[300px]">
           <div className="min-w-[800px]">
             {loading ? (
               <div className="p-8 text-center text-slate-500">Memuat struktur instrumen...</div>
             ) : treeData.length === 0 ? (
               <div className="p-8 text-center text-slate-500">
                 {selectedInstrumen ? 'Tidak ada struktur untuk instrumen ini. Tambahkan kriteria pertama.' : 'Pilih instrumen terlebih dahulu.'}
               </div>
             ) : (
               treeData.map(k => renderKriteria(k))
             )}
           </div>
        </div>
      </div>

      {/* Dynamic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 capitalize">
                {editId ? 'Edit' : 'Tambah'} {modalType.replace('_', ' ')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {errorMsg && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-600 text-sm">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              <div className="space-y-4">
                {/* Form fields based on modalType */}
                {modalType === 'kriteria' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Kode Kriteria</label>
                      <input type="text" required value={formData.kode_kriteria || ''} onChange={(e) => setFormData({...formData, kode_kriteria: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-sm" placeholder="Contoh: K1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kriteria</label>
                      <input type="text" required value={formData.nama_kriteria || ''} onChange={(e) => setFormData({...formData, nama_kriteria: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-sm" placeholder="Visi Misi dan Tujuan..." />
                    </div>
                  </>
                )}

                {modalType === 'kode_ami' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kode AMI</label>
                    <input type="text" required value={formData.kode_ami || ''} onChange={(e) => setFormData({...formData, kode_ami: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-sm" placeholder="Contoh: A.1.1" />
                  </div>
                )}

                {modalType === 'deskripsi' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Area Audit</label>
                      <textarea required value={formData.deskripsi_area_audit || ''} onChange={(e) => setFormData({...formData, deskripsi_area_audit: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-sm min-h-[80px]" placeholder="Deskripsikan area yang diaudit..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Target Standar (Opsional)</label>
                      <input type="text" value={formData.target_standar || ''} onChange={(e) => setFormData({...formData, target_standar: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-sm" placeholder="100% Tercapai" />
                    </div>
                  </>
                )}

                {modalType === 'unsur' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Isi Unsur (Pemeriksaan / Dokumen)</label>
                    <textarea required value={formData.isi_unsur || ''} onChange={(e) => setFormData({...formData, isi_unsur: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-sm min-h-[80px]" placeholder="SK Penetapan..." />
                  </div>
                )}

                {/* Shared Urutan Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Urut</label>
                  <input type="number" required min="1" value={formData.urutan || 1} onChange={(e) => setFormData({...formData, urutan: parseInt(e.target.value) || 1})} className="w-24 px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-sm" />
                  <p className="text-xs text-slate-500 mt-1">Digunakan untuk mengurutkan tampilan di dashboard dosen.</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={submitLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-70">
                  {submitLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StrukturInstrumenPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat...</div>}>
      <StrukturContent />
    </Suspense>
  );
}
