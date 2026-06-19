# Perubahan: Riwayat Isian AMI Per Dosen

## Masalah Sebelumnya

Sebelumnya, sistem memiliki constraint unique `@@unique([pemeriksaan_unsur_id, periode_id, prodi_id])` pada tabel `isian_ami`. Ini berarti:

- **1 prodi hanya bisa punya 1 isian per unsur per periode**
- Semua dosen di prodi yang sama **berbagi isian yang sama**
- Ketika dosen A mengisi, dosen B akan melihat isian dari dosen A
- Riwayat isian tidak tersimpan per dosen, tapi per prodi

## Solusi

Mengubah constraint unique menjadi `@@unique([pemeriksaan_unsur_id, periode_id, dosen_id])`, sehingga:

- **Setiap dosen punya isian terpisah** untuk setiap unsur
- Riwayat isian **tersimpan per dosen** di akun login mereka
- Dosen A tidak akan melihat isian dari dosen B
- Semua dosen di prodi yang sama tetap bisa mengisi unsur yang sama, tapi dengan isian terpisah

## Perubahan File

### 1. Database Schema (`prisma/schema.prisma`)
```prisma
// Sebelum
@@unique([pemeriksaan_unsur_id, periode_id, prodi_id])

// Sesudah
@@unique([pemeriksaan_unsur_id, periode_id, dosen_id])
```

### 2. API Route (`app/api/isians/route.ts`)

**POST /api/isians - Create/Update Isian**
```typescript
// Sebelum: Check validasi berdasarkan prodi_id
const validIsian = await prisma.isianAmi.findFirst({
  where: {
    pemeriksaan_unsur_id: parsed.data.pemeriksaan_unsur_id,
    periode_id: parsed.data.periode_id,
    prodi_id: dosen.prodi_id, // ❌ Filter by prodi
    status: 'valid',
  },
});

const existingDraft = await prisma.isianAmi.findFirst({
  where: {
    pemeriksaan_unsur_id: parsed.data.pemeriksaan_unsur_id,
    prodi_id: dosen.prodi_id, // ❌ Filter by prodi
    periode_id: parsed.data.periode_id,
  },
});

// Sesudah: Check validasi berdasarkan dosen_id
const validIsian = await prisma.isianAmi.findFirst({
  where: {
    pemeriksaan_unsur_id: parsed.data.pemeriksaan_unsur_id,
    periode_id: parsed.data.periode_id,
    dosen_id: dosen.id, // ✅ Filter by dosen
    status: 'valid',
  },
});

const existingDraft = await prisma.isianAmi.findFirst({
  where: {
    pemeriksaan_unsur_id: parsed.data.pemeriksaan_unsur_id,
    dosen_id: dosen.id, // ✅ Filter by dosen
    periode_id: parsed.data.periode_id,
  },
});
```

**GET /api/isians - List Isian**
- Sudah ada filter `where.dosen_id = dosen.id` untuk role dosen
- Tidak perlu perubahan

### 3. API by-unsur (`app/api/isians/by-unsur/route.ts`)

Status per unsur tetap dihitung kolektif dari semua dosen di prodi (tidak perlu diubah), karena:
- Kaprodi perlu melihat status pengisian dari semua dosen di prodinya
- Progress bar tetap menunjukkan status kolektif prodi

Namun, API ini sudah di-update untuk menghitung statistik khusus dosen yang login:
```typescript
dosen_stats: currentDosenId ? { proses: dosenProses, revisi: dosenRevisi } : null
```

## Cara Migrasi

1. **Generate migrasi Prisma**:
   ```bash
   npx prisma migrate dev --name separate_isian_per_dosen
   ```

2. **Jalankan migrasi**:
   - Migrasi akan otomatis membuat constraint unique baru
   - Data existing akan tetap ada (tidak ada data loss)

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

## Dampak pada Fitur

### ✅ Yang Berubah
- Setiap dosen sekarang punya riwayat isian terpisah
- Halaman "Riwayat Isian" hanya menampilkan isian milik dosen yang login
- Halaman "Revisi Saya" hanya menampilkan revisi milik dosen yang login
- Halaman "Isi AMI" akan memuat isian milik dosen yang login (bukan dosen lain)

### ✅ Yang Tidak Berubah
- Status per unsur di halaman "Isi AMI" tetap dihitung kolektif (semua dosen di prodi)
- Progress bar tetap menunjukkan statistik prodi secara keseluruhan
- Kaprodi tetap bisa melihat semua isian dari semua dosen di prodinya
- Fitur review dan validasi oleh Kaprodi tetap sama

## Testing

Setelah migrasi, test scenario berikut:

1. **Login sebagai Dosen A**
   - Isi unsur X → Submit
   - Cek halaman "Riwayat Isian" → Harus muncul isian yang baru saja dibuat

2. **Login sebagai Dosen B (prodi sama dengan Dosen A)**
   - Buka halaman "Isi AMI" → Unsur X harus masih kosong (tidak ada isian Dosen A)
   - Isi unsur X → Submit (dengan data berbeda dari Dosen A)
   - Cek halaman "Riwayat Isian" → Harus muncul isian Dosen B (bukan isian Dosen A)

3. **Login sebagai Kaprodi**
   - Buka halaman "Review Isian"
   - Harus melihat isian dari **kedua** Dosen A dan Dosen B untuk unsur X

4. **Status di halaman "Isi AMI"**
   - Status unsur X harus menunjukkan status kolektif (misalnya "Menunggu Review" jika ada isian dari salah satu dosen)

## Catatan Penting

⚠️ **Breaking Change**: 
- Jika ada data lama dengan constraint `[pemeriksaan_unsur_id, periode_id, prodi_id]`, migrasi akan menghapus constraint lama dan membuat yang baru
- Pastikan tidak ada duplicate data dengan `[pemeriksaan_unsur_id, periode_id, dosen_id]` yang sama sebelum migrasi

⚠️ **Data Existing**:
- Isian yang sudah ada sebelum migrasi akan tetap ada
- Tapi jika ada 2 dosen yang berbagi isian yang sama (sebelum migrasi), salah satu harus diubah `dosen_id`-nya atau dihapus agar tidak konflik dengan constraint baru
