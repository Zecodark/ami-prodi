import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';
import * as R from '@/app/lib/response';

const resetSchema = z.object({
  reset_token: z.string().min(1, 'Token tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirm_password: z.string().min(8, 'Konfirmasi password minimal 8 karakter'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetSchema.safeParse(body);

    if (!parsed.success) {
      return R.badRequest('Validasi gagal', parsed.error.flatten());
    }

    const { reset_token, password, confirm_password } = parsed.data;

    if (password !== confirm_password) {
      return R.badRequest('Password dan konfirmasi password tidak cocok');
    }

    // Verifikasi Token
    let decoded: any;
    try {
      decoded = jwt.verify(reset_token, process.env.JWT_SECRET || 'secretkey-ami-prodi-12345');
    } catch (e) {
      return R.badRequest('Sesi reset password tidak valid atau sudah kedaluwarsa.');
    }

    const { email, otpId } = decoded;

    // Hash password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password user
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Tandai OTP sebagai sudah digunakan
    if (otpId) {
      await prisma.passwordResetOtp.update({
        where: { id: otpId },
        data: { used_at: new Date() },
      });
    }

    // (Opsional) Hapus OTP lama lainnya untuk user ini
    await prisma.passwordResetOtp.deleteMany({
      where: {
        email,
        used_at: null,
      },
    });

    return R.ok({ message: 'Password berhasil diubah. Silakan login.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return R.serverError(error);
  }
}
