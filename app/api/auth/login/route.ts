import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        dosen: {
          include: {
            prodi: { select: { id: true, nama_prodi: true, jenjang: true } },
          },
        },
      },
    });
    if (!user) return R.unauthorized('Email atau password salah');
    if (!user.is_active) return R.unauthorized('Akun tidak aktif, hubungi administrator');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return R.unauthorized('Email atau password salah');

    // Update last_login_at
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const { signToken } = await import('@/app/lib/auth');
    const token = signToken({
      userId: user.id.toString(),
      email: user.email,
      roleId: user.role_id?.toString() ?? null,
      roleName: user.role?.nama_role ?? '',
      prodiId: user.prodi_id?.toString() ?? null,
    });

    return R.ok(
      serialize({
        token,
        user: {
          id: user.id,
          email: user.email,
          is_active: user.is_active,
          role: user.role?.nama_role ?? null,
          dosen: user.dosen
            ? {
                id: user.dosen.id,
                nip: user.dosen.nip,
                nama_lengkap: user.dosen.nama_lengkap,
                prodi: user.dosen.prodi,
              }
            : null,
        },
      }),
    );
  } catch (e) {
    return R.serverError(e);
  }
}
