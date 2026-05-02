import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

// GET /api/auth/me
export async function GET(request: NextRequest) {
  try {
    const { user, error } = guard(request);
    if (error) return error;

    const data = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        role: { select: { id: true, nama_role: true } },
        dosen: {
          select: {
            id: true,
            nip: true,
            nama_lengkap: true,
            prodi: { select: { id: true, nama_prodi: true } },
          },
        },
        created_at: true,
      },
    });
    if (!data) return R.notFound('User tidak ditemukan');
    return R.ok(serialize(data));
  } catch (e) {
    return R.serverError(e);
  }
}
