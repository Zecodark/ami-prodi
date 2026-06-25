import { prisma } from '../app/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Memulai pembuatan seeder uji export...');

  // 1. Dapatkan Periode Aktif
  let periode = await prisma.periode.findFirst({
    where: { is_active: true },
  });

  if (!periode) {
    periode = await prisma.periode.create({
      data: {
        tahun: '2026/2027',
        is_active: true,
        tanggal_mulai: new Date(),
        tanggal_selesai: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      },
    });
    console.log('Periode aktif baru dibuat.');
  } else {
    console.log(`Menggunakan periode aktif: ${periode.tahun}`);
  }

  // 2. Dapatkan Dosen dan Kaprodi
  const dosen = await prisma.dosen.findFirst({
    include: { prodi: true }
  });
  
  const kaprodiUser = await prisma.user.findFirst({
    where: { role: { nama_role: 'kaprodi' } }
  });

  if (!dosen || !kaprodiUser) {
    console.error('❌ Gagal: Data dosen atau kaprodi tidak ditemukan di database. Pastikan seed utama sudah dijalankan.');
    process.exit(1);
  }

  // 3. Buat Instrumen Baru Khusus Uji Export
  const instrumen = await prisma.instrumen.create({
    data: {
      periode_id: periode.id,
      nama_instrumen: 'Instrumen Uji Export (Testing)',
      deskripsi: 'Instrumen ini dibuat khusus untuk menguji fitur export rekapitulasi data AMI.',
      is_active: true,
      created_by: kaprodiUser.id,
      kriteria_standars: {
        create: [
          {
            kode_kriteria: 'K-EXP-1',
            nama_kriteria: 'Kriteria 1 Uji Export: Kelengkapan Dokumen',
            deskripsi: 'Penilaian mengenai kelengkapan dokumen pengajaran dan penelitian dosen.',
            urutan: 1,
            kode_amis: {
              create: [
                {
                  kode_ami: 'AMI-EXP-1.1',
                  urutan: 1,
                  deskripsi_areas: {
                    create: [
                      {
                        deskripsi_area_audit: 'Terdapat dokumen RPS, Modul, dan Bukti Jurnal Penelitian terindeks yang mutakhir.',
                        target_standar: '100% dokumen tersedia dan tervalidasi',
                        urutan: 1,
                        pemeriksaan_unsurs: {
                          create: [
                            {
                              isi_unsur: 'Dokumen Rencana Pembelajaran Semester (RPS) terbaru',
                              urutan: 1
                            },
                            {
                              isi_unsur: 'Dokumen Jurnal Internasional Bereputasi (Minimal Q3)',
                              urutan: 2
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    include: {
      kriteria_standars: {
        include: {
          kode_amis: {
            include: {
              deskripsi_areas: {
                include: {
                  pemeriksaan_unsurs: true
                }
              }
            }
          }
        }
      }
    }
  });

  console.log(`✅ Instrumen "${instrumen.nama_instrumen}" berhasil dibuat.`);

  const unsurs = instrumen.kriteria_standars[0].kode_amis[0].deskripsi_areas[0].pemeriksaan_unsurs;

  // 4. Buat Isian yang semuanya "valid" untuk Dosen tersebut
  for (const unsur of unsurs) {
    const isian = await prisma.isianAmi.create({
      data: {
        pemeriksaan_unsur_id: unsur.id,
        periode_id: periode.id,
        dosen_id: dosen.id,
        prodi_id: dosen.prodi_id,
        judul_dokumen: `Dokumen Uji Export untuk Unsur ${unsur.urutan}`,
        ketersediaan_standar: 'ada',
        dokumen: 'ada',
        pencapaian_standar_spt_pt: true,
        pencapaian_standar_sn_dikti: true,
        daya_saing_lokal: true,
        daya_saing_nasional: true,
        daya_saing_internasional: true,
        bukti_link: 'https://docs.google.com/document/export-test',
        tahun_pelaksanaan: '2026',
        capaian: 'Telah mencapai target yang ditetapkan melebihi 100%.',
        keterangan: 'Dokumen lengkap, valid, dan sangat baik.',
        status: 'valid',
        catatan_kaprodi: 'Sangat baik, pertahankan. Approved.',
        reviewed_by: kaprodiUser.id,
        reviewed_at: new Date(),
        submitted_at: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // Kemarin
        bukti_files: {
          create: [
            {
              original_name: 'dokumen-test-export.pdf',
              file_name: 'bukti-export.pdf',
              file_path: '/uploads/bukti/bukti-export.pdf',
              mime_type: 'application/pdf',
              file_size: 1024000,
              judul_dokumen: 'PDF Laporan Penelitian',
              keterangan_dokumen: 'Dokumen uji coba',
              tahun_dokumen: '2026',
              uploaded_by: dosen.user_id,
            }
          ]
        },
        review_logs: {
          create: [
            {
              reviewer_id: kaprodiUser.id,
              status_sebelum: 'proses',
              status_sesudah: 'valid',
              catatan: 'Sangat baik, pertahankan. Approved.',
            }
          ]
        }
      }
    });
    console.log(`✅ Isian untuk Unsur "${unsur.isi_unsur.substring(0, 30)}..." berhasil ditambahkan dengan status VALID.`);
  }

  console.log('🎉 Selesai! Seeder uji export berhasil dijalankan.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
