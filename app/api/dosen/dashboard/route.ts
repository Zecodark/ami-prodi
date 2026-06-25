import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

export async function GET(request: NextRequest) {
  try {
    const { user, error } = guard(request, 'dosen');
    if (error) return error;

    // Get dosen profile
    const dosen = await prisma.dosen.findUnique({
      where: { user_id: user.userId },
      include: { prodi: true },
    });

    if (!dosen || !dosen.prodi_id) {
      return R.notFound('Profil dosen tidak terhubung ke prodi');
    }

    const prodi = dosen.prodi;
    const prodiId = dosen.prodi_id;

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
          total_unsur: 0,
          unsur_terisi: 0,
          unsur_belum_valid: 0,
          unsur_perlu_revisi: 0,
          unsur_valid: 0,
          unsur_proses: 0,
          progress: 0,
          dosen_proses: 0,
          dosen_revisi: 0,
        })
      );
    }

    // Instrumen aktif untuk periode aktif yang terhubung dengan prodi dosen
    // Jika tidak ada yang ter-link, fallback ke instrumen aktif dari periode
    let activeInstrumen = await prisma.instrumen.findFirst({
      where: {
        periode_id: activePeriode.id,
        is_active: true,
        prodi_links: {
          some: {
            prodi_id: prodiId,
            is_active: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    
    // Fallback: if no linked instrumen, get any active instrumen for this periode
    if (!activeInstrumen) {
      activeInstrumen = await prisma.instrumen.findFirst({
        where: {
          periode_id: activePeriode.id,
          is_active: true,
        },
        orderBy: { created_at: 'desc' },
      });
    }

    // Total unsur dari instrumen aktif (SEMUA unsur, tidak filter jenjang di sini)
    let totalUnsur = 0;
    if (activeInstrumen) {
      totalUnsur = await prisma.pemeriksaanUnsur.count({
        where: {
          deskripsi_area: {
            kode_ami: {
              kriteria: { instrumen_id: activeInstrumen.id },
            },
          },
        },
      });
    }

    // Filter isian untuk instrumen aktif (tidak perlu filter jenjang)
    const whereIsianFilter: any = {
      periode_id: activePeriode.id,
      prodi_id: prodiId,
    };

    if (activeInstrumen) {
      whereIsianFilter.pemeriksaan_unsur = {
        deskripsi_area: {
          kode_ami: {
            kriteria: { instrumen_id: activeInstrumen.id },
          },
        },
      };
    }

    // Ambil semua isian untuk periode, prodi, dan instrumen terkait
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

    // Ambil hanya attempt terbaru per (unsur, dosen)
    const latestPerDosen = new Map<string, (typeof isians)[number]>();
    for (const it of isians) {
      const key = `${it.pemeriksaan_unsur_id}::${it.dosen_id}`;
      if (!latestPerDosen.has(key)) latestPerDosen.set(key, it);
    }

    // Group berdasarkan unsur (kolektif per-prodi)
    const grouped = new Map<string, (typeof isians)[number][]>();
    for (const it of latestPerDosen.values()) {
      const key = it.pemeriksaan_unsur_id.toString();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(it);
    }

    // Hitung status per unsur (kolektif)
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
      // Priority: valid > revisi > proses
      if (valid > 0) unsurValid++;
      else if (revisi > 0) unsurRevisi++;
      else if (proses > 0) unsurProses++;
    }

    const unsurTerisi = unsurValid + unsurProses + unsurRevisi;
    const unsurBelumValid = Math.max(0, totalUnsur - unsurValid);
    const progress = totalUnsur > 0 ? Math.round((unsurValid / totalUnsur) * 100) : 0;

    // Hitung statistik khusus dosen yang login (untuk "Menunggu Review" dan "Perlu Revisi")
    let dosenProses = 0;
    let dosenRevisi = 0;
    for (const it of latestPerDosen.values()) {
      if (it.dosen_id === dosen.id) {
        if (it.status === 'proses') dosenProses++;
        else if (it.status === 'revisi') dosenRevisi++;
      }
    }

    return R.ok(
      serialize({
        periode_aktif: activePeriode.tahun,
        instrumen_aktif: activeInstrumen?.nama_instrumen ?? null,
        prodi: prodi
          ? { id: prodi.id, nama_prodi: prodi.nama_prodi, jenjang: prodi.jenjang }
          : null,

        // Statistik kolektif per-prodi (sama dengan Kaprodi)
        total_unsur: totalUnsur,
        unsur_terisi: unsurTerisi,
        unsur_belum_valid: unsurBelumValid,
        unsur_perlu_revisi: unsurRevisi,
        unsur_valid: unsurValid,
        unsur_proses: unsurProses,
        progress,

        // Statistik khusus dosen yang login
        dosen_proses: dosenProses,
        dosen_revisi: dosenRevisi,
      })
    );
  } catch (e) {
    return R.serverError(e);
  }
}
