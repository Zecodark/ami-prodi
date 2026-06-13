import { prisma } from './app/lib/prisma';
async function test() {
  try {
    const user = await prisma.user.findFirst({ select: { prodi_id: true } });
    console.log('OK, prodi_id is available:', user?.prodi_id);
  } catch (e: any) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
