import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const prodis = await prisma.prodi.findMany();
  console.log('Prodis:', prodis);
  const jenjangs = await prisma.jenjangStandar.findMany();
  console.log('Jenjangs:', jenjangs);
  const butir = await prisma.kodeAmiButirStandar.findFirst({include: {jenjang: true}});
  console.log('ButirStandar:', butir);
}
main().finally(() => prisma.$disconnect());
