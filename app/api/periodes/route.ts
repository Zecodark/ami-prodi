import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const createSchema = z.object({
  tahun: z.string().min(4, 'Format tahun: 2024/2025'),
  is_active: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const data = await prisma.periodeAmi.findMany({
      include: { _count: { select: { instrumens: true, isians: true } } },
      orderBy: { tahun: 'desc' },
    });
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const data = await prisma.periodeAmi.create({ data: parsed.data });
    return R.created(serialize(data), 'Periode AMI berhasil dibuat');
  } catch (e) { return R.serverError(e); }
}
