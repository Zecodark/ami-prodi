const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app/dosen/isi-ami/page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const sIndex = code.indexOf('  const handleNodeClick = async');
const eIndex = code.indexOf('  // Tree renderer dengan indikator status');
// Find the exact line before Tree renderer
const beforeTreeIndex = code.lastIndexOf('// ===================================================================', eIndex);

if (sIndex !== -1 && beforeTreeIndex !== -1) {
  const handlerReplacement = `
  const handleNodeClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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
        const loadedList = items.map((item: any) => ({
          id: item.id,
          urutan_isian: item.urutan_isian ?? 1,
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
          bukti_files: [null],
          existing_files: item.bukti_files ?? [],
        }));
        loadedList.sort((a: any, b: any) => a.urutan_isian - b.urutan_isian);
        setIsianList(loadedList);
        setSuccessMsg(\`Memuat \${loadedList.length} isian.\`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      // ignore
    }
  };

  const resetForm = (newId?: string) => {
    setIsianList([{
      urutan_isian: 1,
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
      bukti_files: [null],
      existing_files: [],
    }]);
  };

  const handleInputChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setIsianList((prev) => {
      const newList = [...prev];
      if (type === 'checkbox') {
        newList[index] = { ...newList[index], [name]: (e.target as HTMLInputElement).checked };
      } else {
        newList[index] = { ...newList[index], [name]: value };
      }
      return newList;
    });
  };

  const handleFileChange = (isianIndex: number, fileIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setIsianList((prev) => {
      const newList = [...prev];
      const newFiles = [...newList[isianIndex].bukti_files];
      newFiles[fileIndex] = file;
      newList[isianIndex] = { ...newList[isianIndex], bukti_files: newFiles };
      return newList;
    });
  };

  const addFileField = (isianIndex: number) => {
    setIsianList((prev) => {
      const newList = [...prev];
      newList[isianIndex] = { 
        ...newList[isianIndex], 
        bukti_files: [...newList[isianIndex].bukti_files, null] 
      };
      return newList;
    });
  };

  const removeFileField = (isianIndex: number, fileIndex: number) => {
    setIsianList((prev) => {
      const newList = [...prev];
      const newFiles = [...newList[isianIndex].bukti_files];
      newFiles.splice(fileIndex, 1);
      if (newFiles.length === 0) newFiles.push(null);
      newList[isianIndex] = { ...newList[isianIndex], bukti_files: newFiles };
      return newList;
    });
  };

  const addIsianBlock = () => {
    setIsianList((prev) => {
      const maxUrutan = prev.length > 0 ? Math.max(...prev.map(i => i.urutan_isian)) : 0;
      return [
        ...prev,
        {
          urutan_isian: maxUrutan + 1,
          status: 'kosong',
          pemeriksaan_unsur_id: selectedUnsur || '',
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
          bukti_files: [null],
          existing_files: [],
        }
      ];
    });
  };

  const removeIsianBlock = (index: number) => {
    setIsianList((prev) => {
      const newList = [...prev];
      newList.splice(index, 1);
      return newList;
    });
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
      const periode = await fetch('/api/periodes?is_active=true', {
        headers: { Authorization: \`Bearer \${token}\` },
      }).then((r) => r.json());

      if (!periode.data || periode.data.length === 0) {
        setErrorMsg('Tidak ada periode aktif');
        return;
      }

      // Loop over isianList and post one by one
      for (const form of isianList) {
        if (form.status === 'valid') continue;

        const formDataObj = new FormData();
        formDataObj.append('pemeriksaan_unsur_id', form.pemeriksaan_unsur_id);
        formDataObj.append('periode_id', periode.data[0].id.toString());
        formDataObj.append('is_draft', isDraft.toString());
        formDataObj.append('urutan_isian', form.urutan_isian.toString());
        formDataObj.append('judul_dokumen', form.judul_dokumen);
        formDataObj.append('ketersediaan_standar', form.ketersediaan_standar);
        formDataObj.append('dokumen', form.dokumen);
        formDataObj.append('pencapaian_standar_spt_pt', form.pencapaian_standar_spt_pt.toString());
        formDataObj.append('pencapaian_standar_sn_dikti', form.pencapaian_standar_sn_dikti.toString());
        formDataObj.append('daya_saing_lokal', form.daya_saing_lokal.toString());
        formDataObj.append('daya_saing_nasional', form.daya_saing_nasional.toString());
        formDataObj.append('daya_saing_internasional', form.daya_saing_internasional.toString());
        formDataObj.append('bukti_link', form.bukti_link);
        formDataObj.append('tahun_pelaksanaan', form.tahun_pelaksanaan);
        formDataObj.append('capaian', form.capaian);
        formDataObj.append('keterangan', form.keterangan);
        for (const file of form.bukti_files) {
          if (file) {
            formDataObj.append('bukti_files', file);
          }
        }

        const res = await fetch('/api/isians', {
          method: 'POST',
          headers: { Authorization: \`Bearer \${token}\` },
          body: formDataObj,
        });

        if (!res.ok) {
          const resData = await res.json();
          throw new Error(resData.message || 'Gagal menyimpan isian ke-' + form.urutan_isian);
        }
      }

      setSuccessMsg(isDraft ? 'Semua isian berhasil disimpan sebagai draft' : 'Semua isian berhasil dikirim untuk review');
      
      // Reload isians
      handleNodeClick({ stopPropagation: () => {} } as any, selectedUnsur);
      fetchStatusMap();

    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Terjadi kesalahan server saat menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  `;
  code = code.substring(0, sIndex) + handlerReplacement + code.substring(beforeTreeIndex);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Update script 2 done properly');
} else {
  console.log('Indexes not found', sIndex, beforeTreeIndex);
}
