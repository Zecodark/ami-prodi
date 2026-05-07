import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const createSchema = z.object({
  user_id: z.coerce.bigint().optional(),
  prodi_id: z.coerce.bigint().optional(),
  nip: z.string().min(1, 'NIP wajib diisi'),
  nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  status_kepegawaian: z.string().min(1, 'Status kepegawaian wajib diisi'),
  no_hp: z.string().min(1, 'No HP wajib diisi'),
});

const dosenSelect = {
  id: true, nip: true, nama_lengkap: true, status_kepegawaian: true, no_hp: true, created_at: true, updated_at: true,
  user: { select: { id: true, email: true, role: { select: { nama_role: true } } } },
  prodi: { select: { id: true, nama_prodi: true, jurusan: { select: { nama_jurusan: true } } } },
};

export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;
    
    const data = await prisma.dosen.findMany({ select: dosenSelect, orderBy: { nama_lengkap: 'asc' } });
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
    
    const { nip, nama_lengkap, status_kepegawaian, no_hp, user_id, prodi_id } = parsed.data;
    const data = await prisma.dosen.create({
      data: { nip, nama_lengkap, status_kepegawaian, no_hp, user_id: user_id ?? null, prodi_id: prodi_id ?? null },
      select: dosenSelect,
    });
    return R.created(serialize(data), 'Dosen berhasil dibuat');
  } catch (e: any) {
    if (e.code === 'P2002') return R.badRequest('NIP atau user_id sudah digunakan');
    return R.serverError(e);
  }
}
