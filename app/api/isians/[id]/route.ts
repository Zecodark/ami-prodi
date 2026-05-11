import { NextRequest } from 'next/server';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const updateSchema = z.object({
  judul_dokumen: z.string().optional().nullable(),
  ketersediaan_standar: z.enum(['ada', 'tidak_ada']).optional(),
  dokumen: z.enum(['ada', 'tidak_ada']).optional(),
  pencapaian_standar_spt_pt: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  pencapaian_standar_sn_dikti: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  daya_saing_lokal: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  daya_saing_nasional: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  daya_saing_internasional: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  bukti_link: z.string().url().optional().or(z.literal('')).nullable(),
  tahun_pelaksanaan: z.string().length(4).optional().nullable(),
  capaian: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
}).partial();

const reviewSchema = z.object({
  status: z.enum(['valid', 'revisi']),
  catatan_kaprodi: z.string().optional().nullable(),
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

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { user, error } = guard(request, 'dosen', 'kaprodi');
    if (error) return error;

    const { id } = await params;
    const data = await prisma.isianAmi.findUnique({ where: { id: BigInt(id) }, include: isianInclude });
    if (!data) return R.notFound();

    // Dosen hanya bisa lihat miliknya
    if (user.roleName.toLowerCase() === 'dosen') {
      const dosen = await prisma.dosen.findUnique({ where: { user_id: user.userId } });
      if (!dosen || data.dosen_id !== dosen.id) return R.forbidden();
    }
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { user, error } = guard(request, 'dosen');
    if (error) return error;

    const dosen = await prisma.dosen.findUnique({ where: { user_id: user.userId } });
    if (!dosen) return R.forbidden('Profil dosen tidak ditemukan');

    const { id } = await params;
    const isian = await prisma.isianAmi.findUnique({ where: { id: BigInt(id) } });
    if (!isian) return R.notFound();
    if (isian.dosen_id !== dosen.id) return R.forbidden();
    if (isian.status === 'valid') return R.badRequest('Isian yang sudah valid tidak dapat diedit');

    const formData = await request.formData();
    const dataObj: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (key !== 'bukti_file') dataObj[key] = value;
    });

    const parsed = updateSchema.safeParse(dataObj);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    // Handle file upload baru
    const file = formData.get('bukti_file') as File | null;
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.name);
      const file_name = `bukti-${uniqueSuffix}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads/bukti');
      await mkdir(uploadDir, { recursive: true });
      const file_path = `/uploads/bukti/${file_name}`;
      await writeFile(path.join(uploadDir, file_name), buffer);
      await prisma.isianBuktiFile.create({
        data: {
          isian_id: BigInt(id),
          original_name: file.name.slice(0, 50),
          file_name,
          file_path,
          mime_type: file.type || null,
          file_size: BigInt(file.size),
          uploaded_by: user.userId,
        },
      });
    }

    const updateData: Record<string, unknown> = { ...parsed.data, status: 'proses' };
    if (parsed.data.bukti_link === '') updateData.bukti_link = null;

    const data = await prisma.isianAmi.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: isianInclude,
    });
    return R.ok(serialize(data), 'Isian berhasil diperbarui');
  } catch (e) { return R.serverError(e); }
}

// PATCH: Untuk review oleh kaprodi (valid/revisi)
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { user, error } = guard(request, 'kaprodi');
    if (error) return error;

    const { id } = await params;
    const isian = await prisma.isianAmi.findUnique({ where: { id: BigInt(id) } });
    if (!isian) return R.notFound();

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const { status, catatan_kaprodi } = parsed.data;

    // Update isian dan buat review log dalam transaction
    const data = await prisma.$transaction(async (tx) => {
      const updated = await tx.isianAmi.update({
        where: { id: BigInt(id) },
        data: {
          status,
          catatan_kaprodi: catatan_kaprodi ?? null,
          reviewed_by: user.userId,
          reviewed_at: new Date(),
        },
        include: isianInclude,
      });
      await tx.isianReviewLog.create({
        data: {
          isian_id: BigInt(id),
          reviewer_id: user.userId,
          status_sebelum: isian.status,
          status_sesudah: status,
          catatan: catatan_kaprodi ?? null,
        },
      });
      return updated;
    });

    return R.ok(serialize(data), `Isian berhasil di-${status}`);
  } catch (e) { return R.serverError(e); }
}
