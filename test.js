const { PrismaClient } = require('./app/generated/prisma');
const prisma = new PrismaClient();
prisma.isianAmi.findMany().then(r => {
  console.log(JSON.stringify(r.map(x => ({ id: x.id, status: x.status, dosen: x.dosen_id, unsur: x.pemeriksaan_unsur_id })), null, 2));
}).catch(console.error).finally(() => prisma.$disconnect());
