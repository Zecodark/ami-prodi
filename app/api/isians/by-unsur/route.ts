import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

type UnsurStatus = 'valid' | 'revisi' | 'proses' | 'kosong';

/**
 * GET /api/isians/by-unsur?periode_id=...&prodi_id=...
 *
 * Mengembalikan rollup status per `pemeriksaan_unsur` untuk pasangan prodi + periode.
 * Karena wadah AMI bersifat shared per-prodi, status setiap unsur dihitung kolektif:
 *
 *   valid   → minimal ada 1 isian (attempt terbaru) yang sudah disetujui kaprodi.
 *   revisi  → tidak ada yang valid, tapi ada isian dengan status revisi (perlu diperbaiki).
 *   proses  → ada isian terkirim tapi belum direview kaprodi.
 *   kosong  → belum ada satupun isian.
 *
 * Output:
 * {
 *   data: {
 *     unsur_id_string: {
 *       status: 'valid' | 'revisi' | 'proses' | 'kosong',
 *       counts: { valid, revisi, proses, total },
 *       latest_isian_id: string | null,
 *       latest_dosen_nama: string | null,
 *       reviewed_at: string | null,
 *       updated_at: string | null,
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = guard(request, 'dosen', 'kaprodi', 'admin');
    if (error) return error;

    const { searchParams } = request.nextUrl;

    // Tentukan periode_id (default: periode aktif)
    let periodeId: any = null;
    const periodeParam = searchParams.get('periode_id');
    if (periodeParam) {
      periodeId = Number(periodeParam);
    } else {
      const aktif = await prisma.periode.findFirst({
        where: { is_active: true },
        select: { id: true },
        orderBy: { created_at: 'desc' },
      });
      if (!aktif) return R.ok(serialize({ data: {} }));
      periodeId = aktif.id;
    }

    // Tentukan prodi_id
    let prodiId: any = null;
    const prodiParam = searchParams.get('prodi_id');

    if (user.roleName.toLowerCase() === 'dosen') {
      // Dosen hanya bisa lihat prodinya sendiri
      const dosen = await prisma.dosen.findUnique({
        where: { user_id: user.userId },
        select: { prodi_id: true },
      });
      if (!dosen?.prodi_id) return R.notFound('Profil dosen tidak terhubung ke prodi');
      prodiId = dosen.prodi_id;
    } else if (user.roleName.toLowerCase() === 'kaprodi') {
      // Kaprodi otomatis filter ke prodi-nya sendiri
      const kaprodiDosen = await prisma.dosen.findUnique({
        where: { user_id: user.userId },
        select: { prodi_id: true },
      });
      if (kaprodiDosen?.prodi_id) {
        prodiId = kaprodiDosen.prodi_id;
      } else if (prodiParam) {
        prodiId = Number(prodiParam);
      }
    } else if (prodiParam) {
      prodiId = Number(prodiParam);
    }

    if (!prodiId) {
      return R.badRequest('prodi_id wajib disertakan untuk admin/kaprodi');
    }

    // Ambil semua isian untuk prodi+periode terkait
    const isians: any[] = await prisma.isianAmi.findMany({
      where: {
        periode_id: periodeId,
        prodi_id: prodiId,
      },
      select: {
        id: true,
        pemeriksaan_unsur_id: true,
        dosen_id: true,
        status: true,
        attempt: true,
        reviewed_at: true,
        updated_at: true,
        dosen: { select: { nama_lengkap: true } },
      },
      orderBy: [
        { pemeriksaan_unsur_id: 'asc' },
        { dosen_id: 'asc' },
        { attempt: 'desc' },
      ],
    });

    // Untuk tiap (unsur, dosen) ambil attempt terbaru
    const latestPerDosen = new Map<string, (typeof isians)[number]>();
    for (const it of isians) {
      const key = `${it.pemeriksaan_unsur_id}::${it.dosen_id}`;
      if (!latestPerDosen.has(key)) latestPerDosen.set(key, it);
    }

    // Group berdasarkan unsur
    const grouped = new Map<string, (typeof isians)[number][]>();
    for (const it of latestPerDosen.values()) {
      const key = it.pemeriksaan_unsur_id.toString();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(it);
    }

    const result: Record<
      string,
      {
        status: UnsurStatus;
        counts: { valid: number; revisi: number; proses: number; total: number };
        latest_isian_id: string | null;
        latest_dosen_nama: string | null;
        reviewed_at: string | null;
        updated_at: string | null;
      }
    > = {};

    for (const [unsurId, list] of grouped.entries()) {
      let valid = 0;
      let revisi = 0;
      let proses = 0;

      let latest = list[0];
      for (const it of list) {
        if (it.status === 'valid') valid++;
        else if (it.status === 'revisi') revisi++;
        else if (it.status === 'proses') proses++;

        if (
          new Date(it.updated_at).getTime() >
          new Date(latest.updated_at).getTime()
        ) {
          latest = it;
        }
      }

      let status: UnsurStatus = 'kosong';
      if (valid > 0) status = 'valid';
      else if (revisi > 0) status = 'revisi';
      else if (proses > 0) status = 'proses';

      result[unsurId] = {
        status,
        counts: {
          valid,
          revisi,
          proses,
          total: list.length,
        },
        latest_isian_id: latest.id.toString(),
        latest_dosen_nama: latest.dosen?.nama_lengkap ?? null,
        reviewed_at: latest.reviewed_at?.toISOString() ?? null,
        updated_at: latest.updated_at?.toISOString() ?? null,
      };
    }

    return R.ok(serialize({ data: result, periode_id: periodeId, prodi_id: prodiId }));
  } catch (e) {
    return R.serverError(e);
  }
}
