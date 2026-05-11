import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import * as R from '@/app/lib/response';

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

export async function GET(request: NextRequest) {
  try {
    const data = await prisma.role.findMany({
      orderBy: { nama_role: 'asc' },
    });
    return R.ok(serialize(data));
  } catch (e) { return R.serverError(e); }
}
