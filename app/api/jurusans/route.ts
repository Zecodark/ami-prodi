import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const schema = z.object({ nama_jurusan: z.string().min(1, 'Nama jurusan wajib diisi') });

export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;
    const data = await prisma.jurusan.findMany({
      include: { prodis: { select: { id: true, nama_prodi: true } } },
      orderBy: { nama_jurusan: 'asc' },
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

    const data = await prisma.jurusan.create({ data: parsed.data });
    return R.created(serialize(data), 'Jurusan berhasil dibuat');
  } catch (e) { return R.serverError(e); }
}
