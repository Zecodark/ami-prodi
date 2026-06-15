import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const schema = z.object({
  jurusan_id: z.coerce.number().optional().nullable(),
  nama_prodi: z.string().min(1, 'Nama prodi wajib diisi'),
  jenjang: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin', 'kaprodi');
    if (error) return error;

    const jurusanId = request.nextUrl.searchParams.get('jurusan_id');
    const where = jurusanId ? { jurusan_id: Number(jurusanId) } : {};

    const data = await prisma.prodi.findMany({
      where,
      include: {
        jurusan: { select: { id: true, nama_jurusan: true } },
        dosens: { select: { id: true, nip: true, nama_lengkap: true } },
        _count: { select: { dosens: true } },
      },
      orderBy: [{ jenjang: 'asc' }, { nama_prodi: 'asc' }],
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
      data: {
        nama_prodi: parsed.data.nama_prodi,
        jurusan_id: parsed.data.jurusan_id ?? null,
        jenjang: parsed.data.jenjang ?? null,
      },
      include: { jurusan: true },
    });
    return R.created(serialize(data), 'Prodi berhasil dibuat');
  } catch (e: any) {
    if (e.code === 'P2002') return R.badRequest('Nama prodi sudah ada di jurusan ini');
    return R.serverError(e);
  }
}
