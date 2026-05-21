import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const updateSchema = z.object({
  tahun: z.string().min(4).optional(),
  is_active: z.boolean().optional(),
  tanggal_mulai: z.string().optional().nullable(),
  tanggal_selesai: z.string().optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { error } = guard(request, 'admin', 'dosen', 'kaprodi');
    if (error) return error;

    const { id } = await params;
    const data = await prisma.periode.findUnique({
      where: { id: Number(id) },
      include: {
        _count: { select: { instrumens: true, isians: true } },
      },
    });
    if (!data) return R.notFound();
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const updateData: any = {};
    if (parsed.data.tahun !== undefined) updateData.tahun = parsed.data.tahun;
    if (parsed.data.tanggal_mulai !== undefined)
      updateData.tanggal_mulai = parsed.data.tanggal_mulai ? new Date(parsed.data.tanggal_mulai) : null;
    if (parsed.data.tanggal_selesai !== undefined)
      updateData.tanggal_selesai = parsed.data.tanggal_selesai ? new Date(parsed.data.tanggal_selesai) : null;

    if (parsed.data.is_active === true) {
      // Set all others to false in a transaction
      const [_, data] = await prisma.$transaction([
        prisma.periode.updateMany({ where: { id: { not: Number(id) } }, data: { is_active: false } }),
        prisma.periode.update({ where: { id: Number(id) }, data: { ...updateData, is_active: true } })
      ]);
      return R.ok(serialize(data), 'Periode berhasil diaktifkan dan diperbarui');
    } else {
      if (parsed.data.is_active === false) updateData.is_active = false;
      const data = await prisma.periode.update({
        where: { id: Number(id) },
        data: updateData,
      });
      return R.ok(serialize(data), 'Periode berhasil diperbarui');
    }
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
    await prisma.periode.delete({ where: { id: Number(id) } });
    return R.ok(null, 'Periode berhasil dihapus');
  } catch (e: any) {
    if (e.code === 'P2025') return R.notFound();
    return R.serverError(e);
  }
}
