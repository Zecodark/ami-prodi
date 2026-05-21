import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const createSchema = z.object({
  tahun: z.string().min(4, 'Format tahun: 2024/2025').max(10, 'Tahun maksimal 10 karakter'),
  is_active: z.boolean().default(false),
  tanggal_mulai: z.string().optional().nullable(),
  tanggal_selesai: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin', 'dosen', 'kaprodi');
    if (error) return error;

    const isActive = request.nextUrl.searchParams.get('is_active');
    const where: any = {};
    if (isActive !== null) where.is_active = isActive === 'true';

    const data = await prisma.periode.findMany({
      where,
      include: {
        _count: { select: { instrumens: true, isians: true } },
      },
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

    const { tahun, is_active, tanggal_mulai, tanggal_selesai } = parsed.data;

    if (is_active) {
      // Nonaktifkan semua periode lain dulu, lalu buat yang baru
      const [_, data] = await prisma.$transaction([
        prisma.periode.updateMany({ data: { is_active: false } }),
        prisma.periode.create({
          data: {
            tahun,
            is_active: true,
            tanggal_mulai: tanggal_mulai ? new Date(tanggal_mulai) : null,
            tanggal_selesai: tanggal_selesai ? new Date(tanggal_selesai) : null,
          },
        }),
      ]);
      return R.created(serialize(data), 'Periode berhasil dibuat dan diaktifkan');
    }

    const data = await prisma.periode.create({
      data: {
        tahun,
        is_active: false,
        tanggal_mulai: tanggal_mulai ? new Date(tanggal_mulai) : null,
        tanggal_selesai: tanggal_selesai ? new Date(tanggal_selesai) : null,
      },
    });
    return R.created(serialize(data), 'Periode berhasil dibuat');
  } catch (e) { return R.serverError(e); }
}
