const fs = require('fs');

const seedFile = 'prisma/seed.ts';
let lines = fs.readFileSync(seedFile, 'utf8').split('\n');

const startIdx = 832; // 0-indexed for line 833
const endIdx = 1142; // 0-indexed for line 1143 (which is actually where the last replacement ended)

// Let's find the current block by matching lines if startIdx/endIdx drifted
let currentStart = lines.findIndex(l => l.includes('// 6-8. Periode, Instrumen, Struktur & Isian'));
if (currentStart === -1) {
  currentStart = lines.findIndex(l => l.includes('// 6. Periode & Instrumen'));
}
let currentEnd = lines.findIndex(l => l.includes('console.log(`  ✅ Contoh isian AMI seeded untuk ${pData.tahun}`);'));
if (currentEnd === -1) {
  currentEnd = lines.findIndex(l => l.includes('console.log(\'✅ Contoh isian AMI seeded\');'));
}
if (currentStart !== -1 && currentEnd !== -1) {
  // Found the block to replace
  // expand currentEnd to include the closing brace of the loop if applicable
  while (currentEnd + 1 < lines.length && (lines[currentEnd + 1].trim() === '}' || lines[currentEnd + 1].trim() === '};' || lines[currentEnd + 1].trim() === '')) {
    currentEnd++;
  }
} else {
  console.log("Could not find block to replace.");
  process.exit(1);
}

const newCode = `  // =========================================================
  // 6-8. Periode, Instrumen, Struktur & Isian
  // =========================================================
  const instrumenItems2024 = [
    {
      no: 1, excelRow: 6, excelNo: "1", criterionNo: "1", s2: "1.1", str: "1.1", d3: "1.1",
      criterionName: "Standar 1: Visi, Misi, Tujuan dan Sasaran",
      kodeAmiLabel: "Standar 1.1",
      area: "Kejelasan dan kerealistisan Visi, Misi, Tujuan dan Sasaran Program Studi.",
      unsurList: [
        "Dokumen Rencana Strategis (Renstra) Tahun Sebelumnya",
        "Dokumen Rencana Operasional (Renop)"
      ]
    },
    {
      no: 2, excelRow: 7, excelNo: "2", criterionNo: "2", s2: "2.1", str: "2.1", d3: "2.1",
      criterionName: "Standar 2: Tata Pamong, Kepemimpinan, dan Sistem Pengelolaan",
      kodeAmiLabel: "Standar 2.1",
      area: "Sistem tata pamong berjalan secara efektif melalui mekanisme yang disepakati bersama.",
      unsurList: [
        "Dokumen SOP Tata Pamong Lama",
        "Dokumen SK Kepemimpinan"
      ]
    },
    {
      no: 3, excelRow: 8, excelNo: "3", criterionNo: "3", s2: "3.1", str: "3.1", d3: "3.1",
      criterionName: "Standar 3: Mahasiswa dan Lulusan",
      kodeAmiLabel: "Standar 3.1",
      area: "Sistem rekrutmen dan seleksi calon mahasiswa baru.",
      unsurList: [
        "Pedoman Penerimaan Mahasiswa Baru 2024",
        "Laporan Kinerja Lulusan"
      ]
    }
  ];

  const periodesToSeed = [
    {
      tahun: '2024/2025',
      isActive: false,
      mulai: '2024-09-01',
      selesai: '2025-06-30',
      namaInstrumen: 'Instrumen AMI Program Studi 2024/2025',
      items: instrumenItems2024
    },
    {
      tahun: '2025/2026',
      isActive: true,
      mulai: '2025-09-01',
      selesai: '2026-06-30',
      namaInstrumen: 'Instrumen AMI Program Studi 2025/2026',
      items: instrumenItems
    }
  ];

  const dosens = [
    { d: dosen1, p: prodiD3TI, k: kaprodiUser },
    { d: dosen2, p: prodiD3TI, k: kaprodiUser },
    { d: dosen3, p: prodiD3TI, k: kaprodiUser },
    { d: dosen4, p: prodiD4TRK, k: kaprodiUser2 },
  ];

  for (const pData of periodesToSeed) {
    console.log(\`\\nSedang memproses Periode \${pData.tahun}...\`);
    const periode = await prisma.periode.create({
      data: {
        tahun: pData.tahun,
        is_active: pData.isActive,
        tanggal_mulai: new Date(pData.mulai),
        tanggal_selesai: new Date(pData.selesai),
      },
    });

    const instrumen = await prisma.instrumen.create({
      data: {
        periode_id: periode.id,
        nama_instrumen: pData.namaInstrumen,
        deskripsi: 'Area / Lingkup Audit: Pendidikan untuk Program Magister / Sarjana Terapan / Diploma 3',
        is_active: pData.isActive,
        created_by: adminUser.id,
      },
    });

    const kriteriaMap = new Map();
    const kodeAmiMap = new Map();
    const kodeAmiCounters = new Map();
    const unsurByKey = new Map();

    const currentItems = pData.items;

    for (const item of currentItems) {
      const cleanCriterionNo = item.criterionNo.replace(/\\D/g, '') || String(item.no);
      const kriteriaKey = \`K\${cleanCriterionNo}\`;

      let kriteria = kriteriaMap.get(kriteriaKey);
      if (!kriteria) {
        kriteria = await prisma.kriteriaStandar.create({
          data: {
            instrumen_id: instrumen.id,
            kode_kriteria: kriteriaKey,
            nama_kriteria: item.criterionName ?? \`Kriteria \${cleanCriterionNo}\`,
            deskripsi: item.criterionName ?? null,
            urutan: Number(cleanCriterionNo) || item.no,
          },
        });
        kriteriaMap.set(kriteriaKey, kriteria);
      }

      let subNo = kodeAmiCounters.get(kriteriaKey) || 1;
      kodeAmiCounters.set(kriteriaKey, subNo + 1);

      const kodeLabel = normalizeText(item.kodeAmiLabel) ?? \`AMI \${cleanCriterionNo}.\${subNo}\`;
      const kodeAmiValue = \`\${cleanCriterionNo}.\${subNo} - \${kodeLabel}\`;
      const kodeAmiKey = \`\${kriteria.id}::\${kodeAmiValue}\`;

      let kodeAmi = kodeAmiMap.get(kodeAmiKey);
      if (!kodeAmi) {
        kodeAmi = await prisma.kodeAmi.create({
          data: {
            kriteria_id: kriteria.id,
            kode_ami: kodeAmiValue,
            urutan: subNo,
          },
        });
        kodeAmiMap.set(kodeAmiKey, kodeAmi);

        const butirData = [];

        if (item.s2) {
          butirData.push({ kode_ami_id: kodeAmi.id, jenjang_id: jenjangByCode.S2_MGTR.id, no_butir: item.s2 });
        }

        if (item.str) {
          butirData.push({ kode_ami_id: kodeAmi.id, jenjang_id: jenjangByCode.STR.id, no_butir: item.str });
        }

        if (item.d3) {
          butirData.push({ kode_ami_id: kodeAmi.id, jenjang_id: jenjangByCode.D3.id, no_butir: item.d3 });
        }

        if (butirData.length > 0) {
          await prisma.kodeAmiButirStandar.createMany({ data: butirData });
        }
      }

      const deskripsiArea = await prisma.deskripsiArea.create({
        data: {
          kode_ami_id: kodeAmi.id,
          deskripsi_area_audit: item.area,
          target_standar: null,
          urutan: item.no,
        },
      });

      for (const [index, isiUnsur] of item.unsurList.entries()) {
        const pemeriksaanUnsur = await prisma.pemeriksaanUnsur.create({
          data: {
            deskripsi_area_id: deskripsiArea.id,
            isi_unsur: isiUnsur,
            urutan: index + 1,
          },
        });

        const key = \`\${item.no}.\${index + 1}\`;
        unsurByKey.set(key, pemeriksaanUnsur);
      }
    }

    const totalUnsur = currentItems.reduce((total, item) => total + item.unsurList.length, 0);
    console.log(\`  ✅ Struktur instrumen seeded: \${totalUnsur} unsur\`);

    const sampleIsian = [];
    let validCount = 0;

    for (const item of currentItems) {
      if (item.no === 2) continue;

      if (item.no === 1) {
        for (let i = 0; i < item.unsurList.length; i++) {
          const d = dosens[i % dosens.length];
          sampleIsian.push({
            key: \`\${item.no}.\${i + 1}\`,
            dosen: d.d,
            prodi: d.p,
            kaprodi: d.k,
            judul: \`Bukti Full Valid \${item.no}.\${i + 1}\`,
            status: 'valid',
            ada: true, spt: true, sn: true, lokal: true, nasional: true, internasional: false,
            catatan: 'Sudah sangat baik'
          });
          validCount++;
        }
        continue;
      }

      if (item.no === 3) {
        for (let i = 0; i < item.unsurList.length; i++) {
          const d = dosens[i % dosens.length];
          if (i === 0) {
            sampleIsian.push({
              key: \`\${item.no}.\${i + 1}\`, dosen: d.d, prodi: d.p, kaprodi: d.k,
              judul: \`Bukti Sebagian Valid \${item.no}.\${i + 1}\`, status: 'valid',
              ada: true, spt: true, sn: true, lokal: true, nasional: true, internasional: false,
              catatan: 'Sesuai standar'
            });
            validCount++;
          } else if (i === 1) {
            sampleIsian.push({
              key: \`\${item.no}.\${i + 1}\`, dosen: d.d, prodi: d.p, kaprodi: d.k,
              judul: \`Bukti Sebagian Proses \${item.no}.\${i + 1}\`, status: 'proses',
              ada: true, spt: true, sn: true, lokal: true, nasional: false, internasional: false,
              catatan: null
            });
          }
        }
        continue;
      }

      if (item.no === 4) {
        for (let i = 0; i < item.unsurList.length; i++) {
          const d1 = dosens[0];
          const d2 = dosens[3];
          sampleIsian.push({
            key: \`\${item.no}.\${i + 1}\`, dosen: d1.d, prodi: d1.p, kaprodi: d1.k,
            judul: \`Bukti Nabrak Dosen 1 - Unsur \${i + 1}\`, status: 'valid',
            ada: true, spt: true, sn: true, lokal: true, nasional: true, internasional: false,
            catatan: 'Ok'
          });
          validCount++;
          sampleIsian.push({
            key: \`\${item.no}.\${i + 1}\`, dosen: d2.d, prodi: d2.p, kaprodi: d2.k,
            judul: \`Bukti Nabrak Dosen 2 - Unsur \${i + 1}\`, status: 'revisi',
            ada: true, spt: false, sn: true, lokal: true, nasional: false, internasional: false,
            catatan: 'Mohon perbaiki'
          });
        }
        continue;
      }

      for (let i = 0; i < item.unsurList.length; i++) {
        const rand = Math.random();
        const d = dosens[(item.no + i) % dosens.length];

        if (rand < 0.3 && validCount < 32) {
          sampleIsian.push({
            key: \`\${item.no}.\${i + 1}\`, dosen: d.d, prodi: d.p, kaprodi: d.k,
            judul: \`Bukti Dokumen \${item.no}.\${i + 1}\`, status: 'valid',
            ada: true, spt: true, sn: true, lokal: true, nasional: true, internasional: false,
            catatan: 'Validasi otomatis'
          });
          validCount++;
        } else if (rand > 0.3 && rand < 0.5) {
          sampleIsian.push({
            key: \`\${item.no}.\${i + 1}\`, dosen: d.d, prodi: d.p, kaprodi: d.k,
            judul: \`Draft Laporan \${item.no}.\${i + 1}\`, status: 'proses',
            ada: true, spt: true, sn: false, lokal: true, nasional: false, internasional: false,
            catatan: null
          });
        } else if (rand >= 0.5 && rand < 0.6) {
          sampleIsian.push({
            key: \`\${item.no}.\${i + 1}\`, dosen: d.d, prodi: d.p, kaprodi: d.k,
            judul: \`Laporan Revisi \${item.no}.\${i + 1}\`, status: 'revisi',
            ada: true, spt: true, sn: true, lokal: false, nasional: false, internasional: false,
            catatan: 'Perlu tanda tangan'
          });
        }
      }
    }

    for (const [index, item] of sampleIsian.entries()) {
      const pemeriksaanUnsur = unsurByKey.get(item.key);
      if (!pemeriksaanUnsur) continue;

      const isian = await prisma.isianAmi.create({
        data: {
          pemeriksaan_unsur_id: pemeriksaanUnsur.id,
          periode_id: periode.id,
          dosen_id: item.dosen.id,
          prodi_id: item.prodi.id,
          judul_dokumen: item.judul,
          ketersediaan_standar: item.ada ? 'ada' : 'tidak_ada',
          dokumen: item.ada ? 'ada' : 'tidak_ada',
          pencapaian_standar_spt_pt: item.spt,
          pencapaian_standar_sn_dikti: item.sn,
          daya_saing_lokal: item.lokal,
          daya_saing_nasional: item.nasional,
          daya_saing_internasional: item.internasional,
          bukti_link: \`https://drive.google.com/file/dummy-ami-\${item.key.replace('.', '-')}\`,
          tahun_pelaksanaan: pData.tahun.split('/')[0],
          capaian: \`Contoh capaian untuk pemeriksaan unsur individual \${item.key}.\`,
          keterangan: item.catatan ?? 'Contoh data isian AMI.',
          status: item.status,
          catatan_kaprodi: item.status === 'revisi' || item.status === 'valid' ? item.catatan : null,
          reviewed_by: item.status === 'revisi' || item.status === 'valid' ? item.kaprodi.id : null,
          reviewed_at: item.status === 'revisi' || item.status === 'valid' ? new Date() : null,
          attempt: 1,
          submitted_at: new Date(),
        },
      });

      await prisma.isianBuktiFile.create({
        data: {
          isian_id: isian.id,
          original_name: \`\${item.judul}.pdf\`,
          file_name: \`bukti-ami-\${item.key.replace('.', '-')}.pdf\`,
          file_path: \`/uploads/ami/bukti-ami-\${item.key.replace('.', '-')}.pdf\`,
          mime_type: 'application/pdf',
          file_size: 1024 * (index + 1),
          judul_dokumen: item.judul,
          keterangan_dokumen: item.catatan ?? 'Dokumen pelengkap isian AMI.',
          tahun_dokumen: pData.tahun.split('/')[0],
          uploaded_by: item.dosen.user_id,
        },
      });

      if (item.status === 'valid' || item.status === 'revisi') {
        await prisma.isianReviewLog.create({
          data: {
            isian_id: isian.id,
            reviewer_id: item.kaprodi.id,
            status_sebelum: 'proses',
            status_sesudah: item.status,
            catatan: item.catatan ?? 'Review selesai.',
          },
        });
      }
    }

    console.log(\`  ✅ Contoh isian AMI seeded untuk \${pData.tahun}\`);
  }`;

lines.splice(currentStart, currentEnd - currentStart + 1, newCode);
fs.writeFileSync(seedFile, lines.join('\n'));
console.log('Done replacement');
