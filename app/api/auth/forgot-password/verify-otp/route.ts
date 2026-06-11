import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/app/lib/prisma';
import * as R from '@/app/lib/response';

const verifySchema = z.object({
  email: z.string().email('Format email tidak valid'),
  otp: z.string().length(6, 'OTP harus 6 digit'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return R.badRequest('Validasi gagal', parsed.error.flatten());
    }

    const { email, otp } = parsed.data;

    // Cari OTP terbaru untuk email ini yang belum dipakai
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        email,
        used_at: null,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!otpRecord) {
      return R.badRequest('Kode OTP tidak valid atau kedaluwarsa.');
    }

    // Pastikan belum expired
    if (new Date() > otpRecord.expires_at) {
      return R.badRequest('Kode OTP sudah kedaluwarsa.');
    }

    // Cek batas percobaan
    if (otpRecord.attempt_count >= 5) {
      return R.badRequest('Terlalu banyak percobaan salah. Silakan minta OTP baru.');
    }

    // Bandingkan OTP
    const isValid = await bcrypt.compare(otp, otpRecord.otp_hash);

    if (!isValid) {
      // Tambah attempt count
      await prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { attempt_count: otpRecord.attempt_count + 1 },
      });
      return R.badRequest('Kode OTP salah.');
    }

    // OTP valid. Buat temporary reset token berlaku 15 menit
    const resetToken = jwt.sign(
      { email, otpId: otpRecord.id },
      process.env.JWT_SECRET || 'secretkey-ami-prodi-12345',
      { expiresIn: '15m' }
    );

    return R.ok({
      message: 'OTP valid. Silakan buat password baru.',
      reset_token: resetToken,
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return R.serverError(error);
  }
}
