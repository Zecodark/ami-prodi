import { NextRequest } from 'next/server';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const createSchema = z.object({
  pemeriksaan_unsur_id: z.coerce.number(),
  periode_id: z.coerce.number(),
  is_draft: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
  judul_dokumen: z.string().min(1).optional().or(z.literal('')),
  ketersediaan_standar: z.enum(['ada', 'tidak_ada']).default('tidak_ada'),
  dokumen: z.enum(['ada', 'tidak_ada']).default('tidak_ada'),
  pencapaian_standar_spt_pt: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
  pencapaian_standar_sn_dikti: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
  daya_saing_lokal: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
  daya_saing_nasional: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
  daya_saing_internasional: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
  bukti_link: z.string().url().optional().or(z.literal('')),
  tahun_pelaksanaan: z.string().length(4).optional().nullable(),
  capaian: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
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
};

export async function GET(request: NextRequest) {
  try {
    const { user, error } = guard(request, 'dosen', 'kaprodi');
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const where: Record<string, unknown> = {};

    if (searchParams.get('periode_id')) where.periode_id = Number(searchParams.get('periode_id')!);
    if (searchParams.get('status')) where.status = searchParams.get('status');
    if (searchParams.get('pemeriksaan_unsur_id'))
      where.pemeriksaan_unsur_id = Number(searchParams.get('pemeriksaan_unsur_id')!);

    if (user.roleName.toLowerCase() === 'dosen') {
      const dosen = await prisma.dosen.findUnique({ where: { user_id: user.userId } });
      if (!dosen) return R.notFound('Profil dosen tidak ditemukan');
      // Dosen hanya bisa melihat isian dari prodinya sendiri
      where.prodi_id = dosen.prodi_id;
      // Jika ingin filter dosen tertentu
      if (searchParams.get('dosen_id')) where.dosen_id = Number(searchParams.get('dosen_id')!);
    } else {
      // Kaprodi — hanya bisa lihat isian dari prodi-nya sendiri
      const kaprodiDosen = await prisma.dosen.findUnique({
        where: { user_id: user.userId },
        select: { prodi_id: true },
      });
      if (kaprodiDosen?.prodi_id) {
        where.prodi_id = kaprodiDosen.prodi_id;
      }
      if (searchParams.get('dosen_id')) where.dosen_id = Number(searchParams.get('dosen_id')!);
      if (searchParams.get('prodi_id')) where.prodi_id = Number(searchParams.get('prodi_id')!);
    }

    const data = await prisma.isianAmi.findMany({
      where,
      include: isianInclude,
      orderBy: { updated_at: 'desc' },
    });
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = guard(request, 'dosen');
    if (error) return error;

    const dosen = await prisma.dosen.findUnique({ where: { user_id: user.userId } });
    if (!dosen) return R.forbidden('Profil dosen tidak ditemukan');

    const formData = await request.formData();
    const dataObj: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (key !== 'bukti_file') dataObj[key] = value;
    });

    const parsed = createSchema.safeParse(dataObj);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    // Cek apakah unsur ini aktif (instrumen aktif)
    const unsur = await prisma.pemeriksaanUnsur.findUnique({
      where: { id: parsed.data.pemeriksaan_unsur_id },
      include: {
        deskripsi_area: {
          include: {
            kode_ami: {
              include: { kriteria: { include: { instrumen: true } } },
            },
          },
        },
      },
    });
    if (!unsur) return R.notFound('Pemeriksaan unsur tidak ditemukan');
    if (!unsur.deskripsi_area.kode_ami.kriteria.instrumen.is_active)
      return R.forbidden('Instrumen AMI tidak aktif');

    // Cek apakah sudah ada draft untuk unsur ini
    const existingDraft = await prisma.isianAmi.findFirst({
      where: {
        pemeriksaan_unsur_id: parsed.data.pemeriksaan_unsur_id,
        dosen_id: dosen.id,
        periode_id: parsed.data.periode_id,
        status: 'draft',
      },
    });

    // Cek attempt (hanya untuk non-draft baru)
    const existing = await prisma.isianAmi.findFirst({
      where: {
        pemeriksaan_unsur_id: parsed.data.pemeriksaan_unsur_id,
        dosen_id: dosen.id,
        periode_id: parsed.data.periode_id,
      },
      orderBy: { attempt: 'desc' },
    });
    const attempt = existing ? (existingDraft ? existing.attempt : existing.attempt + 1) : 1;

    // Upload file bukti
    let buktiFIleData: { original_name: string; file_name: string; file_path: string; mime_type?: string; file_size?: number } | null = null;
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
      buktiFIleData = {
        original_name: file.name.slice(0, 50),
        file_name,
        file_path,
        mime_type: file.type || undefined,
        file_size: Number(file.size),
      };
    }

    const isianPayload = {
      judul_dokumen: parsed.data.judul_dokumen || null,
      ketersediaan_standar: parsed.data.ketersediaan_standar,
      dokumen: parsed.data.dokumen,
      pencapaian_standar_spt_pt: parsed.data.pencapaian_standar_spt_pt,
      pencapaian_standar_sn_dikti: parsed.data.pencapaian_standar_sn_dikti,
      daya_saing_lokal: parsed.data.daya_saing_lokal,
      daya_saing_nasional: parsed.data.daya_saing_nasional,
      daya_saing_internasional: parsed.data.daya_saing_internasional,
      bukti_link: parsed.data.bukti_link || null,
      tahun_pelaksanaan: parsed.data.tahun_pelaksanaan || null,
      capaian: parsed.data.capaian || null,
      keterangan: parsed.data.keterangan || null,
      status: parsed.data.is_draft ? 'draft' as const : 'proses' as const,
      submitted_at: parsed.data.is_draft ? null : new Date(),
    };

    let data;
    if (existingDraft) {
      // Update draft yang sudah ada
      data = await prisma.isianAmi.update({
        where: { id: existingDraft.id },
        data: {
          ...isianPayload,
          bukti_files: buktiFIleData
            ? { create: { ...buktiFIleData, uploaded_by: user.userId } }
            : undefined,
        },
        include: isianInclude,
      });
      const msg = parsed.data.is_draft ? 'Draft berhasil diperbarui' : 'Isian berhasil disubmit';
      return R.ok(serialize(data), msg);
    } else {
      // Buat baru
      data = await prisma.isianAmi.create({
        data: {
          pemeriksaan_unsur_id: parsed.data.pemeriksaan_unsur_id,
          periode_id: parsed.data.periode_id,
          dosen_id: dosen.id,
          prodi_id: dosen.prodi_id,
          ...isianPayload,
          attempt,
          bukti_files: buktiFIleData
            ? { create: { ...buktiFIleData, uploaded_by: user.userId } }
            : undefined,
        },
        include: isianInclude,
      });
      const msg = parsed.data.is_draft ? 'Draft berhasil disimpan' : 'Isian AMI berhasil disubmit';
      return R.created(serialize(data), msg);
    }
  } catch (e) { return R.serverError(e); }
}
