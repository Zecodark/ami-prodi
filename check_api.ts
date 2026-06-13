import { prisma } from './app/lib/prisma';
import { SignJWT } from 'jose';

async function testApi() {
  try {
    const adminUser = await prisma.user.findFirst({ where: { role: { nama_role: 'admin' } }, include: { role: true, dosen: true } });
    if (!adminUser) return console.log('No admin found');

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    const token = await new SignJWT({
      id: adminUser.id,
      email: adminUser.email,
      roleId: adminUser.role_id,
      roleName: adminUser.role?.nama_role,
      dosenId: adminUser.dosen?.id,
      prodiId: adminUser.prodi_id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    console.log('Token:', token);

    const res = await fetch('http://localhost:3000/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(data).slice(0, 500));
  } catch (e: any) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
testApi();
