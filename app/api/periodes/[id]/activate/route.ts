import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;
    
    const { id } = await params;
    const targetId = BigInt(id);
    const exists = await prisma.periodeAmi.findUnique({ where: { id: targetId } });
    if (!exists) return R.notFound();

    await prisma.$transaction([
      prisma.periodeAmi.updateMany({ data: { is_active: false } }),
      prisma.periodeAmi.update({ where: { id: targetId }, data: { is_active: true } }),
    ]);
    const data = await prisma.periodeAmi.findUnique({ where: { id: targetId } });
    return R.ok(serialize(data), 'Periode berhasil diaktifkan');
  } catch (e) { return R.serverError(e); }
}
