import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const createSchema = z.object({
  user_id: z.coerce.bigint().optional().nullable(),
  prodi_id: z.coerce.bigint().optional().nullable(),
  nip: z.string().min(1, 'NIP wajib diisi'),
  nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  status_kepegawaian: z.string().min(1, 'Status kepegawaian wajib diisi'),
  no_hp: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

const dosenSelect = {
  id: true, nip: true, nama_lengkap: true, status_kepegawaian: true, no_hp: true,
  alamat: true, is_active: true, created_at: true, updated_at: true,
  user: { select: { id: true, email: true, is_active: true, role: { select: { nama_role: true } } } },
  prodi: { select: { id: true, nama_prodi: true, jenjang: true, jurusan: { select: { nama_jurusan: true } } } },
};

export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin', 'kaprodi');
    if (error) return error;

    const prodiId = request.nextUrl.searchParams.get('prodi_id');
    const isActive = request.nextUrl.searchParams.get('is_active');
    const where: any = {};
    if (prodiId) where.prodi_id = BigInt(prodiId);
    if (isActive !== null) where.is_active = isActive === 'true';

    const data = await prisma.dosen.findMany({
      where,
      select: dosenSelect,
      orderBy: { nama_lengkap: 'asc' },
    });
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const { nip, nama_lengkap, status_kepegawaian, no_hp, alamat, user_id, prodi_id, is_active } = parsed.data;
    const data = await prisma.dosen.create({
      data: {
        nip, nama_lengkap, status_kepegawaian,
        no_hp: no_hp ?? null,
        alamat: alamat ?? null,
        user_id: user_id ?? null,
        prodi_id: prodi_id ?? null,
        is_active,
      },
      select: dosenSelect,
    });
    return R.created(serialize(data), 'Dosen berhasil dibuat');
  } catch (e: any) {
    if (e.code === 'P2002') return R.badRequest('NIP atau user_id sudah digunakan');
    return R.serverError(e);
  }
}
