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
  dosen: { select: { id: true, nip: true, nama_lengkap: true } },
};

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;
    const data = await prisma.user.findMany({ select, orderBy: { created_at: 'desc' } });
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
      email: z.string().email(),
      password: z.string().min(6, 'Password minimal 6 karakter'),
      role_id: z.coerce.bigint().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const hashed = await bcrypt.hash(parsed.data.password, 12);
    const data = await prisma.user.create({
      data: { email: parsed.data.email, password: hashed, role_id: parsed.data.role_id ?? null },
      select,
    });
    return R.created(serialize(data), 'User berhasil dibuat');
  } catch (e: any) {
    if (e.code === 'P2002') return R.badRequest('Email sudah digunakan');
    return R.serverError(e);
  }
}
