import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

export async function GET(request: NextRequest) {
  try {
    const { user, error } = guard(request, 'kaprodi');
    if (error) return error;

    // Get kaprodi's dosen profile to find prodi_id
    const kaprodiDosen = await prisma.dosen.findUnique({
      where: { user_id: user.userId },
      include: { prodi: true },
    });

    if (!kaprodiDosen) {
      return R.notFound('Profil kaprodi tidak ditemukan');
    }

    const prodiId = kaprodiDosen.prodi_id;

    // Get active periode
    const activePeriode = await prisma.periode.findFirst({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
    });

    if (!activePeriode) {
      return R.notFound('Periode aktif tidak ditemukan');
    }

    // Get active instrumen for active periode
    const activeInstrumen = await prisma.instrumen.findFirst({
      where: {
        periode_id: activePeriode.id,
        is_active: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Count dosen in kaprodi's prodi
    const dosenCount = await prisma.dosen.count({
      where: {
        prodi_id: prodiId,
        is_active: true,
      },
    });

    // Get isian statistics for kaprodi's prodi
    const isianStats = await prisma.isianAmi.groupBy({
      by: ['status'],
      where: {
        periode_id: activePeriode.id,
        prodi_id: prodiId,
      },
      _count: true,
    });

    const statsMap = {
      masuk: 0,
      proses: 0,
      valid: 0,
      revisi: 0,
    };

    isianStats.forEach((stat) => {
      if (stat.status === 'proses') statsMap.proses = stat._count;
      if (stat.status === 'valid') statsMap.valid = stat._count;
      if (stat.status === 'revisi') statsMap.revisi = stat._count;
    });

    statsMap.masuk = statsMap.proses + statsMap.valid + statsMap.revisi;

    // Get recent isian that need review (proses status)
    const recentIsians = await prisma.isianAmi.findMany({
      where: {
        periode_id: activePeriode.id,
        prodi_id: prodiId,
        status: 'proses',
      },
      include: {
        dosen: {
          select: { nama_lengkap: true, nip: true },
        },
        pemeriksaan_unsur: {
          include: {
            deskripsi_area: {
              include: {
                kode_ami: {
                  include: {
                    kriteria: {
                      select: { nama_kriteria: true },
                    },
                  },
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
        instrumen_aktif: activeInstrumen?.nama_instrumen || 'Instrumen tidak ditemukan',
        dosen_count: dosenCount,
        isians: statsMap,
        recent_isians: recentIsians.map((isian) => ({
          id: isian.id,
          dosen_nama: isian.dosen.nama_lengkap,
          dosen_nip: isian.dosen.nip,
          judul_dokumen: isian.judul_dokumen,
          kriteria: isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.nama_kriteria,
          kode_ami: isian.pemeriksaan_unsur.deskripsi_area.kode_ami.kode_ami,
          submitted_at: isian.submitted_at,
        })),
      }),
    );
  } catch (e) {
    return R.serverError(e);
  }
}
