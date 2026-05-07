import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const schema = z.object({
  periode_id: z.coerce.bigint().optional(),
  nama_instrumen: z.string().min(1, 'Nama instrumen wajib diisi').optional(),
  is_active: z.boolean().optional(),
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
    if (parsed.data.nama_instrumen) updateData.nama_instrumen = parsed.data.nama_instrumen;
    if (parsed.data.periode_id !== undefined) updateData.periode_id = parsed.data.periode_id ?? null;
    if (parsed.data.is_active !== undefined) updateData.is_active = parsed.data.is_active;

    const data = await prisma.instrumen.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: { periode: true },
    });
    return R.ok(serialize(data), 'Instrumen berhasil diperbarui');
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
    await prisma.instrumen.delete({ where: { id: BigInt(id) } });
    return R.ok(null, 'Instrumen berhasil dihapus');
  } catch (e: any) {
    if (e.code === 'P2025') return R.notFound();
    return R.serverError(e);
  }
}
