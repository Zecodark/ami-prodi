import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const reviewSchema = z.object({
  status: z.enum(['valid', 'revisi']),
  catatan_kaprodi: z.string().nullable().optional(),
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
    
    // Allow review for 'proses' and 'valid' status
    if (isian.status !== 'proses' && isian.status !== 'valid') {
      const statusMessages: Record<string, string> = {
        'draft': 'Isian ini masih draft dan belum disubmit oleh dosen',
        'revisi': 'Isian ini menunggu perbaikan dari dosen. Dosen harus submit ulang sebelum dapat direview lagi',
        'superseded': 'Isian ini sudah digantikan oleh isian valid lain',
      };
      return R.badRequest(
        statusMessages[isian.status] || `Isian dengan status "${isian.status}" tidak dapat direview`
      );
    }

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
      // Check if there's already a valid isian for this unsur in the same prodi
      if (parsed.data.status === 'valid') {
        const existingValid = await tx.isianAmi.findFirst({
          where: {
            pemeriksaan_unsur_id: isian.pemeriksaan_unsur_id,
            periode_id: isian.periode_id,
            prodi_id: isian.prodi_id,
            status: 'valid',
            id: { not: Number(id) }, // Exclude current isian
          },
        });

        if (existingValid) {
          return R.badRequest(
            'Unsur ini sudah memiliki isian yang valid dari dosen lain di prodi yang sama. Hanya satu isian valid yang diperbolehkan per unsur per prodi.'
          );
        }
      }

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

      // FIRST VALID WINS: If this isian is validated, supersede all other pending/revisi isian
      // for the same unsur in the same prodi
      if (parsed.data.status === 'valid') {
        const supersededIsians = await tx.isianAmi.findMany({
          where: {
            pemeriksaan_unsur_id: isian.pemeriksaan_unsur_id,
            periode_id: isian.periode_id,
            prodi_id: isian.prodi_id,
            id: { not: Number(id) },
            status: { in: ['proses', 'revisi', 'draft'] },
          },
          select: { id: true, dosen_id: true },
        });

        if (supersededIsians.length > 0) {
          // Update status ke 'superseded' dan buat review log
          for (const si of supersededIsians) {
            await tx.isianAmi.update({
              where: { id: si.id },
              data: {
                status: 'superseded',
                catatan_kaprodi: `Isian ini telah digantikan oleh isian valid dari dosen lain (ID: ${id}). Tidak perlu direvisi lagi.`,
                reviewed_by: user.userId,
                reviewed_at: new Date(),
              },
            });

            await tx.isianReviewLog.create({
              data: {
                isian_id: si.id,
                reviewer_id: user.userId,
                status_sebelum: 'proses',
                status_sesudah: 'superseded',
                catatan: `Auto-superseded karena ada isian valid lain (ID: ${id})`,
              },
            });
          }
        }
      }

      return updated;
    });

    const msg = parsed.data.status === 'valid' ? 'Isian berhasil divalidkan' : 'Isian dikembalikan untuk revisi';
    return R.ok(serialize(data), msg);
  } catch (e) { return R.serverError(e); }
}
