import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const instrumenId = 2; // Instrumen Uji Export
  const targetJenjangs = ['D4', 'STR'];

  const count = await prisma.pemeriksaanUnsur.count({
    where: {
      deskripsi_area: {
        kode_ami: {
          kriteria: { instrumen_id: instrumenId },
          OR: [
            { butir_standars: { none: {} } },
            { butir_standars: { some: { jenjang: { kode_jenjang: { in: targetJenjangs } } } } }
          ]
        }
      }
    }
  });

  return NextResponse.json({ count });
}
