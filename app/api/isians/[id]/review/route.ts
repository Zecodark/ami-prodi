import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const reviewSchema = z.object({
  status: z.enum(['valid', 'revisi']),
  catatan_kaprodi: z.string().optional(),
});

const isianInclude = {
  butir_instrumen: {
    select: {
      id: true, kode_butir: true, deskripsi_area_audit: true,
      instrumen: { select: { id: true, nama_instrumen: true } },
    },
  },
  dosen: {
    select: {
      id: true, nip: true, nama_lengkap: true,
      prodi: { select: { id: true, nama_prodi: true } },
    },
  },
  periode: { select: { id: true, tahun: true } },
};

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { error } = guard(request, 'kaprodi');
    if (error) return error;

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const { id } = await params;
    const isian = await prisma.isian.findUnique({ where: { id: BigInt(id) } });
    if (!isian) return R.notFound();

    const data = await prisma.isian.update({
      where: { id: BigInt(id) },
      data: { status: parsed.data.status, catatan_kaprodi: parsed.data.catatan_kaprodi ?? null },
      include: isianInclude,
    });
    
    const msg = parsed.data.status === 'valid' ? 'Isian berhasil diapprove' : 'Isian dikembalikan untuk revisi';
    return R.ok(serialize(data), msg);
  } catch (e) { return R.serverError(e); }
}
