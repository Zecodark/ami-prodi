import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const schema = z.object({
  jurusan_id: z.coerce.bigint().optional(),
  nama_prodi: z.string().min(1, 'Nama prodi wajib diisi'),
});

export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;
    const data = await prisma.prodi.findMany({
      include: {
        jurusan: { select: { id: true, nama_jurusan: true } },
        dosens: { select: { id: true, nip: true, nama_lengkap: true } },
      },
      orderBy: { nama_prodi: 'asc' },
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
    
    const data = await prisma.prodi.create({
      data: { nama_prodi: parsed.data.nama_prodi, jurusan_id: parsed.data.jurusan_id ?? null },
      include: { jurusan: true },
    });
    return R.created(serialize(data), 'Prodi berhasil dibuat');
  } catch (e) { return R.serverError(e); }
}
