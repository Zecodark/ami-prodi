import { prisma } from '../app/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  // --- 1. Seed Roles ---
  const roleAdmin = await prisma.role.create({
    data: { nama_role: 'Admin' },
  });
  const roleKaprodi = await prisma.role.create({
    data: { nama_role: 'Kaprodi' },
  });
  const roleDosen = await prisma.role.create({
    data: { nama_role: 'Dosen' },
  });
  const roleAsesor = await prisma.role.create({
    data: { nama_role: 'Asesor' },
  });

  // --- 2. Seed Jurusan & Prodi ---
  const jurusanTeknikInformatika = await prisma.jurusan.create({
    data: { nama_jurusan: 'Teknik Informatika' },
  });

  const prodiD3TI = await prisma.prodi.create({
    data: { 
      nama_prodi: 'D3 Teknik Informatika',
      jurusan_id: jurusanTeknikInformatika.id
    },
  });

  const prodiD4TRPL = await prisma.prodi.create({
    data: { 
      nama_prodi: 'D4 Teknologi Rekayasa Perangkat Lunak',
      jurusan_id: jurusanTeknikInformatika.id
    },
  });

  // --- 3. Seed Users ---
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@polbeng.ac.id',
      password: hashedPassword,
      role_id: roleAdmin.id,
    },
  });

  // Kaprodi User
  const kaprodiUser = await prisma.user.create({
    data: {
      email: 'kaprodi.trpl@polbeng.ac.id',
      password: hashedPassword,
      role_id: roleKaprodi.id,
    },
  });

  // Dosen Users
  const dosenUser1 = await prisma.user.create({
    data: {
      email: 'dosen1@polbeng.ac.id',
      password: hashedPassword,
      role_id: roleDosen.id,
    },
  });

  const dosenUser2 = await prisma.user.create({
    data: {
      email: 'dosen2@polbeng.ac.id',
      password: hashedPassword,
      role_id: roleDosen.id,
    },
  });

  // --- 4. Seed Dosen Profiles ---
  const dosenProfile1 = await prisma.dosen.create({
    data: {
      user_id: dosenUser1.id,
      prodi_id: prodiD4TRPL.id,
      nip: '198001012005011001',
      nama_lengkap: 'Budi Santoso, M.Kom.',
    },
  });

  const dosenProfile2 = await prisma.dosen.create({
    data: {
      user_id: dosenUser2.id,
      prodi_id: prodiD3TI.id,
      nip: '198502022010121002',
      nama_lengkap: 'Siti Aminah, M.T.',
    },
  });

  // --- 5. Seed Periode AMI ---
  const periodeAmi = await prisma.periodeAmi.create({
    data: {
      tahun: '2025/2026',
      is_active: true,
    },
  });

  // --- 6. Seed Instrumen & Butir Instrumen ---
  const instrumenPendidikan = await prisma.instrumen.create({
    data: {
      periode_id: periodeAmi.id,
      nama_instrumen: 'Standar Kompetensi Lulusan',
    },
  });

  const butir1 = await prisma.butirInstrumen.create({
    data: {
      instrumen_id: instrumenPendidikan.id,
      kode_butir: 'SKL-01',
      deskripsi_area_audit: 'Kesesuaian capaian pembelajaran lulusan dengan profil lulusan.',
      target_standar: '100% lulusan mencapai CPL yang ditargetkan.',
    },
  });

  const butir2 = await prisma.butirInstrumen.create({
    data: {
      instrumen_id: instrumenPendidikan.id,
      kode_butir: 'SKL-02',
      deskripsi_area_audit: 'Rata-rata IPK lulusan.',
      target_standar: 'Rata-rata IPK lulusan >= 3.00.',
    },
  });

  // --- 7. Seed Isian ---
  await prisma.isian.create({
    data: {
      butir_id: butir1.id,
      dosen_id: dosenProfile1.id,
      periode_id: periodeAmi.id,
      judul_dokumen: 'Laporan CPL Lulusan TRPL 2024',
      attempt: 1,
      status_attempt: 'submitted',
      ketersediaan_standar: 'ada',
      dokumen: 'ada',
      pencapaian_standar_spt_pt: true,
      pencapaian_standar_sn_dikti: true,
      lokal: true,
      nasional: false,
      internasional: false,
      bukti_dokumen: 'laporan_cpl_2024.pdf',
      bukti_link: 'https://docs.google.com/document/d/example1',
      tahun_pelaksanaan: '2024',
      capaian: '95% lulusan mencapai CPL yang ditargetkan.',
      keterangan: 'Sebagian kecil mahasiswa belum memenuhi 1 capaian spesifik.',
      status: 'proses',
    },
  });

  await prisma.isian.create({
    data: {
      butir_id: butir2.id,
      dosen_id: dosenProfile2.id,
      periode_id: periodeAmi.id,
      judul_dokumen: 'Laporan IPK Lulusan D3 TI 2024',
      attempt: 1,
      status_attempt: 'submitted',
      ketersediaan_standar: 'ada',
      dokumen: 'ada',
      pencapaian_standar_spt_pt: true,
      pencapaian_standar_sn_dikti: true,
      lokal: true,
      nasional: true,
      internasional: false,
      bukti_dokumen: 'laporan_ipk_2024.pdf',
      bukti_link: 'https://docs.google.com/document/d/example2',
      tahun_pelaksanaan: '2024',
      capaian: 'Rata-rata IPK lulusan adalah 3.25',
      keterangan: 'Target tercapai.',
      status: 'valid',
      catatan_kaprodi: 'Sangat baik, pertahankan kualitas lulusan.',
    },
  });

  console.log('Seed data inserted successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
