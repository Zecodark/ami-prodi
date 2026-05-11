import { prisma } from '../app/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting seed...');

  // =========================================================
  // 0. Bersihkan semua data (urutan terbalik dari FK)
  // =========================================================
  await prisma.isianReviewLog.deleteMany();
  await prisma.isianBuktiFile.deleteMany();
  await prisma.isianAmi.deleteMany();
  await prisma.pemeriksaanUnsur.deleteMany();
  await prisma.deskripsiArea.deleteMany();
  await prisma.kodeAmiButirStandar.deleteMany();
  await prisma.kodeAmi.deleteMany();
  await prisma.kriteriaStandar.deleteMany();
  await prisma.instrumen.deleteMany();
  await prisma.periode.deleteMany();
  await prisma.dosen.deleteMany();
  await prisma.user.deleteMany();
  await prisma.prodi.deleteMany();
  await prisma.jurusan.deleteMany();
  await prisma.role.deleteMany();
  await prisma.jenjangStandar.deleteMany();

  console.log('✅ Data lama dihapus');

  // =========================================================
  // 1. Roles
  // =========================================================
  const roleAdmin = await prisma.role.create({
    data: { nama_role: 'Admin', deskripsi: 'Administrator sistem AMI' },
  });
  const roleKaprodi = await prisma.role.create({
    data: { nama_role: 'Kaprodi', deskripsi: 'Ketua Program Studi' },
  });
  const roleDosen = await prisma.role.create({
    data: { nama_role: 'Dosen', deskripsi: 'Dosen pengajar' },
  });

  console.log('✅ Roles seeded');

  // =========================================================
  // 2. Jurusan & Prodi
  // =========================================================
  const jurusanTI = await prisma.jurusan.create({
    data: { nama_jurusan: 'Teknik Informatika' },
  });
  const jurusanTE = await prisma.jurusan.create({
    data: { nama_jurusan: 'Teknik Elektro' },
  });

  const prodiD3TI = await prisma.prodi.create({
    data: {
      jurusan_id: jurusanTI.id,
      nama_prodi: 'Teknik Informatika',
      jenjang: 'D3',
    },
  });
  const prodiD4TRPL = await prisma.prodi.create({
    data: {
      jurusan_id: jurusanTI.id,
      nama_prodi: 'Teknologi Rekayasa Perangkat Lunak',
      jenjang: 'D4',
    },
  });
  const prodiD3TE = await prisma.prodi.create({
    data: {
      jurusan_id: jurusanTE.id,
      nama_prodi: 'Teknik Elektronika',
      jenjang: 'D3',
    },
  });

  console.log('✅ Jurusan & Prodi seeded');

  // =========================================================
  // 3. Users
  // =========================================================
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@polines.ac.id',
      password: hashedPassword,
      role_id: roleAdmin.id,
      is_active: true,
    },
  });

  const kaprodiUser = await prisma.user.create({
    data: {
      email: 'kaprodi.trpl@polines.ac.id',
      password: hashedPassword,
      role_id: roleKaprodi.id,
      is_active: true,
    },
  });

  const dosenUser1 = await prisma.user.create({
    data: {
      email: 'budi.santoso@polines.ac.id',
      password: hashedPassword,
      role_id: roleDosen.id,
      is_active: true,
    },
  });

  const dosenUser2 = await prisma.user.create({
    data: {
      email: 'siti.aminah@polines.ac.id',
      password: hashedPassword,
      role_id: roleDosen.id,
      is_active: true,
    },
  });

  const dosenUser3 = await prisma.user.create({
    data: {
      email: 'ahmad.rizky@polines.ac.id',
      password: hashedPassword,
      role_id: roleDosen.id,
      is_active: true,
    },
  });

  console.log('✅ Users seeded');

  // =========================================================
  // 4. Dosen Profiles
  // =========================================================
  const dosen1 = await prisma.dosen.create({
    data: {
      user_id: dosenUser1.id,
      prodi_id: prodiD4TRPL.id,
      nip: '198001012005011001',
      nama_lengkap: 'Budi Santoso, M.Kom.',
      status_kepegawaian: 'PNS',
      no_hp: '081234567890',
      alamat: 'Jl. Majapahit No. 74, Semarang',
      is_active: true,
    },
  });

  const dosen2 = await prisma.dosen.create({
    data: {
      user_id: dosenUser2.id,
      prodi_id: prodiD3TI.id,
      nip: '198502022010122002',
      nama_lengkap: 'Siti Aminah, M.T.',
      status_kepegawaian: 'PNS',
      no_hp: '081298765432',
      alamat: 'Jl. Prof. Sudarto No. 13, Semarang',
      is_active: true,
    },
  });

  const dosen3 = await prisma.dosen.create({
    data: {
      user_id: dosenUser3.id,
      prodi_id: prodiD4TRPL.id,
      nip: '199001032015041003',
      nama_lengkap: 'Ahmad Rizky, S.Kom., M.Cs.',
      status_kepegawaian: 'Kontrak',
      no_hp: '082312345678',
      alamat: 'Jl. Pandanaran No. 5, Semarang',
      is_active: true,
    },
  });

  // Kaprodi sebagai dosen juga
  await prisma.dosen.create({
    data: {
      user_id: kaprodiUser.id,
      prodi_id: prodiD4TRPL.id,
      nip: '197805142003121004',
      nama_lengkap: 'Dr. Hendra Wijaya, M.Kom.',
      status_kepegawaian: 'PNS',
      no_hp: '081312345678',
      alamat: 'Jl. Siliwangi No. 8, Semarang',
      is_active: true,
    },
  });

  console.log('✅ Dosen seeded');

  // =========================================================
  // 5. Jenjang Standar
  // =========================================================
  const jenjangS2 = await prisma.jenjangStandar.create({
    data: { kode_jenjang: 'S2_MGTR', nama_jenjang: 'S2 / Magister Terapan', urutan: 1 },
  });
  const jenjangSTr = await prisma.jenjangStandar.create({
    data: { kode_jenjang: 'STR', nama_jenjang: 'Sarjana Terapan (D4)', urutan: 2 },
  });
  const jenjangD3 = await prisma.jenjangStandar.create({
    data: { kode_jenjang: 'D3', nama_jenjang: 'Diploma Tiga', urutan: 3 },
  });

  console.log('✅ Jenjang Standar seeded');

  // =========================================================
  // 6. Periode
  // =========================================================
  const periode = await prisma.periode.create({
    data: {
      tahun: '2025/2026',
      is_active: true,
      tanggal_mulai: new Date('2025-09-01'),
      tanggal_selesai: new Date('2026-06-30'),
    },
  });

  console.log('✅ Periode seeded');

  // =========================================================
  // 7. Instrumen AMI
  // =========================================================
  const instrumen = await prisma.instrumen.create({
    data: {
      periode_id: periode.id,
      nama_instrumen: 'Instrumen AMI Prodi 2025/2026',
      deskripsi: 'Instrumen Audit Mutu Internal Program Studi Tahun Akademik 2025/2026 sesuai SNPT dan SPT PT.',
      is_active: true,
      created_by: adminUser.id,
    },
  });

  console.log('✅ Instrumen seeded');

  // =========================================================
  // 8. Kriteria Standar, Kode AMI, Butir, Deskripsi Area, Pemeriksaan Unsur
  // =========================================================

  // --- KRITERIA 1: Visi, Misi, Tujuan dan Strategi ---
  const kriteria1 = await prisma.kriteriaStandar.create({
    data: {
      instrumen_id: instrumen.id,
      kode_kriteria: 'K1',
      nama_kriteria: 'Visi, Misi, Tujuan dan Strategi',
      deskripsi: 'Standar mengenai kejelasan dan keterkaitan visi, misi, tujuan, dan strategi program studi.',
      urutan: 1,
    },
  });

  const kodeAmi1_1 = await prisma.kodeAmi.create({
    data: { kriteria_id: kriteria1.id, kode_ami: 'A.1.1', urutan: 1 },
  });

  // Butir standar per jenjang untuk kode AMI 1.1
  await prisma.kodeAmiButirStandar.createMany({
    data: [
      { kode_ami_id: kodeAmi1_1.id, jenjang_id: jenjangS2.id, no_butir: '1.1' },
      { kode_ami_id: kodeAmi1_1.id, jenjang_id: jenjangSTr.id, no_butir: '1.1' },
      { kode_ami_id: kodeAmi1_1.id, jenjang_id: jenjangD3.id, no_butir: '1.1' },
    ],
  });

  const deskripsi1_1 = await prisma.deskripsiArea.create({
    data: {
      kode_ami_id: kodeAmi1_1.id,
      deskripsi_area_audit: 'Kejelasan dan kerealistisan visi, misi, tujuan, dan strategi program studi',
      target_standar: 'Visi, misi, tujuan, dan strategi program studi dinyatakan secara jelas, realistis, dan sesuai dengan visi institusi.',
      urutan: 1,
    },
  });

  const unsur1_1_1 = await prisma.pemeriksaanUnsur.create({
    data: {
      deskripsi_area_id: deskripsi1_1.id,
      isi_unsur: 'Dokumen visi, misi, tujuan, dan strategi program studi (VMTS) tersedia dan up-to-date.',
      urutan: 1,
    },
  });

  const unsur1_1_2 = await prisma.pemeriksaanUnsur.create({
    data: {
      deskripsi_area_id: deskripsi1_1.id,
      isi_unsur: 'VMTS dirumuskan secara partisipatif dengan melibatkan stakeholder (dosen, mahasiswa, alumni, pengguna lulusan).',
      urutan: 2,
    },
  });

  const unsur1_1_3 = await prisma.pemeriksaanUnsur.create({
    data: {
      deskripsi_area_id: deskripsi1_1.id,
      isi_unsur: 'VMTS dipahami dan diimplementasikan oleh seluruh civitas akademika program studi.',
      urutan: 3,
    },
  });

  // --- KRITERIA 2: Tata Kelola, Tata Pamong, dan Kerjasama ---
  const kriteria2 = await prisma.kriteriaStandar.create({
    data: {
      instrumen_id: instrumen.id,
      kode_kriteria: 'K2',
      nama_kriteria: 'Tata Kelola, Tata Pamong, dan Kerjasama',
      deskripsi: 'Standar mengenai sistem tata kelola, tata pamong, dan kerjasama program studi.',
      urutan: 2,
    },
  });

  const kodeAmi2_1 = await prisma.kodeAmi.create({
    data: { kriteria_id: kriteria2.id, kode_ami: 'B.2.1', urutan: 1 },
  });

  await prisma.kodeAmiButirStandar.createMany({
    data: [
      { kode_ami_id: kodeAmi2_1.id, jenjang_id: jenjangS2.id, no_butir: '2.1' },
      { kode_ami_id: kodeAmi2_1.id, jenjang_id: jenjangSTr.id, no_butir: '2.1' },
      { kode_ami_id: kodeAmi2_1.id, jenjang_id: jenjangD3.id, no_butir: '2.1' },
    ],
  });

  const deskripsi2_1 = await prisma.deskripsiArea.create({
    data: {
      kode_ami_id: kodeAmi2_1.id,
      deskripsi_area_audit: 'Sistem tata kelola program studi yang kredibel, transparan, akuntabel, bertanggung jawab, dan adil',
      target_standar: 'Prodi memiliki dokumen tata kelola yang jelas dan diimplementasikan secara konsisten.',
      urutan: 1,
    },
  });

  const unsur2_1_1 = await prisma.pemeriksaanUnsur.create({
    data: {
      deskripsi_area_id: deskripsi2_1.id,
      isi_unsur: 'Tersedia dokumen SOP pengelolaan program studi yang mencakup aspek akademik dan non-akademik.',
      urutan: 1,
    },
  });

  const unsur2_1_2 = await prisma.pemeriksaanUnsur.create({
    data: {
      deskripsi_area_id: deskripsi2_1.id,
      isi_unsur: 'Prodi memiliki kerjasama aktif dengan institusi dalam dan luar negeri yang relevan dengan bidang keilmuan.',
      urutan: 2,
    },
  });

  // --- KRITERIA 3: Mahasiswa ---
  const kriteria3 = await prisma.kriteriaStandar.create({
    data: {
      instrumen_id: instrumen.id,
      kode_kriteria: 'K3',
      nama_kriteria: 'Mahasiswa',
      deskripsi: 'Standar mengenai kualitas input mahasiswa dan layanan kemahasiswaan.',
      urutan: 3,
    },
  });

  const kodeAmi3_1 = await prisma.kodeAmi.create({
    data: { kriteria_id: kriteria3.id, kode_ami: 'C.3.1', urutan: 1 },
  });

  await prisma.kodeAmiButirStandar.createMany({
    data: [
      { kode_ami_id: kodeAmi3_1.id, jenjang_id: jenjangSTr.id, no_butir: '3.1' },
      { kode_ami_id: kodeAmi3_1.id, jenjang_id: jenjangD3.id, no_butir: '3.1' },
    ],
  });

  const deskripsi3_1 = await prisma.deskripsiArea.create({
    data: {
      kode_ami_id: kodeAmi3_1.id,
      deskripsi_area_audit: 'Sistem seleksi, penerimaan, dan orientasi mahasiswa baru',
      target_standar: 'Rasio keketatan seleksi mahasiswa baru minimal 1:3 dan memiliki sistem orientasi yang terstruktur.',
      urutan: 1,
    },
  });

  const unsur3_1_1 = await prisma.pemeriksaanUnsur.create({
    data: {
      deskripsi_area_id: deskripsi3_1.id,
      isi_unsur: 'Rasio pendaftar terhadap mahasiswa baru yang diterima minimal 1:3.',
      urutan: 1,
    },
  });

  const unsur3_1_2 = await prisma.pemeriksaanUnsur.create({
    data: {
      deskripsi_area_id: deskripsi3_1.id,
      isi_unsur: 'Program orientasi mahasiswa baru dilaksanakan secara terstruktur dan terdokumentasi.',
      urutan: 2,
    },
  });

  // --- KRITERIA 4: Sumber Daya Manusia (Dosen & Tendik) ---
  const kriteria4 = await prisma.kriteriaStandar.create({
    data: {
      instrumen_id: instrumen.id,
      kode_kriteria: 'K4',
      nama_kriteria: 'Sumber Daya Manusia',
      deskripsi: 'Standar mengenai kualitas dan kuantitas dosen serta tenaga kependidikan.',
      urutan: 4,
    },
  });

  const kodeAmi4_1 = await prisma.kodeAmi.create({
    data: { kriteria_id: kriteria4.id, kode_ami: 'D.4.1', urutan: 1 },
  });

  await prisma.kodeAmiButirStandar.createMany({
    data: [
      { kode_ami_id: kodeAmi4_1.id, jenjang_id: jenjangS2.id, no_butir: '4.1' },
      { kode_ami_id: kodeAmi4_1.id, jenjang_id: jenjangSTr.id, no_butir: '4.1' },
      { kode_ami_id: kodeAmi4_1.id, jenjang_id: jenjangD3.id, no_butir: '4.1' },
    ],
  });

  const deskripsi4_1 = await prisma.deskripsiArea.create({
    data: {
      kode_ami_id: kodeAmi4_1.id,
      deskripsi_area_audit: 'Kualifikasi dan kompetensi dosen tetap program studi',
      target_standar: 'Minimal 90% dosen tetap bergelar S2/S3 yang linier dengan bidang studi prodi.',
      urutan: 1,
    },
  });

  const unsur4_1_1 = await prisma.pemeriksaanUnsur.create({
    data: {
      deskripsi_area_id: deskripsi4_1.id,
      isi_unsur: 'Persentase dosen tetap bergelar S2/S3 linier ≥ 90% dari total dosen tetap.',
      urutan: 1,
    },
  });

  const unsur4_1_2 = await prisma.pemeriksaanUnsur.create({
    data: {
      deskripsi_area_id: deskripsi4_1.id,
      isi_unsur: 'Rasio dosen tetap terhadap mahasiswa aktif sesuai ketentuan (maks. 1:45 untuk sains teknologi).',
      urutan: 2,
    },
  });

  console.log('✅ Struktur instrumen (kriteria, kode AMI, butir, deskripsi, unsur) seeded');

  // =========================================================
  // 9. Isian AMI (contoh data isian dosen)
  // =========================================================

  // Isian dosen1 - unsur1_1_1 (Visi Misi)
  const isian1 = await prisma.isianAmi.create({
    data: {
      pemeriksaan_unsur_id: unsur1_1_1.id,
      periode_id: periode.id,
      dosen_id: dosen1.id,
      prodi_id: prodiD4TRPL.id,
      judul_dokumen: 'Dokumen VMTS Prodi TRPL 2025',
      ketersediaan_standar: 'ada',
      dokumen: 'ada',
      pencapaian_standar_spt_pt: true,
      pencapaian_standar_sn_dikti: true,
      daya_saing_lokal: true,
      daya_saing_nasional: false,
      daya_saing_internasional: false,
      bukti_link: 'https://drive.google.com/file/vmts-trpl-2025',
      tahun_pelaksanaan: '2025',
      capaian: 'Dokumen VMTS telah diperbarui dan disahkan oleh Direktur Polines.',
      keterangan: 'Tersedia dalam bentuk hardcopy dan softcopy di website prodi.',
      status: 'valid',
      catatan_kaprodi: 'Dokumen sudah lengkap dan sesuai standar.',
      reviewed_by: kaprodiUser.id,
      reviewed_at: new Date(),
      attempt: 1,
      submitted_at: new Date(),
    },
  });

  // Isian dosen1 - unsur4_1_1 (SDM)
  const isian2 = await prisma.isianAmi.create({
    data: {
      pemeriksaan_unsur_id: unsur4_1_1.id,
      periode_id: periode.id,
      dosen_id: dosen1.id,
      prodi_id: prodiD4TRPL.id,
      judul_dokumen: 'Laporan Kualifikasi Dosen TRPL 2025',
      ketersediaan_standar: 'ada',
      dokumen: 'ada',
      pencapaian_standar_spt_pt: true,
      pencapaian_standar_sn_dikti: true,
      daya_saing_lokal: true,
      daya_saing_nasional: true,
      daya_saing_internasional: false,
      bukti_link: 'https://drive.google.com/file/laporan-sdm-2025',
      tahun_pelaksanaan: '2025',
      capaian: '95% dosen tetap bergelar S2/S3 linier dengan bidang studi.',
      keterangan: 'Dari 20 dosen tetap, 19 bergelar S2/S3 yang relevan.',
      status: 'proses',
      attempt: 1,
      submitted_at: new Date(),
    },
  });

  // Isian dosen2 - unsur1_1_1
  const isian3 = await prisma.isianAmi.create({
    data: {
      pemeriksaan_unsur_id: unsur1_1_1.id,
      periode_id: periode.id,
      dosen_id: dosen2.id,
      prodi_id: prodiD3TI.id,
      judul_dokumen: 'Dokumen VMTS Prodi D3 TI 2025',
      ketersediaan_standar: 'ada',
      dokumen: 'ada',
      pencapaian_standar_spt_pt: true,
      pencapaian_standar_sn_dikti: true,
      daya_saing_lokal: true,
      daya_saing_nasional: false,
      daya_saing_internasional: false,
      bukti_link: 'https://drive.google.com/file/vmts-d3ti-2025',
      tahun_pelaksanaan: '2025',
      capaian: 'Dokumen VMTS D3 TI telah direvisi sesuai kebijakan terbaru.',
      keterangan: null,
      status: 'revisi',
      catatan_kaprodi: 'Dokumen perlu dilengkapi dengan rencana strategis 5 tahun ke depan.',
      reviewed_by: kaprodiUser.id,
      reviewed_at: new Date(),
      attempt: 1,
      submitted_at: new Date(),
    },
  });

  // Isian dosen3 - unsur2_1_1
  await prisma.isianAmi.create({
    data: {
      pemeriksaan_unsur_id: unsur2_1_1.id,
      periode_id: periode.id,
      dosen_id: dosen3.id,
      prodi_id: prodiD4TRPL.id,
      judul_dokumen: 'SOP Pengelolaan Prodi TRPL',
      ketersediaan_standar: 'ada',
      dokumen: 'ada',
      pencapaian_standar_spt_pt: false,
      pencapaian_standar_sn_dikti: true,
      daya_saing_lokal: true,
      daya_saing_nasional: false,
      daya_saing_internasional: false,
      bukti_link: null,
      tahun_pelaksanaan: '2025',
      capaian: 'SOP lengkap tersedia dan diperbaharui setiap semester.',
      keterangan: 'Mencakup 15 SOP utama bidang akademik dan 8 SOP non-akademik.',
      status: 'proses',
      attempt: 1,
      submitted_at: new Date(),
    },
  });

  console.log('✅ Isian AMI seeded');

  // =========================================================
  // 10. Review Log
  // =========================================================
  await prisma.isianReviewLog.create({
    data: {
      isian_id: isian1.id,
      reviewer_id: kaprodiUser.id,
      status_sebelum: 'proses',
      status_sesudah: 'valid',
      catatan: 'Dokumen sudah lengkap dan sesuai standar nasional.',
    },
  });

  await prisma.isianReviewLog.create({
    data: {
      isian_id: isian3.id,
      reviewer_id: kaprodiUser.id,
      status_sebelum: 'proses',
      status_sesudah: 'revisi',
      catatan: 'Dokumen perlu dilengkapi dengan rencana strategis 5 tahun ke depan.',
    },
  });

  console.log('✅ Review logs seeded');

  console.log('\n🎉 Seed selesai!');
  console.log('===========================================');
  console.log('Akun tersedia:');
  console.log('  Admin   : admin@polines.ac.id / password123');
  console.log('  Kaprodi : kaprodi.trpl@polines.ac.id / password123');
  console.log('  Dosen 1 : budi.santoso@polines.ac.id / password123');
  console.log('  Dosen 2 : siti.aminah@polines.ac.id / password123');
  console.log('  Dosen 3 : ahmad.rizky@polines.ac.id / password123');
  console.log('===========================================');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
