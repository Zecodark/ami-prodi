const fs = require('fs');

const file = 'app/dosen/isi-ami/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace IsianForm interface
content = content.replace(
  /interface IsianForm \{[\s\S]*?\n\}/,
`interface FileEntry {
  file: File | null;
  judul_dokumen: string;
  keterangan_dokumen: string;
  tahun_dokumen: string;
}

interface IsianForm {
  id?: number;
  status: UnsurStatus;
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
  catatan_kaprodi?: string;
  bukti_files: FileEntry[];
  existing_files?: Array<{ id: string; file_name: string; original_name: string; file_path: string; judul_dokumen: string | null; keterangan_dokumen: string | null; tahun_dokumen: string | null }>;
}`
);

// 2. Change isianList state
content = content.replace(
  /const \[isianList, setIsianList\] = useState<IsianForm\[\]>\(\[\]\);/,
  `const [isianForm, setIsianForm] = useState<IsianForm | null>(null);`
);

// 3. handleNodeClick
content = content.replace(
  /const handleNodeClick = async \([\s\S]*?\} catch \{[\s\S]*?\}\s*\};\n/,
`const handleNodeClick = async (e: React.MouseEvent | any, id: string) => {
    if(e?.stopPropagation) e.stopPropagation();
    setSelectedUnsur(id);
    resetForm(id);

    try {
      const token = localStorage.getItem('ami_token');
      const res = await fetch(
        \`/api/isians?pemeriksaan_unsur_id=\${id}\`,
        { headers: { Authorization: \`Bearer \${token}\` } }
      );
      const json = await res.json();
      const items = json.data ?? [];
      
      if (items.length > 0) {
        const item = items[0]; // Hanya ambil isian pertama (1 unsur 1 isian)
        setIsianForm({
          id: item.id,
          status: item.status,
          pemeriksaan_unsur_id: id,
          judul_dokumen: item.judul_dokumen ?? '',
          ketersediaan_standar: item.ketersediaan_standar ?? 'tidak_ada',
          dokumen: item.dokumen ?? 'tidak_ada',
          pencapaian_standar_spt_pt: item.pencapaian_standar_spt_pt ?? false,
          pencapaian_standar_sn_dikti: item.pencapaian_standar_sn_dikti ?? false,
          daya_saing_lokal: item.daya_saing_lokal ?? false,
          daya_saing_nasional: item.daya_saing_nasional ?? false,
          daya_saing_internasional: item.daya_saing_internasional ?? false,
          bukti_link: item.bukti_link ?? '',
          tahun_pelaksanaan: item.tahun_pelaksanaan ?? '',
          capaian: item.capaian ?? '',
          keterangan: item.keterangan ?? '',
          catatan_kaprodi: item.catatan_kaprodi ?? '',
          bukti_files: [{ file: null, judul_dokumen: '', keterangan_dokumen: '', tahun_dokumen: '' }],
          existing_files: item.bukti_files ?? [],
        });
        setSuccessMsg('Memuat isian.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      // ignore
    }
  };`
);

// 4. resetForm
content = content.replace(
  /const resetForm = \([\s\S]*?\}\];\s*\};\n/,
`const resetForm = (newId?: string) => {
    setIsianForm({
      status: 'kosong',
      pemeriksaan_unsur_id: newId !== undefined ? newId : (selectedUnsur || ''),
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
      bukti_files: [{ file: null, judul_dokumen: '', keterangan_dokumen: '', tahun_dokumen: '' }],
      existing_files: [],
    });
  };`
);

// 5. handleInputChange
content = content.replace(
  /const handleInputChange = \([\s\S]*?return newList;\n\s*\}\);\n\s*\};\n/,
`const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setIsianForm((prev) => {
      if (!prev) return prev;
      if (type === 'checkbox') {
        return { ...prev, [name]: (e.target as HTMLInputElement).checked };
      }
      return { ...prev, [name]: value };
    });
  };`
);

// 6. handleFileChange and Repeater logic
content = content.replace(
  /const handleFileChange = \([\s\S]*?removeIsianBlock = \([\s\S]*?return newList;\n\s*\}\);\n\s*\};\n/,
`const handleFileMetaChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setIsianForm((prev) => {
      if (!prev) return prev;
      const newFiles = [...prev.bukti_files];
      newFiles[index] = { ...newFiles[index], [name]: value };
      return { ...prev, bukti_files: newFiles };
    });
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setIsianForm((prev) => {
      if (!prev) return prev;
      const newFiles = [...prev.bukti_files];
      newFiles[index] = { ...newFiles[index], file };
      return { ...prev, bukti_files: newFiles };
    });
  };

  const addFileField = () => {
    setIsianForm((prev) => {
      if (!prev) return prev;
      return { 
        ...prev, 
        bukti_files: [...prev.bukti_files, { file: null, judul_dokumen: '', keterangan_dokumen: '', tahun_dokumen: '' }] 
      };
    });
  };

  const removeFileField = (index: number) => {
    setIsianForm((prev) => {
      if (!prev) return prev;
      const newFiles = [...prev.bukti_files];
      newFiles.splice(index, 1);
      if (newFiles.length === 0) newFiles.push({ file: null, judul_dokumen: '', keterangan_dokumen: '', tahun_dokumen: '' });
      return { ...prev, bukti_files: newFiles };
    });
  };`
);

// 7. handleSubmit
content = content.replace(
  /const handleSubmit = async \([\s\S]*?setSubmitting\(false\);\n\s*\};\n/,
`const handleSubmit = async (isDraft: boolean = false) => {
    if (!selectedUnsur || !isianForm) {
      setErrorMsg('Pilih unsur yang akan diisi');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const token = localStorage.getItem('ami_token');
      const periode = await fetch('/api/periodes?is_active=true', {
        headers: { Authorization: \`Bearer \${token}\` },
      }).then((r) => r.json());

      if (!periode.data || periode.data.length === 0) {
        setErrorMsg('Tidak ada periode aktif');
        return;
      }

      if (isianForm.status === 'valid') {
        setErrorMsg('Isian yang valid tidak dapat diubah');
        return;
      }

      const formDataObj = new FormData();
      formDataObj.append('pemeriksaan_unsur_id', isianForm.pemeriksaan_unsur_id);
      formDataObj.append('periode_id', periode.data[0].id.toString());
      formDataObj.append('is_draft', isDraft.toString());
      formDataObj.append('judul_dokumen', isianForm.judul_dokumen);
      formDataObj.append('ketersediaan_standar', isianForm.ketersediaan_standar);
      formDataObj.append('dokumen', isianForm.dokumen);
      formDataObj.append('pencapaian_standar_spt_pt', isianForm.pencapaian_standar_spt_pt.toString());
      formDataObj.append('pencapaian_standar_sn_dikti', isianForm.pencapaian_standar_sn_dikti.toString());
      formDataObj.append('daya_saing_lokal', isianForm.daya_saing_lokal.toString());
      formDataObj.append('daya_saing_nasional', isianForm.daya_saing_nasional.toString());
      formDataObj.append('daya_saing_internasional', isianForm.daya_saing_internasional.toString());
      formDataObj.append('bukti_link', isianForm.bukti_link);
      formDataObj.append('tahun_pelaksanaan', isianForm.tahun_pelaksanaan);
      formDataObj.append('capaian', isianForm.capaian);
      formDataObj.append('keterangan', isianForm.keterangan);
      
      for (const f of isianForm.bukti_files) {
        if (f.file) {
          formDataObj.append('bukti_files[]', f.file);
          formDataObj.append('judul_dokumen_file[]', f.judul_dokumen);
          formDataObj.append('keterangan_dokumen_file[]', f.keterangan_dokumen);
          formDataObj.append('tahun_dokumen_file[]', f.tahun_dokumen);
        }
      }

      const res = await fetch('/api/isians', {
        method: 'POST',
        headers: { Authorization: \`Bearer \${token}\` },
        body: formDataObj,
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.message || 'Gagal menyimpan isian');
      }

      setSuccessMsg(isDraft ? 'Draft berhasil disimpan' : 'Isian berhasil dikirim untuk review');
      
      handleNodeClick({ stopPropagation: () => {} } as any, selectedUnsur);
      fetchStatusMap();

    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Terjadi kesalahan server saat menyimpan');
    } finally {
      setSubmitting(false);
    }
  };`
);

// 8. Render form
content = content.replace(
  /<div className="space-y-8">[\s\S]*?Tombol Tambah Blok Isian Baru \*\/\}\n\s*<div className="flex justify-center border-t border-slate-200 pt-6 pb-2">[\s\S]*?<\/div>/,
`<div className="space-y-8">
            {isianForm && (() => {
              const formData = isianForm;
              const isUnsurValid = formData.status === 'valid';
              const inputClasses = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-800 disabled:border-transparent disabled:opacity-100 disabled:shadow-none";
              const selectClasses = "w-full appearance-none border border-slate-300 rounded-lg pl-3 pr-10 py-2.5 text-sm bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer hover:border-indigo-400 transition-colors disabled:bg-slate-50 disabled:text-slate-800 disabled:border-transparent disabled:opacity-100 disabled:cursor-default disabled:appearance-none disabled:shadow-none disabled:hover:border-transparent";

              return (
                <div className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm space-y-5 relative">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                        1
                      </span>
                      Formulir Isian AMI
                    </h3>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={formData.status} />
                    </div>
                  </div>

                  {formData.catatan_kaprodi && (
                    <div className="bg-rose-50 text-rose-700 p-4 rounded-lg border border-rose-200 text-sm">
                      <strong className="font-semibold block mb-1">Catatan Revisi Kaprodi:</strong>
                      {formData.catatan_kaprodi}
                    </div>
                  )}

                  <fieldset disabled={isUnsurValid} className="space-y-5">
                    {/* Row 1 */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Judul Isian <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          name="judul_dokumen"
                          value={formData.judul_dokumen}
                          onChange={(e) => handleInputChange(e)}
                          placeholder="Judul pokok isian"
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Pelaksanaan</label>
                        <input
                          type="number"
                          name="tahun_pelaksanaan"
                          value={formData.tahun_pelaksanaan}
                          onChange={(e) => handleInputChange(e)}
                          placeholder="2024"
                          min="1900"
                          max="2099"
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    {/* Ketersediaan & Dokumen */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ketersediaan Standar</label>
                        <div className="relative">
                          <select
                            name="ketersediaan_standar"
                            value={formData.ketersediaan_standar}
                            onChange={(e) => handleInputChange(e)}
                            className={selectClasses}
                          >
                            <option value="ada">Ada</option>
                            <option value="tidak_ada">Tidak Ada</option>
                          </select>
                          {!isUnsurValid && (
                            <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dokumen / Bukti Fisik</label>
                        <div className="relative">
                          <select
                            name="dokumen"
                            value={formData.dokumen}
                            onChange={(e) => handleInputChange(e)}
                            className={selectClasses}
                          >
                            <option value="ada">Ada</option>
                            <option value="tidak_ada">Tidak Ada</option>
                          </select>
                          {!isUnsurValid && (
                            <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          )}
                        </div>
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
                            onChange={(e) => handleInputChange(e)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span className="text-sm text-slate-700">Pencapaian Standar SPT PT</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="pencapaian_standar_sn_dikti"
                            checked={formData.pencapaian_standar_sn_dikti}
                            onChange={(e) => handleInputChange(e)}
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
                            onChange={(e) => handleInputChange(e)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span className="text-sm text-slate-700">Daya Saing Lokal</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="daya_saing_nasional"
                            checked={formData.daya_saing_nasional}
                            onChange={(e) => handleInputChange(e)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span className="text-sm text-slate-700">Daya Saing Nasional</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="daya_saing_internasional"
                            checked={formData.daya_saing_internasional}
                            onChange={(e) => handleInputChange(e)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span className="text-sm text-slate-700">Daya Saing Internasional</span>
                        </label>
                      </div>
                    </div>

                    {/* Bukti Link */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Link Bukti (URL)</label>
                      <input
                        type="url"
                        name="bukti_link"
                        value={formData.bukti_link}
                        onChange={(e) => handleInputChange(e)}
                        placeholder="https://..."
                        className={inputClasses}
                      />
                    </div>

                    {/* File Upload / Existing Files */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">
                          {isUnsurValid ? 'Dokumen Bukti' : 'Upload Multi Dokumen Bukti'}
                        </label>
                        {!isUnsurValid && (
                          <button
                            type="button"
                            onClick={() => addFileField()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                          >
                            <Plus size={14} /> Tambah Dokumen Baru
                          </button>
                        )}
                      </div>

                      {isUnsurValid ? (
                        <div className="space-y-3">
                          {formData.existing_files && formData.existing_files.length > 0 ? (
                            formData.existing_files.map((file: any) => (
                              <div key={file.id} className="p-4 rounded-lg border border-slate-200 bg-white">
                                <a
                                  href={file.file_path}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-3 hover:text-indigo-600 mb-2"
                                >
                                  <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                    <FileText size={20} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold text-slate-800 truncate">{file.judul_dokumen || file.original_name}</div>
                                    {file.tahun_dokumen && <div className="text-xs text-slate-500 mt-0.5">Tahun: {file.tahun_dokumen}</div>}
                                  </div>
                                </a>
                                {file.keterangan_dokumen && (
                                  <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                    {file.keterangan_dokumen}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-slate-500 italic p-3 rounded-lg bg-slate-50 border border-transparent">
                              Tidak ada dokumen yang diunggah.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {formData.existing_files && formData.existing_files.length > 0 && (
                            <div className="mb-4 space-y-3">
                              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dokumen Tersimpan (Read Only)</div>
                              {formData.existing_files.map((file: any) => (
                                <div key={file.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                                  <a
                                    href={file.file_path}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 hover:text-indigo-600 mb-2"
                                  >
                                    <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                      <FileText size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-bold text-slate-800 truncate">{file.judul_dokumen || file.original_name}</div>
                                      {file.tahun_dokumen && <div className="text-xs text-slate-500 mt-0.5">Tahun: {file.tahun_dokumen}</div>}
                                    </div>
                                  </a>
                                  {file.keterangan_dokumen && (
                                    <div className="mt-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-200">
                                      {file.keterangan_dokumen}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-4 border-t border-slate-200 pt-4">
                            {formData.bukti_files.map((fileEntry, fileIndex) => (
                              <div key={fileIndex} className="p-4 border border-indigo-100 rounded-lg bg-indigo-50/30 relative space-y-4">
                                {fileIndex > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => removeFileField(fileIndex)}
                                    className="absolute top-3 right-3 p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                                    title="Hapus kolom ini"
                                  >
                                    <X size={18} />
                                  </button>
                                )}
                                
                                <div className="grid sm:grid-cols-2 gap-4 pr-8">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Judul File <span className="text-rose-500">*</span></label>
                                    <input
                                      type="text"
                                      name="judul_dokumen"
                                      value={fileEntry.judul_dokumen}
                                      onChange={(e) => handleFileMetaChange(fileIndex, e)}
                                      placeholder="Misal: Sertifikat A"
                                      className={inputClasses}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Tahun File</label>
                                    <input
                                      type="text"
                                      name="tahun_dokumen"
                                      value={fileEntry.tahun_dokumen}
                                      onChange={(e) => handleFileMetaChange(fileIndex, e)}
                                      placeholder="2024"
                                      className={inputClasses}
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Keterangan File</label>
                                  <textarea
                                    name="keterangan_dokumen"
                                    value={fileEntry.keterangan_dokumen}
                                    onChange={(e) => handleFileMetaChange(fileIndex, e)}
                                    placeholder="Penjelasan singkat tentang dokumen ini..."
                                    rows={2}
                                    className={inputClasses}
                                  />
                                </div>

                                <div className="mt-2">
                                  <label className="block text-xs font-medium text-slate-600 mb-1">Upload PDF/JPG/PNG <span className="text-rose-500">*</span></label>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 border border-dashed border-slate-300 rounded-lg p-3 text-center hover:border-indigo-400 transition-colors cursor-pointer relative bg-white">
                                      <input
                                        type="file"
                                        onChange={(e) => handleFileChange(fileIndex, e)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                      />
                                      <div className="flex flex-col items-center gap-1">
                                        <FileUp size={16} className="text-slate-400" />
                                        <div>
                                          <p className="text-xs font-medium text-slate-700">{fileEntry.file ? 'Ganti file' : 'Pilih file upload'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {fileEntry.file && <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1"><CheckCircle size={12}/> {fileEntry.file.name}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Capaian */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Capaian</label>
                      <textarea
                        name="capaian"
                        value={formData.capaian}
                        onChange={(e) => handleInputChange(e)}
                        placeholder="Jelaskan capaian yang sudah dicapai..."
                        rows={3}
                        className={\`\${inputClasses} resize-none\`}
                      />
                    </div>

                    {/* Keterangan */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Tambahan</label>
                      <textarea
                        name="keterangan"
                        value={formData.keterangan}
                        onChange={(e) => handleInputChange(e)}
                        placeholder="Catatan atau penjelasan lainnya..."
                        rows={3}
                        className={\`\${inputClasses} resize-none\`}
                      />
                    </div>
                  </fieldset>
                </div>
              );
            })()}
            </div>`
);


fs.writeFileSync(file, content, 'utf8');
console.log('Refactoring completed successfully.');
