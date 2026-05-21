import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const schema = z.object({
  instrumen_id: z.coerce.number(),
  kode_kriteria: z.string().min(1, 'Kode kriteria wajib diisi'),
  nama_kriteria: z.string().min(1, 'Nama kriteria wajib diisi'),
  deskripsi: z.string().optional().nullable(),
  urutan: z.coerce.number().int().positive().default(1),
});

// GET /api/kriteria?instrumen_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin', 'dosen', 'kaprodi');
    if (error) return error;

    const instrumenId = request.nextUrl.searchParams.get('instrumen_id');
    const where = instrumenId ? { instrumen_id: Number(instrumenId) } : {};

    const data = await prisma.kriteriaStandar.findMany({
      where,
      include: {
        instrumen: { select: { id: true, nama_instrumen: true } },
        kode_amis: {
          include: {
            deskripsi_areas: {
              include: { pemeriksaan_unsurs: { orderBy: { urutan: 'asc' } } },
              orderBy: { urutan: 'asc' },
            },
            butir_standars: {
              include: { jenjang: true },
            },
          },
          orderBy: { urutan: 'asc' },
        },
        _count: { select: { kode_amis: true } },
      },
      orderBy: { urutan: 'asc' },
    });
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

// POST /api/kriteria
export async function POST(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const data = await prisma.kriteriaStandar.create({
      data: {
        instrumen_id: parsed.data.instrumen_id,
        kode_kriteria: parsed.data.kode_kriteria,
        nama_kriteria: parsed.data.nama_kriteria,
        deskripsi: parsed.data.deskripsi ?? null,
        urutan: parsed.data.urutan,
      },
      include: { instrumen: { select: { id: true, nama_instrumen: true } } },
    });
    return R.created(serialize(data), 'Kriteria berhasil dibuat');
  } catch (e: any) {
    if (e.code === 'P2002') return R.badRequest('Kode kriteria sudah ada di instrumen ini');
    return R.serverError(e);
  }
}
