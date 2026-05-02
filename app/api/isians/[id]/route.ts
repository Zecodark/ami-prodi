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
  butir_id: z.coerce.bigint(),
  periode_id: z.coerce.bigint(),
  judul_dokumen: z.string().min(1),
  ketersediaan_standar: z.enum(['ada', 'tidak_ada']).default('tidak_ada'),
  dokumen: z.enum(['ada', 'tidak_ada']).default('tidak_ada'),
  pencapaian_standar_spt_pt: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
  pencapaian_standar_sn_dikti: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
  lokal: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
  nasional: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
  internasional: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
  bukti_link: z.string().url().optional().or(z.literal('')),
  tahun_pelaksanaan: z.string().length(4),
  capaian: z.string().optional(),
  keterangan: z.string().optional(),
}).partial();

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

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { user, error } = guard(request, 'dosen', 'kaprodi');
    if (error) return error;

    const { id } = await params;
    const data = await prisma.isian.findUnique({ where: { id: BigInt(id) }, include: isianInclude });
    if (!data) return R.notFound();

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
    const isian = await prisma.isian.findUnique({ where: { id: BigInt(id) } });
    if (!isian) return R.notFound();
    if (isian.dosen_id !== dosen.id) return R.forbidden();
    if (isian.status === 'valid') return R.badRequest('Isian yang sudah valid tidak dapat diedit');

    const formData = await request.formData();
    const dataObj: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (key !== 'bukti_dokumen') dataObj[key] = value;
    });

    const parsed = updateSchema.safeParse(dataObj);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    let bukti_dokumen_name: string | undefined;
    const file = formData.get('bukti_dokumen') as File | null;
    
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.name);
      bukti_dokumen_name = `dokumen-${uniqueSuffix}${ext}`;
      
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, bukti_dokumen_name), buffer);
    }

    const updateData: Record<string, unknown> = { ...parsed.data, status: 'proses' };
    if (bukti_dokumen_name) updateData.bukti_dokumen = bukti_dokumen_name;
    if (parsed.data.bukti_link === '') updateData.bukti_link = null;

    const data = await prisma.isian.update({
      where: { id: BigInt(id) }, data: updateData, include: isianInclude,
    });
    return R.ok(serialize(data), 'Isian berhasil diperbarui');
  } catch (e) { return R.serverError(e); }
}
