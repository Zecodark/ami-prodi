import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

type UnsurStatus = 'valid' | 'revisi' | 'proses' | 'kosong' | 'superseded';

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
    const instrumenParam = searchParams.get('instrumen_id');

    if (user.roleName.toLowerCase() === 'dosen') {
      // Dosen hanya bisa lihat prodinya sendiri
      const dosen = await prisma.dosen.findUnique({
        where: { user_id: user.userId },
        select: { id: true, prodi_id: true },
      });
      if (!dosen?.prodi_id) return R.notFound('Profil dosen tidak terhubung ke prodi');
      prodiId = dosen.prodi_id;
      // @ts-ignore
      request.dosenId = dosen.id;
    } else if (user.roleName.toLowerCase() === 'kaprodi') {
      // Kaprodi otomatis filter ke prodi-nya sendiri
      const kaprodiUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { prodi_id: true, dosen: { select: { prodi_id: true } } },
      });
      if (kaprodiUser?.prodi_id) {
        prodiId = kaprodiUser.prodi_id;
      } else if (kaprodiUser?.dosen?.prodi_id) {
        prodiId = kaprodiUser.dosen.prodi_id;
      } else if (prodiParam) {
        prodiId = Number(prodiParam);
      }
    } else if (prodiParam) {
      prodiId = Number(prodiParam);
    }

    if (user.roleName.toLowerCase() !== 'admin' && !prodiId) {
      // Allow if it's admin. If kaprodi doesn't have prodi_id, they will see everything.
      // But usually Kaprodi has a prodi_id.
    }

    const whereClause: any = { periode_id: periodeId };
    if (prodiId) {
      whereClause.prodi_id = prodiId;
    }

    // Filter by instrumen (either from query param, or fallback to active instrument for the period)
    let targetInstrumenId = instrumenParam ? Number(instrumenParam) : null;
    if (!targetInstrumenId) {
      // Try to get linked instrumen first
      let activeInstrumen = await prisma.instrumen.findFirst({
        where: { 
          periode_id: periodeId, 
          is_active: true,
          ...(prodiId ? {
            prodi_links: {
              some: {
                prodi_id: prodiId,
                is_active: true
              }
            }
          } : {})
        },
        select: { id: true },
        orderBy: { created_at: 'desc' },
      });
      
      // Fallback: if no linked instrumen, get any active instrumen for this periode
      if (!activeInstrumen && prodiId) {
        activeInstrumen = await prisma.instrumen.findFirst({
          where: { 
            periode_id: periodeId, 
            is_active: true
          },
          select: { id: true },
          orderBy: { created_at: 'desc' },
        });
      }
      
      if (activeInstrumen) {
        targetInstrumenId = activeInstrumen.id;
      }
    }

    if (targetInstrumenId) {
      const prodiObj = await prisma.prodi.findUnique({ where: { id: prodiId } });
      const targetJenjangs = prodiObj ? [prodiObj.jenjang, prodiObj.jenjang === 'D4' ? 'STR' : prodiObj.jenjang === 'STR' ? 'D4' : ''] : [];

      whereClause.pemeriksaan_unsur = {
        deskripsi_area: {
          kode_ami: {
            kriteria: {
              instrumen_id: targetInstrumenId
            },
            OR: [
              { butir_standars: { none: {} } },
              { butir_standars: { some: { jenjang: { kode_jenjang: { in: targetJenjangs as string[] } } } } }
            ]
          }
        }
      };
    }

    // Ambil semua isian untuk prodi+periode terkait
    const isians: any[] = await prisma.isianAmi.findMany({
      where: whereClause,
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

    // Group berdasarkan unsur
    const grouped = new Map<string, (typeof isians)[number][]>();
    let dosenProses = 0;
    let dosenRevisi = 0;
    
    // @ts-ignore
    const currentDosenId = request.dosenId;

    for (const it of isians) {
      const key = it.pemeriksaan_unsur_id.toString();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(it);
      
      // Hitung khusus untuk dosen login
      if (currentDosenId && it.dosen_id === currentDosenId) {
        if (it.status === 'proses') dosenProses++;
        if (it.status === 'revisi') dosenRevisi++;
      }
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
      let superseded = 0;

      let latest = list[0];
      let firstValid = null;

      for (const it of list) {
        if (it.status === 'valid') {
          valid++;
          if (!firstValid) firstValid = it;
        }
        else if (it.status === 'revisi') revisi++;
        else if (it.status === 'proses') proses++;
        else if (it.status === 'superseded') superseded++;

        if (
          new Date(it.updated_at).getTime() >
          new Date(latest.updated_at).getTime()
        ) {
          latest = it;
        }
      }

      if (firstValid) {
        latest = firstValid;
      }

      let status: UnsurStatus = 'kosong';
      if (valid > 0) status = 'valid';
      else if (revisi > 0) status = 'revisi';
      else if (proses > 0) status = 'proses';
      else if (superseded > 0) status = 'superseded';

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

    return R.ok(serialize({ 
      data: result, 
      periode_id: periodeId, 
      prodi_id: prodiId,
      dosen_stats: currentDosenId ? { proses: dosenProses, revisi: dosenRevisi } : null
    }));
  } catch (e) {
    return R.serverError(e);
  }
}
