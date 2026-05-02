import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const schema = z.object({
  periode_id: z.coerce.bigint().optional(),
  nama_instrumen: z.string().min(1, 'Nama instrumen wajib diisi'),
});

export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const periodeId = request.nextUrl.searchParams.get('periode_id');
    const where = periodeId ? { periode_id: BigInt(periodeId) } : {};

    const data = await prisma.instrumen.findMany({
      where,
      include: {
        periode: { select: { id: true, tahun: true, is_active: true } },
        _count: { select: { butir_instrumens: true } },
      },
      orderBy: { created_at: 'asc' },
    });
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const data = await prisma.instrumen.create({
      data: { nama_instrumen: parsed.data.nama_instrumen, periode_id: parsed.data.periode_id ?? null },
      include: { periode: true },
    });
    return R.created(serialize(data), 'Instrumen berhasil dibuat');
  } catch (e) { return R.serverError(e); }
}
