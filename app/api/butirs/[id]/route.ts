/**
 * @deprecated Endpoint ini sudah tidak digunakan lagi.
 * Gunakan endpoint yang lebih spesifik sesuai dengan struktur data:
 *   GET /api/kriteria?instrumen_id=xxx
 *   GET /api/kode-ami?kriteria_id=xxx
 *   GET /api/deskripsi-area?kode_ami_id=xxx
 *   GET /api/pemeriksaan-unsur?deskripsi_area_id=xxx
 */

import { NextRequest } from 'next/server';
import * as R from '@/app/lib/response';

export async function GET(request: NextRequest) {
  return R.badRequest('Endpoint ini sudah tidak digunakan. Gunakan endpoint yang lebih spesifik.');
}

export async function PUT(request: NextRequest) {
  return R.badRequest('Endpoint ini sudah tidak digunakan. Gunakan endpoint yang lebih spesifik.');
}

export async function DELETE(request: NextRequest) {
  return R.badRequest('Endpoint ini sudah tidak digunakan. Gunakan endpoint yang lebih spesifik.');
}
