'use client';

import { useState, useEffect } from 'react';
import { FileUp, ChevronDown, Save, Send, AlertCircle, CheckCircle, FileText } from 'lucide-react';

interface TreeNode {
  id: string;
  kode_kriteria?: string;
  nama_kriteria?: string;
  kode_ami?: string;
  isi_unsur?: string;
  deskripsi_area_audit?: string;
  type: 'kriteria' | 'ami' | 'area' | 'unsur';
  children?: TreeNode[];
  expanded?: boolean;
}

interface FormData {
  pemeriksaan_unsur_id: string;
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
  bukti_file: File | null;
}

export default function IsiAmiPage() {
  const [instrumens, setInstrumens] = useState<any[]>([]);
  const [selectedInstrumen, setSelectedInstrumen] = useState<string>('');
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedUnsur, setSelectedUnsur] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState<FormData>({
    pemeriksaan_unsur_id: '',
    judul_dokumen: '',
    ketersediaan_standar: 'tidak_ada',
    dokumen: 'tidak_ada',
    pencapaian_standar_spt_pt: false,
    pencapaian_standar_sn_dikti: false,
    daya_saing_lokal: false,
    daya_saing_nasional: false,
    daya_saing_internasional: false,
    bukti_link: '',
    tahun_pelaksanaan: '',
    capaian: '',
    keterangan: '',
    bukti_file: null,
  });

  useEffect(() => {
    fetchInstrumens();
  }, []);

  const fetchInstrumens = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ami_token');
      const res = await fetch('/api/instrumens?is_active=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data) {
        setInstrumens(data.data);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Gagal memuat instrumen');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstrumenStructure = async (instrumenId: string) => {
    try {
      setLoading(true);
      setSelectedUnsur(null);
      setTreeData([]);
      
      const token = localStorage.getItem('ami_token');
      const res = await fetch(`/api/kriteria?instrumen_id=${instrumenId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.data) {
        buildTree(data.data);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Gagal memuat struktur instrumen');
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (kriteria: any[]) => {
    const tree: TreeNode[] = kriteria.map(k => {
      const kodeAmis = (k.kode_amis || []).map((ami: any) => {
        const deskripsiAreas = (ami.deskripsi_areas || []).map((area: any) => ({
          id: area.id?.toString() || Math.random().toString(),
          deskripsi_area_audit: area.deskripsi_area_audit,
          type: 'area' as const,
          expanded: true,
          children: (area.pemeriksaan_unsurs || []).map((unsur: any) => ({
            id: unsur.id?.toString() || Math.random().toString(),
            isi_unsur: unsur.isi_unsur,
            type: 'unsur' as const,
          }))
        }));
        
        return {
          id: ami.id?.toString() || Math.random().toString(),
          kode_ami: ami.kode_ami,
          type: 'ami' as const,
          expanded: true,
          children: deskripsiAreas
        };
      });
      
      return {
        id: k.id?.toString() || Math.random().toString(),
        kode_kriteria: k.kode_kriteria,
        nama_kriteria: k.nama_kriteria,
        type: 'kriteria' as const,
        expanded: true,
        children: kodeAmis
      };
    });
    setTreeData(tree);
  };

  const toggleExpanded = (id: string, nodes: TreeNode[]): TreeNode[] => {
    return nodes.map(node => {
      if (node.id === id) {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children) {
        return { ...node, children: toggleExpanded(id, node.children) };
      }
      return node;
    });
  };

  const handleNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedUnsur(id);
    setFormData(prev => ({ ...prev, pemeriksaan_unsur_id: id }));
    resetForm();
  };

  const handleToggle = (id: string) => {
    setTreeData(toggleExpanded(id, treeData));
  };

  const resetForm = () => {
    setFormData({
      pemeriksaan_unsur_id: formData.pemeriksaan_unsur_id,
      judul_dokumen: '',
      ketersediaan_standar: 'tidak_ada',
      dokumen: 'tidak_ada',
      pencapaian_standar_spt_pt: false,
      pencapaian_standar_sn_dikti: false,
      daya_saing_lokal: false,
      daya_saing_nasional: false,
      daya_saing_internasional: false,
      bukti_link: '',
      tahun_pelaksanaan: '',
      capaian: '',
      keterangan: '',
      bukti_file: null,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, bukti_file: file }));
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!selectedUnsur) {
      setErrorMsg('Pilih unsur yang akan diisi');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const token = localStorage.getItem('ami_token');
      const user = JSON.parse(localStorage.getItem('ami_user') || '{}');
      const periode = await fetch('/api/periodes?is_active=true', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());

      if (!periode.data || periode.data.length === 0) {
        setErrorMsg('Tidak ada periode aktif');
        return;
      }

      const formDataObj = new FormData();
      formDataObj.append('pemeriksaan_unsur_id', formData.pemeriksaan_unsur_id);
      formDataObj.append('periode_id', periode.data[0].id.toString());
      formDataObj.append('judul_dokumen', formData.judul_dokumen);
      formDataObj.append('ketersediaan_standar', formData.ketersediaan_standar);
      formDataObj.append('dokumen', formData.dokumen);
      formDataObj.append('pencapaian_standar_spt_pt', formData.pencapaian_standar_spt_pt.toString());
      formDataObj.append('pencapaian_standar_sn_dikti', formData.pencapaian_standar_sn_dikti.toString());
      formDataObj.append('daya_saing_lokal', formData.daya_saing_lokal.toString());
      formDataObj.append('daya_saing_nasional', formData.daya_saing_nasional.toString());
      formDataObj.append('daya_saing_internasional', formData.daya_saing_internasional.toString());
      formDataObj.append('bukti_link', formData.bukti_link);
      formDataObj.append('tahun_pelaksanaan', formData.tahun_pelaksanaan);
      formDataObj.append('capaian', formData.capaian);
      formDataObj.append('keterangan', formData.keterangan);
      if (formData.bukti_file) {
        formDataObj.append('bukti_file', formData.bukti_file);
      }

      const res = await fetch('/api/isians', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataObj
      });

      const result = await res.json();
      if (res.ok) {
        setSuccessMsg(isDraft ? 'Draft tersimpan' : 'Isian berhasil disubmit');
        resetForm();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(result.message || 'Gagal menyimpan isian');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Terjadi kesalahan server');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTree = (nodes: TreeNode[], level: number = 0) => {
    return nodes.map(node => (
      <div key={node.id} style={{ marginLeft: `${level * 20}px` }} className="border-l border-slate-200">
        <div
          className={`flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-slate-100 rounded transition-colors ${
            selectedUnsur === node.id ? 'bg-indigo-100 border-l-2 border-indigo-600' : ''
          }`}
          onClick={(e) => {
            if (node.type === 'unsur') {
              handleNodeClick(e, node.id);
            } else {
              handleToggle(node.id);
            }
          }}
        >
          {node.children && node.children.length > 0 && (
            <ChevronDown 
              size={16} 
              className={`shrink-0 transition-transform ${node.expanded ? '' : '-rotate-90'}`}
            />
          )}
          {!node.children && <div className="w-4" />}
          
          <div className="text-sm flex-1">
            <div className="font-medium text-slate-700">
              {node.type === 'kriteria' && `[${node.kode_kriteria}] ${node.nama_kriteria}`}
              {node.type === 'ami' && `${node.kode_ami}`}
              {node.type === 'area' && `📋 ${node.deskripsi_area_audit}`}
              {node.type === 'unsur' && (
                <div className={`flex items-center gap-2 ${selectedUnsur === node.id ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}>
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  {node.isi_unsur}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {node.expanded && node.children && renderTree(node.children, level + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Isi AMI</h1>
        <p className="text-slate-500 text-sm mt-1">Lengkapi instrumen AMI dengan data dan bukti yang diperlukan</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar - Pilih Instrumen & Struktur */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sticky top-20">
            <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Instrumen</label>
            <select 
              value={selectedInstrumen}
              onChange={(e) => {
                setSelectedInstrumen(e.target.value);
                if (e.target.value) {
                  fetchInstrumenStructure(e.target.value);
                }
              }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
            >
              <option value="">- Pilih Instrumen -</option>
              {instrumens.map(i => (
                <option key={i.id} value={i.id}>{i.nama_instrumen}</option>
              ))}
            </select>

            {selectedInstrumen && (
              <div className="mt-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Struktur Instrumen</label>
                <div className="border border-slate-200 rounded-lg p-3 max-h-[500px] overflow-y-auto space-y-1 bg-slate-50">
                  {treeData.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">Memuat struktur...</p>
                  ) : (
                    renderTree(treeData)
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2">
          {selectedUnsur ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <CheckCircle size={18} className="text-indigo-600" />
                <span className="text-sm text-indigo-700 font-medium">Unsur terpilih</span>
              </div>

              <form className="space-y-5">
                {/* Row 1 */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Judul Dokumen <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      name="judul_dokumen"
                      value={formData.judul_dokumen}
                      onChange={handleInputChange}
                      placeholder="Nama dokumen atau bukti"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tahun Pelaksanaan
                    </label>
                    <input 
                      type="number"
                      name="tahun_pelaksanaan"
                      value={formData.tahun_pelaksanaan}
                      onChange={handleInputChange}
                      placeholder="2024"
                      min="1900"
                      max="2099"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Ketersediaan & Dokumen */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ketersediaan Standar
                    </label>
                    <select 
                      name="ketersediaan_standar"
                      value={formData.ketersediaan_standar}
                      onChange={handleInputChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="ada">Ada</option>
                      <option value="tidak_ada">Tidak Ada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Dokumen / Bukti Fisik
                    </label>
                    <select 
                      name="dokumen"
                      value={formData.dokumen}
                      onChange={handleInputChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="ada">Ada</option>
                      <option value="tidak_ada">Tidak Ada</option>
                    </select>
                  </div>
                </div>

                {/* Pencapaian Standar */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Pencapaian Standar</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        name="pencapaian_standar_spt_pt"
                        checked={formData.pencapaian_standar_spt_pt}
                        onChange={handleInputChange}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                      />
                      <span className="text-sm text-slate-700">Pencapaian Standar SPT PT</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        name="pencapaian_standar_sn_dikti"
                        checked={formData.pencapaian_standar_sn_dikti}
                        onChange={handleInputChange}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                      />
                      <span className="text-sm text-slate-700">Pencapaian Standar SN Dikti</span>
                    </label>
                  </div>
                </div>

                {/* Daya Saing */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Daya Saing</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        name="daya_saing_lokal"
                        checked={formData.daya_saing_lokal}
                        onChange={handleInputChange}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                      />
                      <span className="text-sm text-slate-700">Daya Saing Lokal</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        name="daya_saing_nasional"
                        checked={formData.daya_saing_nasional}
                        onChange={handleInputChange}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                      />
                      <span className="text-sm text-slate-700">Daya Saing Nasional</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        name="daya_saing_internasional"
                        checked={formData.daya_saing_internasional}
                        onChange={handleInputChange}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                      />
                      <span className="text-sm text-slate-700">Daya Saing Internasional</span>
                    </label>
                  </div>
                </div>

                {/* Bukti Link */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Link Bukti (URL)
                  </label>
                  <input 
                    type="url"
                    name="bukti_link"
                    value={formData.bukti_link}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload File Bukti
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer relative">
                    <input 
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <FileUp size={24} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Klik atau drag file di sini</p>
                        <p className="text-xs text-slate-500 mt-1">Format: PDF, JPG, PNG (Max 10MB)</p>
                      </div>
                    </div>
                    {formData.bukti_file && (
                      <p className="text-xs text-green-600 font-medium mt-2">✓ {formData.bukti_file.name}</p>
                    )}
                  </div>
                </div>

                {/* Capaian */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Capaian
                  </label>
                  <textarea 
                    name="capaian"
                    value={formData.capaian}
                    onChange={handleInputChange}
                    placeholder="Jelaskan capaian yang sudah dicapai..."
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Keterangan Tambahan
                  </label>
                  <textarea 
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleInputChange}
                    placeholder="Catatan atau penjelasan lainnya..."
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Messages */}
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-600 text-sm border border-rose-200">
                    <AlertCircle size={16} /> {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-600 text-sm border border-emerald-200">
                    <CheckCircle size={16} /> {successMsg}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button 
                    type="button"
                    onClick={() => handleSubmit(true)}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    <Save size={16} />
                    Simpan Draft
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    <Send size={16} />
                    Kirim untuk Review
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
              <FileText size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Pilih instrumen dan unsur di sebelah kiri untuk mulai mengisi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
