import { prisma } from './app/lib/prisma';
async function main() {
  console.log('Users:', await prisma.user.count());
  console.log('Prodis:', await prisma.prodi.count());
  console.log('Dosens:', await prisma.dosen.count());
}
main().catch(console.error).finally(() => prisma.$disconnect());
