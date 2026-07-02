import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import * as R from '@/app/lib/response';
import { guard } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Basic guard to ensure only authenticated users can upload
    const { error } = guard(request);
    if (error) return error;

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return R.badRequest('File tidak ditemukan');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const ext = path.extname(file.name) || '.jpg';
    const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`;

    // Define path
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    
    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore if exists
    }

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/profiles/${filename}`;
    return R.ok({ url: fileUrl }, 'File berhasil diupload');
  } catch (error) {
    console.error('Error uploading file:', error);
    return R.serverError('Gagal mengupload file');
  }
}
