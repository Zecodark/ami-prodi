import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const schema = z.object({
  kriteria_id: z.coerce.number(),
  kode_ami: z.string().min(1, 'Kode AMI wajib diisi'),
  urutan: z.coerce.number().int().positive().default(1),
});

// GET /api/kode-ami?kriteria_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin', 'dosen', 'kaprodi');
    if (error) return error;

    const kriteriaId = request.nextUrl.searchParams.get('kriteria_id');
    const where = kriteriaId ? { kriteria_id: Number(kriteriaId) } : {};

    const data = await prisma.kodeAmi.findMany({
      where,
      include: {
        kriteria: { select: { id: true, kode_kriteria: true, nama_kriteria: true } },
        butir_standars: { include: { jenjang: true } },
        deskripsi_areas: {
          include: { pemeriksaan_unsurs: { orderBy: { urutan: 'asc' } } },
          orderBy: { urutan: 'asc' },
        },
      },
      orderBy: { urutan: 'asc' },
    });
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

// POST /api/kode-ami
export async function POST(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const data = await prisma.kodeAmi.create({
      data: {
        kriteria_id: parsed.data.kriteria_id,
        kode_ami: parsed.data.kode_ami,
        urutan: parsed.data.urutan,
      },
    });
    return R.created(serialize(data), 'Kode AMI berhasil dibuat');
  } catch (e: any) {
    if (e.code === 'P2002') return R.badRequest('Kode AMI sudah ada di kriteria ini');
    return R.serverError(e);
  }
}
