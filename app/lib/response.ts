// Centralized Next.js Response helpers

export const ok = (data: unknown, message = 'Sukses', status = 200) =>
  Response.json({ success: true, message, data }, { status });

export const created = (data: unknown, message = 'Data berhasil dibuat') =>
  Response.json({ success: true, message, data }, { status: 201 });

export const badRequest = (message: string, errors?: unknown) =>
  Response.json({ success: false, message, errors }, { status: 400 });

export const unauthorized = (message = 'Tidak terautentikasi') =>
  Response.json({ success: false, message }, { status: 401 });

export const forbidden = (message = 'Akses ditolak') =>
  Response.json({ success: false, message }, { status: 403 });

export const notFound = (message = 'Data tidak ditemukan') =>
  Response.json({ success: false, message }, { status: 404 });

export const serverError = (error: unknown) => {
  console.error('[API Error]', error);
  return Response.json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 });
};
