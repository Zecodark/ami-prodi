import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const schema = z.object({
  periode_id: z.coerce.number().optional().nullable(),
  nama_instrumen: z.string().min(1, 'Nama instrumen wajib diisi'),
  deskripsi: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { user, error } = guard(request, 'admin', 'dosen', 'kaprodi');
    if (error) return error;

    const periodeId = request.nextUrl.searchParams.get('periode_id');
    const isActive = request.nextUrl.searchParams.get('is_active');

    const where: any = {};
    if (periodeId) where.periode_id = Number(periodeId);
    if (isActive !== null) where.is_active = isActive === 'true';

    // For dosen and kaprodi, filter by prodi_links
    if (user.roleName === 'dosen' || user.roleName === 'kaprodi') {
      if (!user.prodiId) return R.ok(serialize([]));
      
      // Try to get instrumen linked to this prodi
      const linkedWhere = {
        ...where,
        prodi_links: {
          some: {
            prodi_id: user.prodiId,
            is_active: true
          }
        }
      };
      
      const linkedData = await prisma.instrumen.findMany({
        where: linkedWhere,
        include: {
          periode: { select: { id: true, tahun: true, is_active: true } },
          _count: { select: { kriteria_standars: true } },
        },
        orderBy: { created_at: 'asc' },
      });
      
      // If no linked instrumen found, fallback to all instrumen from active periode
      // This allows new prodi to see active instrumen before admin links them
      if (linkedData.length === 0) {
        console.log(`[INFO] No linked instrumen for prodi ${user.prodiId}, using fallback`);
        const fallbackData = await prisma.instrumen.findMany({
          where,
          include: {
            periode: { select: { id: true, tahun: true, is_active: true } },
            _count: { select: { kriteria_standars: true } },
          },
          orderBy: { created_at: 'asc' },
        });
        return R.ok(serialize(fallbackData));
      }
      
      return R.ok(serialize(linkedData));
    }

    // For admin, return all
    const data = await prisma.instrumen.findMany({
      where,
      include: {
        periode: { select: { id: true, tahun: true, is_active: true } },
        _count: { select: { kriteria_standars: true } },
      },
      orderBy: { created_at: 'asc' },
    });
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = guard(request, 'admin');
    if (error) return error;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const data = await prisma.instrumen.create({
      data: {
        nama_instrumen: parsed.data.nama_instrumen,
        deskripsi: parsed.data.deskripsi ?? null,
        periode_id: parsed.data.periode_id ?? null,
        is_active: parsed.data.is_active ?? true,
        created_by: user.userId,
      },
      include: {
        periode: { select: { id: true, tahun: true } },
      },
    });
    return R.created(serialize(data), 'Instrumen berhasil dibuat');
  } catch (e) { return R.serverError(e); }
}
