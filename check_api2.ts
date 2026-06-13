import { prisma } from './app/lib/prisma';
const select = {
  id: true, email: true, is_active: true, last_login_at: true, created_at: true, updated_at: true,
  role: { select: { id: true, nama_role: true } },
  prodi_id: true,
  prodi: { select: { id: true, nama_prodi: true, jenjang: true } },
  dosen: {
    select: {
      id: true, nip: true, nama_lengkap: true, status_kepegawaian: true,
      prodi: { select: { id: true, nama_prodi: true, jenjang: true } },
    },
  },
};
async function test() {
  try {
    const data = await prisma.user.findMany({ select, orderBy: { created_at: 'desc' } });
    console.log('Users found:', data.length);
  } catch (e: any) {
    console.error('ERROR GET USERS:', e.message);
  }
  
  try {
    const prodis = await prisma.prodi.findMany({
      include: {
        dosen: true,
        users: { where: { role: { nama_role: 'kaprodi' }, is_active: true } }
      }
    });
    console.log('Prodis found:', prodis.length);
  } catch (e: any) {
    console.error('ERROR GET PRODIS:', e.message);
  }

  try {
    const dosens = await prisma.dosen.findMany({
      include: {
        prodi: true,
        user: { select: { id: true, email: true, role: { select: { nama_role: true } } } },
      },
    });
    console.log('Dosens found:', dosens.length);
  } catch(e: any) {
    console.error('ERROR GET DOSEN:', e.message);
  }

  await prisma.$disconnect();
}
test();
