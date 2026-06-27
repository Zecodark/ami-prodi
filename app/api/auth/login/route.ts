import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard, signToken } from '@/app/lib/auth';
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
        prodi: true,
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

    // Cek pengaturan MFA global
    const mfaSetting = await prisma.systemSetting.findUnique({
      where: { key: 'mfa_enabled' }
    });
    const isMfaActive = mfaSetting?.value === 'true';

    if (!isMfaActive) {
      // Langsung login tanpa OTP
      const tokenPayload = {
        userId: user.id.toString(),
        email: user.email,
        roleId: user.role?.id?.toString() || null,
        roleName: user.role?.nama_role || '',
        prodiId: user.prodi?.id?.toString() || user.dosen?.prodi?.id?.toString() || null,
      };
      const token = signToken(tokenPayload);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { last_login_at: new Date() },
      });

      return R.ok(
        serialize({
          require_otp: false,
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
          message: 'Login berhasil',
        })
      );
    }

    // Generate OTP 6 digit
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Set expiration to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Hapus OTP lama yang belum terpakai (opsional, untuk kebersihan)
    await prisma.loginOtp.deleteMany({
      where: { user_id: user.id },
    });

    // Simpan ke DB
    await prisma.loginOtp.create({
      data: {
        user_id: user.id,
        email: user.email,
        otp_hash: otpHash,
        expires_at: expiresAt,
      },
    });

    // Kirim email menggunakan nodemailer
    const nodemailer = await import('nodemailer');
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
      subject: 'Kode OTP Login AMI Prodi',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Verifikasi Login</h2>
          <p>Halo,</p>
          <p>Anda sedang mencoba login ke sistem AMI Prodi.</p>
          <p>Kode OTP Anda adalah: <strong style="font-size: 24px; color: #0a2f6f; letter-spacing: 2px;">${otp}</strong></p>
          <p>Kode ini berlaku selama 5 menit.</p>
          <p>Jika Anda tidak mencoba login, mohon amankan akun Anda.</p>
          <br/>
          <p>Salam,</p>
          <p><strong>Sistem AMI Prodi</strong></p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error('Gagal mengirim email OTP Login:', err);
      return R.serverError('Gagal mengirim OTP ke email');
    }

    return R.ok(
      serialize({
        require_otp: true,
        email: user.email,
        message: 'Kode OTP telah dikirim ke email Anda',
      }),
    );
  } catch (e) {
    console.error(e);
    return R.serverError(e);
  }
}
