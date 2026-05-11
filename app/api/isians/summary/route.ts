import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

// GET /api/isians/summary
export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'kaprodi', 'admin');
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const where: Record<string, unknown> = {};
    if (searchParams.get('periode_id')) where.periode_id = BigInt(searchParams.get('periode_id')!);
    if (searchParams.get('prodi_id')) where.prodi_id = BigInt(searchParams.get('prodi_id')!);

    const [total, proses, valid, revisi] = await Promise.all([
      prisma.isianAmi.count({ where }),
      prisma.isianAmi.count({ where: { ...where, status: 'proses' } }),
      prisma.isianAmi.count({ where: { ...where, status: 'valid' } }),
      prisma.isianAmi.count({ where: { ...where, status: 'revisi' } }),
    ]);

    const perDosen = await prisma.isianAmi.groupBy({
      by: ['dosen_id'],
      where,
      _count: { id: true },
    });

    return R.ok(
      serialize({ total, proses, valid, revisi, total_dosen: perDosen.length })
    );
  } catch (e) { return R.serverError(e); }
}
