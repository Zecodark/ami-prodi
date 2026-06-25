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

    let prodiId = user.prodiId;
    if (!prodiId && user.roleName.toLowerCase() === 'kaprodi') {
      const kaprodiUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { prodi_id: true, dosen: { select: { prodi_id: true } } },
      });
      prodiId = kaprodiUser?.prodi_id ?? kaprodiUser?.dosen?.prodi_id ?? null;
    }

    if (!prodiId) {
      return R.notFound(
        'Akun kaprodi belum terhubung ke prodi. Hubungi admin untuk pengaturan.'
      );
    }
    const prodi = await prisma.prodi.findUnique({ where: { id: prodiId } });

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
          unsur_belum_valid: 0,
          unsur_perlu_revisi: 0,
          progress: 0,
          isians: { masuk: 0, proses: 0, valid: 0, revisi: 0 },
          recent_isians: [],
        })
      );
    }

    // Instrumen aktif untuk periode aktif yang terhubung dengan prodi kaprodi
    // Jika tidak ada yang ter-link, fallback ke instrumen aktif dari periode
    let activeInstrumen = await prisma.instrumen.findFirst({
      where: { 
        periode_id: activePeriode.id, 
        is_active: true,
        prodi_links: {
          some: {
            prodi_id: prodiId,
            is_active: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
    });
    
    // Fallback: if no linked instrumen, get any active instrumen for this periode
    if (!activeInstrumen) {
      activeInstrumen = await prisma.instrumen.findFirst({
        where: { 
          periode_id: activePeriode.id, 
          is_active: true
        },
        orderBy: { created_at: 'desc' },
      });
    }

    // Total unsur dari instrumen aktif (SEMUA unsur, tidak filter jenjang di sini)
    // Karena pemeriksaan_unsur sudah terhubung ke kode_ami yang punya butir_standar
    let totalUnsur = 0;
    const targetJenjangs = prodi?.jenjang ? [prodi.jenjang] : [];
    if (prodi?.jenjang === 'D4') targetJenjangs.push('STR');
    if (prodi?.jenjang === 'STR') targetJenjangs.push('D4');

    if (activeInstrumen) {
      totalUnsur = await prisma.pemeriksaanUnsur.count({
        where: {
          deskripsi_area: {
            kode_ami: { 
              kriteria: { instrumen_id: activeInstrumen.id },
              OR: [
                { butir_standars: { none: {} } },
                { butir_standars: { some: { jenjang: { kode_jenjang: { in: targetJenjangs as string[] } } } } }
              ]
            },
          },
        },
      });
    }

    // Hitung jumlah dosen di prodi kaprodi
    const dosenCount = await prisma.dosen.count({
      where: { prodi_id: prodiId, is_active: true },
    });

    // Statistik isian (status counts) untuk instrumen aktif (tidak perlu filter jenjang)
    const whereIsianFilter: any = { 
      periode_id: activePeriode.id, 
      prodi_id: prodiId 
    };
    
    if (activeInstrumen) {
      whereIsianFilter.pemeriksaan_unsur = {
        deskripsi_area: {
          kode_ami: {
            kriteria: { instrumen_id: activeInstrumen.id },
            OR: [
              { butir_standars: { none: {} } },
              { butir_standars: { some: { jenjang: { kode_jenjang: { in: targetJenjangs as string[] } } } } }
            ]
          }
        }
      };
    }

    const isianStats = await prisma.isianAmi.groupBy({
      by: ['status'],
      where: whereIsianFilter,
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
      where: whereIsianFilter,
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
    const unsurBelumValid = Math.max(0, totalUnsur - unsurValid);
    const progress = totalUnsur > 0 ? Math.round((unsurValid / totalUnsur) * 100) : 0;

    // Dua isian terlama yang masih menunggu review
    const recentIsians = await prisma.isianAmi.findMany({
      where: {
        ...whereIsianFilter,
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
      orderBy: [
        { submitted_at: 'asc' },
        { id: 'asc' },
      ],
      take: 2,
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
        unsur_belum_valid: unsurBelumValid,
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
