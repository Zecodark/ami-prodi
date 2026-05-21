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
  pemeriksaan_unsur: {
    include: {
      deskripsi_area: {
        include: {
          kode_ami: {
            include: {
              kriteria: {
                include: {
                  instrumen: { select: { id: true, nama_instrumen: true } },
                },
              },
            },
          },
        },
      },
    },
  },
  dosen: {
    select: {
      id: true, nip: true, nama_lengkap: true,
      prodi: { select: { id: true, nama_prodi: true, jenjang: true } },
    },
  },
  periode: { select: { id: true, tahun: true } },
  prodi: { select: { id: true, nama_prodi: true, jenjang: true } },
  bukti_files: true,
  review_logs: {
    orderBy: { created_at: 'desc' as const },
    take: 5,
  },
};

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { user, error } = guard(request, 'kaprodi');
    if (error) return error;

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const { id } = await params;
    const isian = await prisma.isianAmi.findUnique({ where: { id: Number(id) } });
    if (!isian) return R.notFound();

    // Pastikan kaprodi hanya bisa review isian dari prodi-nya sendiri
    const kaprodiDosen = await prisma.dosen.findUnique({
      where: { user_id: user.userId },
      select: { prodi_id: true },
    });
    if (kaprodiDosen?.prodi_id && isian.prodi_id && kaprodiDosen.prodi_id !== isian.prodi_id) {
      return R.forbidden('Anda hanya bisa mereview isian dari prodi Anda sendiri');
    }

    // Update isian dan buat review log dalam transaction
    const data = await prisma.$transaction(async (tx) => {
      const updated = await tx.isianAmi.update({
        where: { id: Number(id) },
        data: {
          status: parsed.data.status,
          catatan_kaprodi: parsed.data.catatan_kaprodi ?? null,
          reviewed_by: user.userId,
          reviewed_at: new Date(),
        },
        include: isianInclude,
      });
      await tx.isianReviewLog.create({
        data: {
          isian_id: Number(id),
          reviewer_id: user.userId,
          status_sebelum: isian.status,
          status_sesudah: parsed.data.status,
          catatan: parsed.data.catatan_kaprodi ?? null,
        },
      });
      return updated;
    });

    const msg = parsed.data.status === 'valid' ? 'Isian berhasil divalidkan' : 'Isian dikembalikan untuk revisi';
    return R.ok(serialize(data), msg);
  } catch (e) { return R.serverError(e); }
}
