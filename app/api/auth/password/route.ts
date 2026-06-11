import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const passwordSchema = z.object({
  passwordLama: z.string().min(1, 'Password lama wajib diisi'),
  passwordBaru: z.string().min(6, 'Password baru minimal 6 karakter'),
});

export async function POST(request: NextRequest) {
  try {
    const { user, error } = guard(request);
    if (error) return error;

    const body = await request.json();
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const { passwordLama, passwordBaru } = parsed.data;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });
    if (!dbUser) return R.notFound('User tidak ditemukan');

    const valid = await bcrypt.compare(passwordLama, dbUser.password);
    if (!valid) return R.unauthorized('Password lama tidak sesuai');

    const hashedPassword = await bcrypt.hash(passwordBaru, 10);

    await prisma.user.update({
      where: { id: user.userId },
      data: { password: hashedPassword },
    });

    return R.ok({ message: 'Password berhasil diubah' });
  } catch (e) {
    return R.serverError(e);
  }
}
