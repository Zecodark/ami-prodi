import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { prisma } from '@/app/lib/prisma';
import * as R from '@/app/lib/response';

const requestSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return R.badRequest('Validasi gagal', parsed.error.flatten());
    }

    const { email } = parsed.data;

    // Cari user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && user.is_active) {
      // Generate OTP 6 digit
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Hash OTP
      const salt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash(otp, salt);

      // Set expiration to 10 minutes from now
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Simpan ke DB
      await prisma.passwordResetOtp.create({
        data: {
          user_id: user.id,
          email: user.email,
          otp_hash: otpHash,
          expires_at: expiresAt,
        },
      });

      // Kirim email menggunakan nodemailer
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE === 'true' || true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"Sistem AMI Prodi" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Kode OTP Reset Password AMI Prodi',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Reset Password</h2>
            <p>Halo,</p>
            <p>Kami menerima permintaan reset password untuk akun AMI Prodi Anda.</p>
            <p>Kode OTP Anda adalah: <strong style="font-size: 24px; color: #0a2f6f; letter-spacing: 2px;">${otp}</strong></p>
            <p>Kode ini berlaku selama 10 menit.</p>
            <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
            <br/>
            <p>Salam,</p>
            <p><strong>Sistem AMI Prodi</strong></p>
          </div>
        `,
      };

      // Tunggu proses pengiriman email selesai sebelum me-return respon
      // (Pada lingkungan Next.js, proses background seringkali di-kill jika tidak di-await)
      try {
        await transporter.sendMail(mailOptions);
      } catch (err) {
        console.error('Gagal mengirim email OTP:', err);
      }
    }

    // Selalu kembalikan respon sukses yang sama untuk keamanan
    return R.ok({ message: 'Jika email terdaftar, kode OTP akan dikirim.' });
  } catch (error) {
    console.error('Request OTP Error:', error);
    return R.serverError(error);
  }
}
