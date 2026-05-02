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

export async function GET(request: NextRequest) {
  try {
    const { user, error } = guard(request, 'dosen', 'kaprodi');
    if (error) return error;

    const { searchParams } = request.nextUrl;
    const where: Record<string, unknown> = {};

    if (searchParams.get('periode_id')) where.periode_id = BigInt(searchParams.get('periode_id')!);
    if (searchParams.get('status')) where.status = searchParams.get('status');
    if (searchParams.get('butir_id')) where.butir_id = BigInt(searchParams.get('butir_id')!);

    if (user.roleName.toLowerCase() === 'dosen') {
      const dosen = await prisma.dosen.findUnique({ where: { user_id: user.userId } });
      if (!dosen) return R.notFound('Profil dosen tidak ditemukan');
      where.dosen_id = dosen.id;
    } else {
      // Kaprodi
      if (searchParams.get('dosen_id')) where.dosen_id = BigInt(searchParams.get('dosen_id')!);
      if (searchParams.get('prodi_id')) {
        where.dosen = { prodi_id: BigInt(searchParams.get('prodi_id')!) };
      }
    }

    const data = await prisma.isian.findMany({ where, include: isianInclude, orderBy: { updated_at: 'desc' } });
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
      if (key !== 'bukti_dokumen') dataObj[key] = value;
    });

    const parsed = createSchema.safeParse(dataObj);
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

    const existing = await prisma.isian.findFirst({
      where: { butir_id: parsed.data.butir_id, dosen_id: dosen.id, periode_id: parsed.data.periode_id },
      orderBy: { attempt: 'desc' },
    });
    const attempt = existing ? existing.attempt + 1 : 1;

    const data = await prisma.isian.create({
      data: {
        ...parsed.data,
        dosen_id: dosen.id,
        attempt,
        bukti_dokumen: bukti_dokumen_name ?? null,
        bukti_link: parsed.data.bukti_link || null,
      },
      include: isianInclude,
    });
    return R.created(serialize(data), 'Isian AMI berhasil disubmit');
  } catch (e) { return R.serverError(e); }
}
