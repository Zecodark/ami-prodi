import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const verifySchema = z.object({
  email: z.string().email('Email tidak valid'),
  otp: z.string().length(6, 'OTP harus 6 digit'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const { email, otp } = parsed.data;

    // Ambil data OTP terakhir untuk email tersebut yang belum dipakai dan belum expired
    const loginOtp = await prisma.loginOtp.findFirst({
      where: {
        email,
        used_at: null,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          include: {
            role: true,
            prodi: true,
            dosen: {
              include: {
                prodi: { select: { id: true, nama_prodi: true, jenjang: true } },
              },
            },
          },
        },
      },
    });

    if (!loginOtp) {
      return R.unauthorized('Kode OTP tidak valid atau sudah kadaluarsa');
    }

    // Tambahkan count attempt (opsional untuk security)
    await prisma.loginOtp.update({
      where: { id: loginOtp.id },
      data: { attempt_count: loginOtp.attempt_count + 1 },
    });

    if (loginOtp.attempt_count >= 5) {
      return R.unauthorized('Terlalu banyak percobaan. Silakan login kembali untuk mendapatkan OTP baru.');
    }

    // Verifikasi hash OTP
    const valid = await bcrypt.compare(otp, loginOtp.otp_hash);
    if (!valid) {
      return R.unauthorized('Kode OTP salah');
    }

    // Tandai OTP sudah digunakan
    await prisma.loginOtp.update({
      where: { id: loginOtp.id },
      data: { used_at: new Date() },
    });

    const user = loginOtp.user;

    if (!user.is_active) return R.unauthorized('Akun tidak aktif, hubungi administrator');

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
      prodiId: (user.prodi_id ?? user.dosen?.prodi_id)?.toString() ?? null,
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
    console.error(e);
    return R.serverError(e);
  }
}
