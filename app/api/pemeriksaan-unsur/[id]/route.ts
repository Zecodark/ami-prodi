import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const schema = z.object({
  isi_unsur: z.string().min(1).optional(),
  urutan: z.coerce.number().int().positive().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const updateData: any = {};
    if (parsed.data.isi_unsur !== undefined) updateData.isi_unsur = parsed.data.isi_unsur;
    if (parsed.data.urutan !== undefined) updateData.urutan = parsed.data.urutan;

    const data = await prisma.pemeriksaanUnsur.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
    return R.ok(serialize(data), 'Pemeriksaan unsur berhasil diperbarui');
  } catch (e: any) {
    if (e.code === 'P2025') return R.notFound();
    return R.serverError(e);
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const { id } = await params;
    await prisma.pemeriksaanUnsur.delete({ where: { id: BigInt(id) } });
    return R.ok(null, 'Pemeriksaan unsur berhasil dihapus');
  } catch (e: any) {
    if (e.code === 'P2025') return R.notFound();
    return R.serverError(e);
  }
}
