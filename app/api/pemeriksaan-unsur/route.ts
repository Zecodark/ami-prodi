import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const schema = z.object({
  deskripsi_area_id: z.coerce.number(),
  isi_unsur: z.string().min(1, 'Isi unsur wajib diisi'),
  urutan: z.coerce.number().int().positive().default(1),
});

// GET /api/pemeriksaan-unsur?deskripsi_area_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin', 'dosen', 'kaprodi');
    if (error) return error;

    const deskripsiAreaId = request.nextUrl.searchParams.get('deskripsi_area_id');
    const where = deskripsiAreaId ? { deskripsi_area_id: Number(deskripsiAreaId) } : {};

    const data = await prisma.pemeriksaanUnsur.findMany({
      where,
      include: {
        deskripsi_area: {
          select: {
            id: true, deskripsi_area_audit: true,
            kode_ami: { select: { id: true, kode_ami: true } },
          },
        },
      },
      orderBy: { urutan: 'asc' },
    });
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

// POST /api/pemeriksaan-unsur
export async function POST(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const data = await prisma.pemeriksaanUnsur.create({
      data: {
        deskripsi_area_id: parsed.data.deskripsi_area_id,
        isi_unsur: parsed.data.isi_unsur,
        urutan: parsed.data.urutan,
      },
    });
    return R.created(serialize(data), 'Pemeriksaan unsur berhasil dibuat');
  } catch (e) { return R.serverError(e); }
}
