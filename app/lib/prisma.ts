import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma_v2: PrismaClient | undefined;
};

// Parse DATABASE_URL: mysql://user:pass@host:port/database
function parseDbUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port || '3306', 10),
    user: parsed.username || 'root',
    password: parsed.password || undefined,
    database: parsed.pathname.replace('/', '') || 'ami_prodi',
    connectionLimit: 5,
  };
}

const config = parseDbUrl(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb(config);

export const prisma =
  globalForPrisma.prisma_v2 ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma_v2 = prisma;
}
