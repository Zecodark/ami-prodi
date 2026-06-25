import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const updateSchema = z.object({
  instrumen_id: z.coerce.number(),
  assignments: z.array(z.object({
    prodi_id: z.coerce.number(),
    is_active: z.boolean(),
    is_assigned: z.boolean() // If false, we delete it.
  }))
});

export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const instrumenId = request.nextUrl.searchParams.get('instrumen_id');
    if (!instrumenId) return R.badRequest('instrumen_id wajib diisi');

    const prodis = await prisma.prodi.findMany({
      include: {
        instrumen_links: {
          where: { instrumen_id: Number(instrumenId) }
        }
      },
      orderBy: { nama_prodi: 'asc' }
    });

    const data = prodis.map(p => ({
      prodi_id: p.id,
      nama_prodi: p.nama_prodi,
      is_active: p.instrumen_links.length > 0 ? p.instrumen_links[0].is_active : false,
      is_assigned: p.instrumen_links.length > 0
    }));

    return R.ok(serialize(data));
  } catch (e) {
    return R.serverError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return R.badRequest('Validasi gagal', parsed.error.flatten());

    const { instrumen_id, assignments } = parsed.data;

    // Lakukan dalam transaction
    await prisma.$transaction(async (tx) => {
      for (const assignment of assignments) {
        if (assignment.is_assigned) {
          // Upsert record
          await tx.instrumenProdi.upsert({
            where: {
              instrumen_id_prodi_id: {
                instrumen_id,
                prodi_id: assignment.prodi_id
              }
            },
            update: {
              is_active: assignment.is_active
            },
            create: {
              instrumen_id,
              prodi_id: assignment.prodi_id,
              is_active: assignment.is_active
            }
          });
        } else {
          // Delete record jika ada
          try {
            await tx.instrumenProdi.delete({
              where: {
                instrumen_id_prodi_id: {
                  instrumen_id,
                  prodi_id: assignment.prodi_id
                }
              }
            });
          } catch (e) {
            // Ignore jika tidak ditemukan
          }
        }
      }
    });

    return R.ok({}, 'Pengaturan prodi berhasil disimpan');
  } catch (e) {
    return R.serverError(e);
  }
}
