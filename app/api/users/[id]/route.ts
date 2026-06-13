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
  prodi_id: true,
  dosen: { select: { id: true, nip: true, nama_lengkap: true, status_kepegawaian: true, prodi: { select: { nama_prodi: true } } } },
};

type Ctx = { params: Promise<{ id: string }> };

// GET /api/users/[id]
export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;
    const { id } = await params;
    const data = await prisma.user.findUnique({ where: { id: Number(id) }, select });
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
      role_id: z.coerce.number().nullable().optional(),
      prodi_id: z.coerce.number().nullable().optional(),
      is_active: z.boolean().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const updateData: Record<string, unknown> = {};
    if (parsed.data.email) updateData.email = parsed.data.email;
    if (parsed.data.password) updateData.password = await bcrypt.hash(parsed.data.password, 12);
    if (parsed.data.role_id !== undefined) updateData.role_id = parsed.data.role_id;
    if (parsed.data.is_active !== undefined) updateData.is_active = parsed.data.is_active;
    if (parsed.data.prodi_id !== undefined) updateData.prodi_id = parsed.data.prodi_id;

    // Ambil data user yang ada sekarang untuk tahu role-nya kalau tidak diupdate
    const currentUser = await prisma.user.findUnique({ where: { id: Number(id) } });
    const targetRoleId = parsed.data.role_id !== undefined ? parsed.data.role_id : currentUser?.role_id;
    
    if (targetRoleId) {
      const role = await prisma.role.findUnique({ where: { id: targetRoleId } });
      if (role?.nama_role.toLowerCase() === 'kaprodi') {
        const targetProdiId = parsed.data.prodi_id !== undefined ? parsed.data.prodi_id : currentUser?.prodi_id;
        const targetIsActive = parsed.data.is_active !== undefined ? parsed.data.is_active : currentUser?.is_active;

        // Cek duplicate prodi_id untuk kaprodi aktif selain user ini
        if (targetIsActive && targetProdiId) {
          const existingKaprodi = await prisma.user.findFirst({
            where: {
              id: { not: Number(id) },
              prodi_id: targetProdiId,
              role: { nama_role: 'kaprodi' },
              is_active: true
            }
          });
          
          if (existingKaprodi) {
            return R.badRequest('Prodi ini sudah memiliki akun Kaprodi aktif');
          }
        }
      } else {
        // Jika bukan kaprodi, prodi_id harus diset null (atau dibiarkan tergantung rule, kita set null saja)
        updateData.prodi_id = null;
      }
    }

    const data = await prisma.user.update({ where: { id: Number(id) }, data: updateData, select });
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
    await prisma.user.delete({ where: { id: Number(id) } });
    return R.ok(null, 'User berhasil dihapus');
  } catch (e: any) {
    if (e.code === 'P2025') return R.notFound();
    return R.serverError(e);
  }
}
