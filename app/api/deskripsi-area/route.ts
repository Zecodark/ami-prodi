import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const schema = z.object({
  kode_ami_id: z.coerce.bigint(),
  deskripsi_area_audit: z.string().min(1, 'Deskripsi area audit wajib diisi'),
  target_standar: z.string().optional().nullable(),
  urutan: z.coerce.number().int().positive().default(1),
});

// GET /api/deskripsi-area?kode_ami_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin', 'dosen', 'kaprodi');
    if (error) return error;

    const kodeAmiId = request.nextUrl.searchParams.get('kode_ami_id');
    const where = kodeAmiId ? { kode_ami_id: BigInt(kodeAmiId) } : {};

    const data = await prisma.deskripsiArea.findMany({
      where,
      include: {
        pemeriksaan_unsurs: { orderBy: { urutan: 'asc' } },
        kode_ami: { select: { id: true, kode_ami: true } },
      },
      orderBy: { urutan: 'asc' },
    });
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

// POST /api/deskripsi-area
export async function POST(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const data = await prisma.deskripsiArea.create({
      data: {
        kode_ami_id: parsed.data.kode_ami_id,
        deskripsi_area_audit: parsed.data.deskripsi_area_audit,
        target_standar: parsed.data.target_standar ?? null,
        urutan: parsed.data.urutan,
      },
      include: { pemeriksaan_unsurs: true },
    });
    return R.created(serialize(data), 'Deskripsi area berhasil dibuat');
  } catch (e) { return R.serverError(e); }
}
