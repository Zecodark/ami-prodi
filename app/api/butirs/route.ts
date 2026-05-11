/**
 * @deprecated Endpoint ini digantikan oleh:
 *   GET /api/kriteria?instrumen_id=xxx  → daftar kriteria standar beserta kode AMI & unsur
 *   GET /api/kode-ami?kriteria_id=xxx   → daftar kode AMI per kriteria
 *   GET /api/deskripsi-area?kode_ami_id=xxx
 *   GET /api/pemeriksaan-unsur?deskripsi_area_id=xxx
 *
 * Endpoint ini masih berfungsi untuk backward-compat, namun tidak akan dikembangkan lebih lanjut.
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin', 'dosen', 'kaprodi');
    if (error) return error;

    const instrumenId = request.nextUrl.searchParams.get('instrumen_id');

    // Redirect logic: ambil semua pemeriksaan_unsur yang berelasi ke instrumen
    const where = instrumenId
      ? {
          deskripsi_area: {
            kode_ami: { kriteria: { instrumen_id: BigInt(instrumenId) } },
          },
        }
      : {};

    const data = await prisma.pemeriksaanUnsur.findMany({
      where,
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
      orderBy: { urutan: 'asc' },
    });

    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}
