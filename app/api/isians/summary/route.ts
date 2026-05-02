import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'kaprodi');
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const where: Record<string, unknown> = {};
    if (searchParams.get('periode_id')) where.periode_id = BigInt(searchParams.get('periode_id')!);

    const [total, proses, valid, revisi] = await Promise.all([
      prisma.isian.count({ where }),
      prisma.isian.count({ where: { ...where, status: 'proses' } }),
      prisma.isian.count({ where: { ...where, status: 'valid' } }),
      prisma.isian.count({ where: { ...where, status: 'revisi' } }),
    ]);

    const perDosen = await prisma.isian.groupBy({ by: ['dosen_id'], where, _count: { id: true } });

    return R.ok(serialize({ total, proses, valid, revisi, total_dosen: perDosen.length }));
  } catch (e) { return R.serverError(e); }
}
