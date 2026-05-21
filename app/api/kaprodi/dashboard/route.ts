import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

/**
 * Resolve prodi_id untuk seorang kaprodi.
 * Urutan:
 *  1. Dari profil Dosen yang terhubung ke user
 *  2. Fallback: ambil prodi pertama yang ada (untuk kasus seeder belum dijalankan ulang)
 */
async function resolveKaprodiProdi(userId: number) {
  // Coba dari profil Dosen
  const dosen = await prisma.dosen.findUnique({
    where: { user_id: userId },
    include: { prodi: true },
  });
  if (dosen?.prodi_id) {
    return { prodiId: dosen.prodi_id, prodi: dosen.prodi };
  }

  // Fallback: ambil prodi pertama (untuk sistem single-prodi atau jika seeder belum dijalankan ulang)
  const firstProdi = await prisma.prodi.findFirst({
    orderBy: { id: 'asc' },
  });
  if (firstProdi) {
    return { prodiId: firstProdi.id, prodi: firstProdi };
  }

  return { prodiId: null as number | null, prodi: null };
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = guard(request, 'kaprodi');
    if (error) return error;

    const { prodiId, prodi } = await resolveKaprodiProdi(user.userId);
    if (!prodiId) {
      return R.notFound(
        'Akun kaprodi belum terhubung ke prodi. Hubungi admin untuk pengaturan.'
      );
    }

    // Periode aktif
    const activePeriode = await prisma.periode.findFirst({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
    });

    if (!activePeriode) {
      return R.ok(
        serialize({
          periode_aktif: null,
          instrumen_aktif: null,
          prodi: prodi ? { id: prodi.id, nama_prodi: prodi.nama_prodi, jenjang: prodi.jenjang } : null,
          dosen_count: 0,
          total_unsur: 0,
          unsur_terisi: 0,
          unsur_belum_terisi: 0,
          unsur_perlu_revisi: 0,
          progress: 0,
          isians: { masuk: 0, proses: 0, valid: 0, revisi: 0 },
          recent_isians: [],
        })
      );
    }

    // Instrumen aktif untuk periode aktif
    const activeInstrumen = await prisma.instrumen.findFirst({
      where: { periode_id: activePeriode.id, is_active: true },
      orderBy: { created_at: 'desc' },
    });

    // Total unsur dari instrumen aktif
    let totalUnsur = 0;
    if (activeInstrumen) {
      totalUnsur = await prisma.pemeriksaanUnsur.count({
        where: {
          deskripsi_area: {
            kode_ami: { kriteria: { instrumen_id: activeInstrumen.id } },
          },
        },
      });
    }

    // Hitung jumlah dosen di prodi kaprodi
    const dosenCount = await prisma.dosen.count({
      where: { prodi_id: prodiId, is_active: true },
    });

    // Statistik isian (status counts)
    const isianStats = await prisma.isianAmi.groupBy({
      by: ['status'],
      where: { periode_id: activePeriode.id, prodi_id: prodiId },
      _count: true,
    });

    const statsMap = { masuk: 0, proses: 0, valid: 0, revisi: 0 };
    for (const s of isianStats) {
      if (s.status === 'proses') statsMap.proses = s._count;
      else if (s.status === 'valid') statsMap.valid = s._count;
      else if (s.status === 'revisi') statsMap.revisi = s._count;
    }
    statsMap.masuk = statsMap.proses + statsMap.valid + statsMap.revisi;

    // Hitung berapa unsur yang sudah terisi (kolektif), perlu revisi, dst.
    // Ambil semua isian, group by unsur, ambil attempt terbaru per (unsur, dosen)
    const isians = await prisma.isianAmi.findMany({
      where: { periode_id: activePeriode.id, prodi_id: prodiId },
      select: {
        pemeriksaan_unsur_id: true,
        dosen_id: true,
        status: true,
        attempt: true,
      },
      orderBy: [
        { pemeriksaan_unsur_id: 'asc' },
        { dosen_id: 'asc' },
        { attempt: 'desc' },
      ],
    });

    const latestPerDosen = new Map<string, (typeof isians)[number]>();
    for (const it of isians) {
      const key = `${it.pemeriksaan_unsur_id}::${it.dosen_id}`;
      if (!latestPerDosen.has(key)) latestPerDosen.set(key, it);
    }

    const grouped = new Map<string, (typeof isians)[number][]>();
    for (const it of latestPerDosen.values()) {
      const key = it.pemeriksaan_unsur_id.toString();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(it);
    }

    let unsurValid = 0;
    let unsurRevisi = 0;
    let unsurProses = 0;

    for (const list of grouped.values()) {
      let valid = 0;
      let revisi = 0;
      let proses = 0;
      for (const it of list) {
        if (it.status === 'valid') valid++;
        else if (it.status === 'revisi') revisi++;
        else if (it.status === 'proses') proses++;
      }
      if (valid > 0) unsurValid++;
      else if (revisi > 0) unsurRevisi++;
      else if (proses > 0) unsurProses++;
    }

    const unsurTerisi = unsurValid + unsurProses + unsurRevisi;
    const unsurBelumTerisi = Math.max(0, totalUnsur - unsurTerisi);
    const progress = totalUnsur > 0 ? Math.round((unsurTerisi / totalUnsur) * 100) : 0;

    // Daftar isian terbaru yang menunggu review
    const recentIsians = await prisma.isianAmi.findMany({
      where: {
        periode_id: activePeriode.id,
        prodi_id: prodiId,
        status: 'proses',
      },
      include: {
        dosen: { select: { nama_lengkap: true, nip: true } },
        pemeriksaan_unsur: {
          include: {
            deskripsi_area: {
              include: {
                kode_ami: {
                  include: { kriteria: { select: { nama_kriteria: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { submitted_at: 'desc' },
      take: 5,
    });

    return R.ok(
      serialize({
        periode_aktif: activePeriode.tahun,
        instrumen_aktif: activeInstrumen?.nama_instrumen ?? null,
        prodi: prodi
          ? { id: prodi.id, nama_prodi: prodi.nama_prodi, jenjang: prodi.jenjang }
          : null,
        dosen_count: dosenCount,

        total_unsur: totalUnsur,
        unsur_terisi: unsurTerisi,
        unsur_belum_terisi: unsurBelumTerisi,
        unsur_perlu_revisi: unsurRevisi,
        unsur_valid: unsurValid,
        unsur_proses: unsurProses,
        progress,

        isians: statsMap,

        recent_isians: recentIsians.map((isian) => ({
          id: isian.id,
          dosen_nama: isian.dosen.nama_lengkap,
          dosen_nip: isian.dosen.nip,
          judul_dokumen: isian.judul_dokumen,
          kriteria:
            isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.nama_kriteria,
          kode_ami: isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kode_ami,
          submitted_at: isian.submitted_at,
        })),
      })
    );
  } catch (e) {
    return R.serverError(e);
  }
}
