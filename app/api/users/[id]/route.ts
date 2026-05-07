import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const select = {
  id: true, email: true, created_at: true, updated_at: true,
  role: { select: { id: true, nama_role: true } },
  dosen: { select: { id: true, nip: true, nama_lengkap: true, status_kepegawaian: true, prodi: { select: { nama_prodi: true } } } },
};

type Ctx = { params: Promise<{ id: string }> };

// GET /api/users/[id]
export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;
    const { id } = await params;
    const data = await prisma.user.findUnique({ where: { id: BigInt(id) }, select });
    if (!data) return R.notFound();
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

// PUT /api/users/[id]
export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { user, error } = guard(request);
    if (error) return error;
    const { id } = await params;
    if (user.roleName.toLowerCase() !== 'admin' && user.userId.toString() !== id) {
      return R.forbidden('Anda hanya dapat mengubah data Anda sendiri');
    }
    const body = await request.json();
    const schema = z.object({
      email: z.string().email().optional(),
      password: z.string().min(6).optional(),
      role_id: z.coerce.bigint().nullable().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const updateData: Record<string, unknown> = {};
    if (parsed.data.email) updateData.email = parsed.data.email;
    if (parsed.data.password) updateData.password = await bcrypt.hash(parsed.data.password, 12);
    if (parsed.data.role_id !== undefined) updateData.role_id = parsed.data.role_id;

    const data = await prisma.user.update({ where: { id: BigInt(id) }, data: updateData, select });
    return R.ok(serialize(data), 'User berhasil diperbarui');
  } catch (e: any) {
    if (e.code === 'P2025') return R.notFound();
    if (e.code === 'P2002') return R.badRequest('Email sudah digunakan');
    return R.serverError(e);
  }
}

// DELETE /api/users/[id]
export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;
    const { id } = await params;
    await prisma.user.delete({ where: { id: BigInt(id) } });
    return R.ok(null, 'User berhasil dihapus');
  } catch (e: any) {
    if (e.code === 'P2025') return R.notFound();
    return R.serverError(e);
  }
}
