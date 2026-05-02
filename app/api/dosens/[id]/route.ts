import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const updateSchema = z.object({
  user_id: z.coerce.bigint().optional(),
  prodi_id: z.coerce.bigint().optional(),
  nip: z.string().min(1).optional(),
  nama_lengkap: z.string().min(1).optional(),
});

const dosenSelect = {
  id: true, nip: true, nama_lengkap: true, created_at: true, updated_at: true,
  user: { select: { id: true, email: true, role: { select: { nama_role: true } } } },
  prodi: { select: { id: true, nama_prodi: true, jurusan: { select: { nama_jurusan: true } } } },
};

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;
    
    const { id } = await params;
    const data = await prisma.dosen.findUnique({
      where: { id: BigInt(id) }, select: dosenSelect,
    });
    if (!data) return R.notFound();
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;
    
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());
    
    const data = await prisma.dosen.update({
      where: { id: BigInt(id) }, data: parsed.data, select: dosenSelect,
    });
    return R.ok(serialize(data), 'Dosen berhasil diperbarui');
  } catch (e: any) {
    if (e.code === 'P2025') return R.notFound();
    if (e.code === 'P2002') return R.badRequest('NIP sudah digunakan');
    return R.serverError(e);
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;
    
    const { id } = await params;
    await prisma.dosen.delete({ where: { id: BigInt(id) } });
    return R.ok(null, 'Dosen berhasil dihapus');
  } catch (e: any) {
    if (e.code === 'P2025') return R.notFound();
    return R.serverError(e);
  }
}
