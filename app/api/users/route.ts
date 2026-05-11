import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const select = {
  id: true, email: true, is_active: true, last_login_at: true, created_at: true, updated_at: true,
  role: { select: { id: true, nama_role: true } },
  dosen: {
    select: {
      id: true, nip: true, nama_lengkap: true, status_kepegawaian: true,
      prodi: { select: { id: true, nama_prodi: true, jenjang: true } },
    },
  },
};

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const isActive = request.nextUrl.searchParams.get('is_active');
    const roleId = request.nextUrl.searchParams.get('role_id');
    const where: any = {};
    if (isActive !== null) where.is_active = isActive === 'true';
    if (roleId) where.role_id = BigInt(roleId);

    const data = await prisma.user.findMany({
      where,
      select,
      orderBy: { created_at: 'desc' },
    });
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

// POST /api/users
export async function POST(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const body = await request.json();
    const schema = z.object({
      email: z.string().email().max(50),
      password: z.string().min(4, 'Password minimal 4 karakter').max(20),
      role_id: z.coerce.bigint().optional().nullable(),
      is_active: z.boolean().default(true),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const hashed = await bcrypt.hash(parsed.data.password, 10);
    const data = await prisma.user.create({
      data: {
        email: parsed.data.email,
        password: hashed,
        role_id: parsed.data.role_id ?? null,
        is_active: parsed.data.is_active,
      },
      select,
    });
    return R.created(serialize(data), 'User berhasil dibuat');
  } catch (e: any) {
    if (e.code === 'P2002') return R.badRequest('Email sudah digunakan');
    return R.serverError(e);
  }
}
