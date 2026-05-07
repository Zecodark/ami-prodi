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
  is_active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin', 'dosen', 'kaprodi');
    if (error) return error;

    const periodeId = request.nextUrl.searchParams.get('periode_id');
    const isActive = request.nextUrl.searchParams.get('is_active');
    
    const where: any = {};
    if (periodeId) {
      where.OR = [
        { periode_id: BigInt(periodeId) },
        { periode_id: null }
      ];
    }
    if (isActive !== null) where.is_active = isActive === 'true';

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
      data: { 
        nama_instrumen: parsed.data.nama_instrumen, 
        periode_id: parsed.data.periode_id ?? null,
        is_active: parsed.data.is_active ?? true
      },
      include: { periode: true },
    });
    return R.created(serialize(data), 'Instrumen berhasil dibuat');
  } catch (e) { return R.serverError(e); }
}
