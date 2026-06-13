import { prisma } from './app/lib/prisma';
import jwt from 'jsonwebtoken';

async function testApi() {
  try {
    const adminUser = await prisma.user.findFirst({ where: { role: { nama_role: 'admin' } }, include: { role: true } });
    if (!adminUser) return console.log('No admin found');

    const payload = {
      userId: adminUser.id.toString(),
      email: adminUser.email,
      roleId: adminUser.role_id?.toString() || null,
      roleName: adminUser.role?.nama_role,
      prodiId: adminUser.prodi_id?.toString() || null,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });

    console.log('Testing /api/users');
    const res1 = await fetch('http://localhost:3000/api/users', { headers: { Authorization: `Bearer ${token}` } });
    console.log('/api/users status:', res1.status);
    if (!res1.ok) console.log(await res1.text());

    console.log('Testing /api/prodis');
    const res2 = await fetch('http://localhost:3000/api/prodis', { headers: { Authorization: `Bearer ${token}` } });
    console.log('/api/prodis status:', res2.status);
    if (!res2.ok) console.log(await res2.text());

    console.log('Testing /api/dosens');
    const res3 = await fetch('http://localhost:3000/api/dosens', { headers: { Authorization: `Bearer ${token}` } });
    console.log('/api/dosens status:', res3.status);
    if (!res3.ok) console.log(await res3.text());

  } catch (e: any) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
testApi();
