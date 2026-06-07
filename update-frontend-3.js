const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app/dosen/isi-ami/page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const sIndex = code.indexOf('{(() => {');
const endIndex = code.indexOf('          })()}', sIndex);

if (sIndex !== -1 && endIndex !== -1) {
  const jsxReplacement = `          <div className="space-y-8">
            {isianList.map((formData, index) => {
              const isUnsurValid = formData.status === 'valid';
              const inputClasses = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-800 disabled:border-transparent disabled:opacity-100 disabled:shadow-none";
              const selectClasses = "w-full appearance-none border border-slate-300 rounded-lg pl-3 pr-10 py-2.5 text-sm bg-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer hover:border-indigo-400 transition-colors disabled:bg-slate-50 disabled:text-slate-800 disabled:border-transparent disabled:opacity-100 disabled:cursor-default disabled:appearance-none disabled:shadow-none disabled:hover:border-transparent";

              return (
                <div key={index} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm space-y-5 relative">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                        {formData.urutan_isian}
                      </span>
                      Blok Isian {formData.urutan_isian}
                    </h3>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={formData.status} />
                      {!isUnsurValid && isianList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIsianBlock(index)}
                          className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors text-sm font-medium flex items-center gap-1 border border-transparent hover:border-rose-200"
                        >
                          <X size={16} /> Hapus Blok
                        </button>
                      )}
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Judul Dokumen</label>
                        <input
                          type="text"
                          name="judul_dokumen"
                          value={formData.judul_dokumen}
                          onChange={(e) => handleInputChange(index, e)}
                          placeholder="Nama dokumen atau bukti"
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Pelaksanaan</label>
                        <input
                          type="number"
                          name="tahun_pelaksanaan"
                          value={formData.tahun_pelaksanaan}
                          onChange={(e) => handleInputChange(index, e)}
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
                            onChange={(e) => handleInputChange(index, e)}
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
                            onChange={(e) => handleInputChange(index, e)}
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
                            onChange={(e) => handleInputChange(index, e)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span className="text-sm text-slate-700">Pencapaian Standar SPT PT</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="pencapaian_standar_sn_dikti"
                            checked={formData.pencapaian_standar_sn_dikti}
                            onChange={(e) => handleInputChange(index, e)}
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
                            onChange={(e) => handleInputChange(index, e)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span className="text-sm text-slate-700">Daya Saing Lokal</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="daya_saing_nasional"
                            checked={formData.daya_saing_nasional}
                            onChange={(e) => handleInputChange(index, e)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                          />
                          <span className="text-sm text-slate-700">Daya Saing Nasional</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="daya_saing_internasional"
                            checked={formData.daya_saing_internasional}
                            onChange={(e) => handleInputChange(index, e)}
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
                        onChange={(e) => handleInputChange(index, e)}
                        placeholder="https://..."
                        className={inputClasses}
                      />
                    </div>

                    {/* File Upload / Existing Files */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {isUnsurValid ? 'Dokumen Bukti' : 'Upload File Bukti'}
                      </label>

                      {isUnsurValid ? (
                        <div className="space-y-2">
                          {formData.existing_files && formData.existing_files.length > 0 ? (
                            formData.existing_files.map((file: any) => (
                              <a
                                key={file.id}
                                href={file.file_path}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all"
                              >
                                <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                  <FileText size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-slate-700 truncate">{file.original_name}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">Buka dokumen</div>
                                </div>
                              </a>
                            ))
                          ) : (
                            <div className="text-sm text-slate-500 italic p-3 rounded-lg bg-slate-50 border border-transparent">
                              Tidak ada dokumen yang diunggah.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formData.existing_files && formData.existing_files.length > 0 && (
                            <div className="mb-4 space-y-2">
                              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dokumen Tersimpan</div>
                              {formData.existing_files.map((file: any) => (
                                <a
                                  key={file.id}
                                  href={file.file_path}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:border-indigo-300 hover:shadow-sm transition-all"
                                >
                                  <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                    <FileText size={16} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-slate-700 truncate">{file.original_name}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Buka dokumen</div>
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}

                          <div className="space-y-3">
                            {formData.bukti_files.map((file, fileIndex) => (
                              <div key={fileIndex} className="flex items-center gap-3">
                                <div className="flex-1 border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors cursor-pointer relative bg-white">
                                  <input
                                    type="file"
                                    onChange={(e) => handleFileChange(index, fileIndex, e)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                  />
                                  <div className="flex flex-col items-center gap-1">
                                    <FileUp size={20} className="text-slate-400" />
                                    <div>
                                      <p className="text-sm font-medium text-slate-700">{file ? 'Ganti file' : 'Klik atau drag file'}</p>
                                      {!file && <p className="text-xs text-slate-500 mt-0.5">Format: PDF, JPG, PNG (Max 10MB)</p>}
                                    </div>
                                  </div>
                                  {file && <p className="text-xs text-emerald-600 font-medium mt-2">✓ {file.name}</p>}
                                </div>
                                {fileIndex > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => removeFileField(index, fileIndex)}
                                    className="p-3 text-rose-500 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                                    title="Hapus kolom ini"
                                  >
                                    <X size={20} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => addFileField(index)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors mt-2 border border-indigo-200 border-dashed hover:border-solid"
                          >
                            <Plus size={16} /> Tambah Dokumen
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Capaian */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Capaian</label>
                      <textarea
                        name="capaian"
                        value={formData.capaian}
                        onChange={(e) => handleInputChange(index, e)}
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
                        onChange={(e) => handleInputChange(index, e)}
                        placeholder="Catatan atau penjelasan lainnya..."
                        rows={3}
                        className={\`\${inputClasses} resize-none\`}
                      />
                    </div>
                  </fieldset>
                </div>
              );
            })}
            </div>

            {/* Tombol Tambah Blok Isian Baru */}
            <div className="flex justify-center border-t border-slate-200 pt-6 pb-2">
              <button
                type="button"
                onClick={addIsianBlock}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-indigo-200 text-indigo-600 font-semibold rounded-full hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm"
              >
                <Plus size={18} /> Tambah Blok Isian
              </button>
            </div>

            {/* Messages */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
                <CheckCircle size={16} /> {successMsg}
              </div>
            )}

            {/* Global Submit Buttons */}
            <div className="flex gap-3 pt-6 border-t border-slate-200 sticky bottom-0 bg-white/90 backdrop-blur pb-4 z-10">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm font-semibold shadow-sm"
              >
                <Save size={18} /> Simpan Draft Semua
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-semibold shadow-sm"
              >
                <Send size={18} /> Kirim untuk Review
              </button>
            `;
  code = code.substring(0, sIndex) + jsxReplacement + code.substring(endIndex + 14); // 14 is length of `          })()}`
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Update script 3 done properly');
} else {
  console.log('Indexes not found', sIndex, endIndex);
}
