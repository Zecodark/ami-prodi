import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const schema = z.object({
  instrumen_id: z.coerce.bigint().optional(),
  kode_butir: z.string().min(1, 'Kode butir wajib diisi'),
  deskripsi_area_audit: z.string().min(1, 'Deskripsi area audit wajib diisi'),
  target_standar: z.string().min(1, 'Target standar wajib diisi'),
});

const butirSelect = {
  id: true, kode_butir: true, deskripsi_area_audit: true, target_standar: true,
  created_at: true, updated_at: true,
  instrumen: { select: { id: true, nama_instrumen: true, periode: { select: { tahun: true } } } },
  _count: { select: { isians: true } },
};

export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const instrumenId = request.nextUrl.searchParams.get('instrumen_id');
    const where = instrumenId ? { instrumen_id: BigInt(instrumenId) } : {};

    const data = await prisma.butirInstrumen.findMany({
      where, select: butirSelect, orderBy: { kode_butir: 'asc' },
    });
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const { kode_butir, deskripsi_area_audit, target_standar, instrumen_id } = parsed.data;
    const data = await prisma.butirInstrumen.create({
      data: { kode_butir, deskripsi_area_audit, target_standar, instrumen_id: instrumen_id ?? null },
      select: butirSelect,
    });
    return R.created(serialize(data), 'Butir instrumen berhasil dibuat');
  } catch (e) { return R.serverError(e); }
}
