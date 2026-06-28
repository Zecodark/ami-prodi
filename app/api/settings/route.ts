import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as R from '@/app/lib/response';

// GET /api/settings
export async function GET(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const data = await prisma.systemSetting.findMany();
    
    // Convert array of {key, value} to object
    const settings = data.reduce((acc, curr) => {
      acc[curr.key] = curr.value === 'true' ? true : curr.value === 'false' ? false : curr.value;
      return acc;
    }, {} as Record<string, any>);

    return R.ok(settings);
  } catch (e) {
    return R.serverError(e);
  }
}

// PUT /api/settings
export async function PUT(request: NextRequest) {
  try {
    const { error } = guard(request, 'admin');
    if (error) return error;

    const body = await request.json();
    
    // We expect a key-value object like { mfa_enabled: true }
    // Upsert each setting
    for (const [key, val] of Object.entries(body)) {
      const stringValue = typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val);
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue },
      });
    }

    return R.ok(null, 'Pengaturan berhasil disimpan');
  } catch (e) {
    return R.serverError(e);
  }
}
