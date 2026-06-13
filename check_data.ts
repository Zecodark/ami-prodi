import { prisma } from './app/lib/prisma';

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, prodi_id: true, role: { select: { nama_role: true } } } });
  console.log('USERS:');
  console.table(users);

  const dosens = await prisma.dosen.findMany({ select: { id: true, nama_lengkap: true, user_id: true, prodi_id: true } });
  console.log('\nDOSENS:');
  console.table(dosens);

  const prodis = await prisma.prodi.findMany({ select: { id: true, nama_prodi: true, _count: { select: { users: true, dosens: true } } } });
  console.log('\nPRODIS:');
  console.table(prodis);
}
main().catch(console.error).finally(() => prisma.$disconnect());
