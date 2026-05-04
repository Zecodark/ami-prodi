# Panduan Penggunaan Prisma ORM di Proyek AMI Prodi

Dokumen ini menjelaskan secara lengkap apa itu Prisma, bagaimana cara kerjanya, dan detail implementasinya secara spesifik di dalam proyek web aplikasi AMI Prodi.

---

## 1. Apa itu Prisma? (Secara Jenderal)

**Prisma** adalah sebuah ORM (Object-Relational Mapper) modern untuk Node.js dan TypeScript. Fungsi utamanya adalah menjadi "jembatan" antara kode aplikasi (JavaScript/TypeScript) dengan database (MySQL, PostgreSQL, dll).

Berbeda dengan ORM tradisional, Prisma memiliki 3 komponen utama:
1. **Prisma Schema (`schema.prisma`)**: File konfigurasi tunggal tempat Anda mendefinisikan koneksi database dan struktur tabel (model).
2. **Prisma Client**: Query builder yang di-generate secara otomatis berdasarkan *schema* Anda. Prisma Client ini sangat *type-safe* (punya fitur auto-complete yang kuat di TypeScript).
3. **Prisma Migrate / Studio**: Alat untuk melakukan migrasi struktur database dan antarmuka GUI untuk melihat isi database.

**Keuntungan menggunakan Prisma:**
- Penulisan query database tidak lagi menggunakan SQL mentah (meskipun masih bisa jika mau), melainkan fungsi JavaScript/TypeScript seperti `prisma.user.findMany()`.
- Auto-complete (IntelliSense) di VS Code akan memberi tahu Anda jika Anda salah mengetik nama kolom, sehingga mencegah error sebelum aplikasi dijalankan.

---

## 2. Penerapan Prisma di Proyek AMI Prodi

Pada proyek AMI Prodi ini, Prisma digunakan untuk mengatur seluruh transaksi data ke database MySQL (`ami_prodi`). Berikut adalah rincian penerapannya:

### A. Konfigurasi dan Schema (`prisma/schema.prisma`)
File ini adalah jantung dari database proyek. Di dalamnya terdapat:
- **Koneksi Database**: Menggunakan provider `mysql` dengan URL koneksi dari file `.env` (`DATABASE_URL`).
- **Definisi Model**: Semua tabel database dipetakan ke dalam model. Contohnya tabel `users` dipetakan menjadi model `User`.
- **Tipe Data Khusus (BigInt)**: Proyek ini menggunakan `BigInt` sebagai tipe data untuk *Primary Key* (`id`). Prisma menangani ini dengan tipe bawaan JS `BigInt`.
- **Relasi Antar Tabel**: Relasi 1-ke-Banyak (*One-to-Many*) atau 1-ke-1 (*One-to-One*) ditulis secara eksplisit. Contoh: Model `Prodi` memiliki `jurusan_id` yang berelasi dengan model `Jurusan`.

### B. Singleton Prisma Client (`app/lib/prisma.ts`)
Karena Next.js (terutama saat mode *development*) sering me-reload file *(Hot Module Replacement)*, membuat koneksi database baru setiap kali file berubah akan memicu error *"Too many connections"*. 

Untuk mengatasinya, dibuatkan pola **Singleton** di `app/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```
Setiap file API yang butuh akses ke database **wajib** mengimport `prisma` dari file ini (bukan membuat `new PrismaClient()` lagi).

### C. Penanganan Masalah BigInt (Serialization)
JSON standar di JavaScript tidak mendukung tipe data `BigInt`. Jika Anda mencoba melakukan `Response.json({ id: 10n })`, aplikasi akan error. 
Oleh karena itu, di setiap file API Router (`app/api/.../route.ts`), kita membuat fungsi helper:
```typescript
const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));
```
Fungsi ini akan mengubah semua nilai `BigInt` dari Prisma menjadi tipe `String` sebelum dikirimkan sebagai response API ke frontend.

### D. Penggunaan Query Prisma di API Routes
Berikut adalah pola yang digunakan dalam proyek ini saat membuat endpoint REST API menggunakan Prisma:

1. **Mengambil Data (GET)**
   Mengambil daftar isian berserta tabel relasinya (join).
   ```typescript
   const data = await prisma.isian.findMany({
     include: { // Berfungsi seperti JOIN di SQL
       dosen: true,
       butir_instrumen: true
     },
     orderBy: { updated_at: 'desc' }
   });
   ```

2. **Membuat Data (POST)**
   ```typescript
   const data = await prisma.jurusan.create({
     data: { nama_jurusan: "Teknik Informatika" }
   });
   ```

3. **Mengupdate Data (PUT / PATCH)**
   ```typescript
   const data = await prisma.user.update({
     where: { id: BigInt(id) }, // ID harus diconvert ke BigInt
     data: { email: "baru@mail.com" }
   });
   ```

4. **Menghapus Data (DELETE)**
   ```typescript
   await prisma.dosen.delete({
     where: { id: BigInt(id) }
   });
   ```

5. **Menghitung Data (Statistik Kaprodi)**
   Pada route `/api/isians/summary`, Prisma digunakan untuk menghitung jumlah baris dengan sangat cepat menggunakan `prisma.isian.count()` dan mengelompokkan data (GROUP BY) menggunakan `prisma.isian.groupBy()`.

---

## 3. Perintah-Perintah Penting Prisma (Cheatsheet)

Jika ada perubahan struktur pada database MySQL, jalankan urutan perintah berikut di terminal root proyek:

1. **`npx prisma db pull`**
   - **Kapan digunakan?** Jika Anda mengubah struktur tabel langsung di phpMyAdmin / MySQL, jalankan ini agar Prisma meng-update file `schema.prisma` secara otomatis.
   
2. **`npx prisma generate`**
   - **Kapan digunakan?** **SANGAT PENTING!** Jalankan setiap kali `schema.prisma` berubah, atau saat Anda baru saja melakukan `npm install`. Perintah ini akan memperbarui kode TypeScript `PrismaClient` di folder `node_modules/@prisma/client` agar sesuai dengan struktur database terbaru Anda.

3. **`npx prisma studio`**
   - Membuka halaman web localhost untuk melihat dan mengedit isi database Anda secara visual dengan UI yang cantik (mirip phpMyAdmin tapi lebih modern).
