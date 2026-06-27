import { prisma } from '../app/lib/prisma';

async function main() {
  console.log('🌱 Starting seed Isian AMI...');

  // Get dependencies
  const periode = await prisma.periode.findFirst({ where: { is_active: true } });
  if (!periode) throw new Error("Periode aktif tidak ditemukan.");

  const dosen1 = await prisma.dosen.findFirst({ where: { nip: '196910071995122001' } });
  if (!dosen1) throw new Error("Dosen tidak ditemukan.");

  const prodiD3TI = await prisma.prodi.findFirst({ where: { nama_prodi: 'Teknik Informatika' } });
  if (!prodiD3TI) throw new Error("Prodi D3 TI tidak ditemukan.");

  const kaprodiUser = await prisma.user.findFirst({ where: { email: 'kaprodi.ti@polines.ac.id' } });
  if (!kaprodiUser) throw new Error("User kaprodi tidak ditemukan.");

  // =========================================================
  // 8. Isian AMI (Semua terisi lengkap & valid)
  // =========================================================
  const semuaUnsur = await prisma.pemeriksaanUnsur.findMany();
  
  if (semuaUnsur.length === 0) {
    console.log('⚠️ Tidak ada pemeriksaan unsur yang ditemukan. Pastikan Anda telah menjalankan seed utama terlebih dahulu.');
    return;
  }
  
  console.log(`⏳ Seeding Isian AMI untuk ${semuaUnsur.length} unsur...`);
  
  const isianData = semuaUnsur.map((unsur) => {
    return {
      pemeriksaan_unsur_id: unsur.id,
      periode_id: periode.id,
      dosen_id: dosen1.id,
      prodi_id: prodiD3TI.id,
      judul_dokumen: `Dokumen Bukti untuk Unsur ${unsur.id}`,
      ketersediaan_standar: 'ada' as const,
      dokumen: 'ada' as const,
      pencapaian_standar_spt_pt: true,
      pencapaian_standar_sn_dikti: true,
      daya_saing_lokal: true,
      daya_saing_nasional: true,
      daya_saing_internasional: true,
      bukti_link: `https://drive.google.com/file/d/1A2b3C4d5E6f7G8h9I-dummy-unsur-${unsur.id}/view?usp=sharing`,
      tahun_pelaksanaan: '2025',
      capaian: 'Telah mencapai target yang ditetapkan dalam rencana strategis.',
      keterangan: 'Dokumen lengkap dan dapat diakses dengan baik.',
      status: 'valid' as const,
      catatan_kaprodi: 'Dokumen sudah sesuai dan valid.',
      reviewed_by: kaprodiUser.id,
      reviewed_at: new Date(),
      submitted_at: new Date(),
      attempt: 1,
    };
  });

  // Hapus isian lama terlebih dahulu untuk mencegah duplikasi (optional)
  await prisma.isianAmi.deleteMany();
  
  await prisma.isianAmi.createMany({
    data: isianData,
  });

  console.log(`✅ ${isianData.length} Isian AMI valid berhasil di-seed`);
  console.log('\n🎉 Seed Isian AMI selesai!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
