import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

// Debug endpoint to check prodi links
export async function GET(request: NextRequest) {
  try {
    const { user, error } = guard(request, 'admin', 'dosen', 'kaprodi');
    if (error) return error;

    // Get all prodi
    const allProdi = await prisma.prodi.findMany({
      select: { id: true, nama_prodi: true, jenjang: true },
      orderBy: { nama_prodi: 'asc' },
    });

    // Get active periode and instrumen
    const activePeriode = await prisma.periode.findFirst({
      where: { is_active: true },
      select: { id: true, tahun: true },
      orderBy: { created_at: 'desc' },
    });

    const activeInstrumen = await prisma.instrumen.findFirst({
      where: { periode_id: activePeriode?.id, is_active: true },
      select: { id: true, nama_instrumen: true },
      orderBy: { created_at: 'desc' },
    });

    // Get all prodi links for active instrumen
    const prodiLinks = activeInstrumen
      ? await prisma.instrumenProdi.findMany({
          where: { instrumen_id: activeInstrumen.id },
          include: {
            prodi: { select: { id: true, nama_prodi: true, jenjang: true } },
          },
          orderBy: { prodi_id: 'asc' },
        })
      : [];

    // Get current user's prodi info
    let currentUserProdi = null;
    if (user.roleName === 'dosen') {
      const dosen = await prisma.dosen.findUnique({
        where: { user_id: user.userId },
        include: { prodi: true },
      });
      currentUserProdi = dosen?.prodi;
    } else if (user.roleName === 'kaprodi') {
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        include: { prodi: true, dosen: { include: { prodi: true } } },
      });
      currentUserProdi = userRecord?.prodi || userRecord?.dosen?.prodi;
    }

    // Check if current user's prodi has link
    const userHasLink = currentUserProdi
      ? prodiLinks.some(
          (link) => link.prodi_id === currentUserProdi.id && link.is_active
        )
      : false;

    // Simulate what API instrumens returns
    let apiResult = null;
    if (user.roleName === 'dosen' || user.roleName === 'kaprodi') {
      if (user.prodiId) {
        const linkedInstrumen = await prisma.instrumen.findMany({
          where: {
            periode_id: activePeriode?.id,
            is_active: true,
            prodi_links: {
              some: {
                prodi_id: user.prodiId,
                is_active: true,
              },
            },
          },
          select: { id: true, nama_instrumen: true },
        });
        apiResult = {
          query: 'instrumen with prodi_links filter',
          prodi_id: user.prodiId,
          count: linkedInstrumen.length,
          instrumen: linkedInstrumen,
        };
      }
    }

    return R.ok(
      serialize({
        debug_info: {
          current_user: {
            userId: user.userId,
            email: user.email,
            role: user.roleName,
            prodiId_from_jwt: user.prodiId,
            prodi_details: currentUserProdi,
          },
          periode_aktif: activePeriode,
          instrumen_aktif: activeInstrumen,
          all_prodi_count: allProdi.length,
          prodi_links_count: prodiLinks.length,
          user_has_link: userHasLink,
        },
        all_prodi: allProdi,
        prodi_links: prodiLinks.map((link) => ({
          id: link.id,
          instrumen_id: link.instrumen_id,
          prodi_id: link.prodi_id,
          prodi_nama: link.prodi.nama_prodi,
          prodi_jenjang: link.prodi.jenjang,
          is_active: link.is_active,
          created_at: link.created_at,
        })),
        api_simulation: apiResult,
      })
    );
  } catch (e) {
    console.error(e);
    return R.serverError(e);
  }
}
