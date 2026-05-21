# Dokumentasi Aplikasi SIAMI – Sistem Audit Mutu Internal Prodi

> Politeknik Negeri Semarang – Aplikasi web pendukung pelaksanaan Audit Mutu Internal (AMI) tingkat program studi.

---

## 1. Gambaran Umum

**SIAMI** (Sistem Audit Mutu Internal) adalah aplikasi web yang mendukung siklus pengelolaan AMI di tingkat Program Studi. Pengguna sistem dibagi menjadi **tiga peran utama**:

| Role | Tujuan utama |
|------|--------------|
| **Admin** | Mengelola seluruh data master (user, jurusan, prodi, dosen, periode AMI, instrumen audit, dan struktur kriteria) serta melihat rekap menyeluruh. |
| **Kaprodi** | Memvalidasi (review) isian AMI yang dikirim dosen di prodinya. Setiap kaprodi hanya melihat dan mereview isian dari prodi yang dikelolanya. |
| **Dosen** | Mengisi formulir AMI untuk unsur-unsur pemeriksaan yang ditetapkan, mengunggah bukti, dan memperbaiki isian yang diminta revisi. Pengisian bersifat kolektif per-prodi. |

### 1.1 Arsitektur Aplikasi

- **Framework**: Next.js 15 (App Router) dengan TypeScript.
- **Styling**: Tailwind CSS v4 dengan tema biru akademik Politeknik Negeri Semarang.
- **Backend**: Next.js Route Handlers (`/app/api/**/route.ts`) bertindak sebagai REST API.
- **Database**: MySQL (lihat `doc_database_ami.md`).
- **ORM**: Prisma 6.
- **Autentikasi**: JWT (JSON Web Token) berbasis stateless.
- **Autorisasi**: Role-Based Access Control (RBAC) berbasis claim `roleName` di JWT, ditambah filter prodi (Prodi-Scoped Authorization).
- **State client**: `localStorage` menyimpan `ami_token` (JWT) dan `ami_user` (objek user).

### 1.2 Struktur Folder

```
app/
├── login/             ← Halaman login (public)
├── admin/             ← Module Admin
├── kaprodi/           ← Module Kaprodi
├── dosen/             ← Module Dosen
├── api/               ← Route Handlers (REST API)
├── components/ui/     ← Komponen UI bersama (DashboardLayout)
├── lib/               ← Helper auth, prisma client, response
├── globals.css        ← Tema tailwind & token CSS
└── layout.tsx         ← Root layout
prisma/
├── schema.prisma      ← Definisi model Prisma
├── migrations/        ← SQL migrasi
└── seed.ts            ← Data awal (admin, kaprodi, dosen, prodi, instrumen)
```

---

## 2. Metode Role-Based Access Control (RBAC)

Sistem menerapkan **3 lapisan kontrol akses** yang bekerja bersama-sama:

### 2.1 Lapisan 1 – Autentikasi (JWT Bearer Token)

**File**: `app/lib/auth.ts`

Saat login berhasil, server menerbitkan token JWT yang berisi claim:

```json
{
  "userId":   "7",
  "email":    "kaprodi.ti@polines.ac.id",
  "roleId":   "2",
  "roleName": "kaprodi"
}
```

Setiap request ke API harus menyertakan header `Authorization: Bearer <token>`. Fungsi utamanya:

- `signToken(payload)` – mengeluarkan JWT dengan masa berlaku default `7d`.
- `authenticate(request)` – memverifikasi token dari header `Authorization`. Mengembalikan `AuthUser` atau `Response 401`.
- `authorize(user, ...roles)` – memeriksa `roleName` user terhadap daftar role yang diizinkan. Mengembalikan `Response 403` jika tidak cocok.
- `guard(request, ...roles)` – wrapper yang menjalankan `authenticate` + `authorize` sekaligus. Pola pemakaian di setiap endpoint:

```ts
const { user, error } = guard(request, 'admin');
if (error) return error;
// lanjut: user = AuthUser ter-otorisasi
```

### 2.2 Lapisan 2 – Role-Based Endpoint Filter

Setiap endpoint API memanggil `guard` dengan daftar role yang diizinkan. Misal:

| Endpoint | Role yang diizinkan |
|----------|---------------------|
| `POST /api/users` | `admin` saja |
| `GET /api/instrumens` | `admin`, `dosen`, `kaprodi` (read-only untuk yang non-admin) |
| `POST /api/isians` | `dosen` saja |
| `PATCH /api/isians/[id]/review` | `kaprodi` saja |
| `GET /api/kaprodi/dashboard` | `kaprodi` saja |
| `GET /api/auth/me` | semua role yang sudah login |

Ini memberi proteksi **vertikal**: misal seorang dosen tidak akan pernah bisa memanggil endpoint review milik kaprodi.

### 2.3 Lapisan 3 – Prodi-Scoped Authorization

Sistem AMI ini memiliki batasan tambahan: **kaprodi A tidak boleh melihat/mereview isian dari prodi B**, walaupun keduanya berperan sebagai kaprodi. Implementasinya pada beberapa endpoint:

- **`GET /api/isians`** – jika user adalah dosen atau kaprodi, server otomatis menambahkan `where.prodi_id = <prodi user>` (diambil dari relasi `dosens.prodi_id`).
- **`GET /api/isians/by-unsur`** – idem; query selalu di-scope ke prodi user.
- **`PATCH /api/isians/[id]/review`** – sebelum memproses update, server memeriksa `isian.prodi_id` terhadap `prodi user`. Jika berbeda → `403 Forbidden`.
- **`GET /api/kaprodi/dashboard`** – KPI dan rekap dihitung hanya untuk prodi kaprodi yang sedang login.

Pola ini mengubah kontrol akses dari sekadar "role-check" menjadi **role + tenant** (prodi sebagai tenant), yang relevan untuk DFD/UML sebagai **Authorization Filter** atau **Row-Level Security**.

### 2.4 Lapisan Tambahan – Klien-Side Guard

`app/components/ui/DashboardLayout.tsx` membaca `ami_token` dari `localStorage`. Jika tidak ada → `router.push('/login')`. Ini hanya perlindungan UX (server tetap menjadi otoritas).

---

## 3. Module per Role

### 3.1 Module Login (Public)

| Hal | Detail |
|-----|--------|
| Path UI | `/login` |
| File UI | `app/login/page.tsx` |
| API | `POST /api/auth/login` (`app/api/auth/login/route.ts`) |
| Akses | Publik (tidak butuh token) |
| Output | Token JWT + objek user disimpan di `localStorage`, lalu redirect ke dashboard sesuai role |

**Alur**:
1. User mengisi email + password.
2. `POST /api/auth/login` memvalidasi email dengan Prisma (`prisma.user.findUnique`).
3. Verifikasi password dengan `bcrypt.compare`.
4. Jika valid, server menerbitkan JWT, mengupdate `last_login_at`, lalu mengembalikan `{ token, user }`.
5. Klien menyimpan `ami_token` dan `ami_user` di `localStorage` lalu redirect:
   - `admin` → `/admin`
   - `kaprodi` → `/kaprodi`
   - `dosen` → `/dosen`

---

### 3.2 Module Admin

Akses: hanya user dengan `role = admin`.  
Layout: `app/admin/layout.tsx` (memakai `DashboardLayout`).

#### 3.2.1 Sidebar Menu

| Menu | Path | File |
|------|------|------|
| Dashboard | `/admin` | `app/admin/page.tsx` |
| Kelola Anggota/User | `/admin/users` | `app/admin/users/page.tsx` |
| Kelola Jurusan | `/admin/jurusan` | `app/admin/jurusan/page.tsx` |
| Kelola Prodi | `/admin/prodi` | `app/admin/prodi/page.tsx` |
| Kelola Dosen | `/admin/dosen` | `app/admin/dosen/page.tsx` |
| Kelola Periode AMI | `/admin/periode` | `app/admin/periode/page.tsx` |
| Kelola Instrumen AMI | `/admin/instrumen` | `app/admin/instrumen/page.tsx` |
| Struktur Instrumen | `/admin/struktur` | `app/admin/struktur/page.tsx` |
| Rekap Isian AMI | `/admin/rekap` | `app/admin/rekap/page.tsx` |

#### 3.2.2 Halaman & Akses Detail

**(a) Dashboard Admin – `/admin`**
- **Fungsi**: ringkasan statistik global. Menampilkan: periode aktif, instrumen aktif, total user, total dosen, total prodi, progress AMI (%), serta status isian (masuk/valid/menunggu/revisi).
- **API yang dipanggil**:
  - `GET /api/periodes?is_active=true`
  - `GET /api/instrumens?is_active=true`
  - `GET /api/users`
  - `GET /api/dosens`
  - `GET /api/prodis`
  - `GET /api/kriteria?instrumen_id=...` (untuk hitung total unsur)
  - `GET /api/isians/summary?periode_id=...`
- **Akses**: read-only, tidak ada tombol modifikasi.

**(b) Kelola User – `/admin/users`**
- **Fungsi CRUD**: tambah, ubah, hapus, aktif/non-aktifkan user. Filter by role.
- **API**:
  - `GET /api/users` – list semua user.
  - `POST /api/users` – buat user baru (admin saja).
  - `PUT /api/users/[id]` – ubah user.
  - `DELETE /api/users/[id]` – hapus user.
  - `GET /api/roles` – list role untuk dropdown.
- **Field utama**: email, password, role, status aktif.

**(c) Kelola Jurusan – `/admin/jurusan`**
- **Fungsi**: CRUD jurusan (mis. "Teknik Elektro").
- **API**: `GET/POST /api/jurusans`, `PUT/DELETE /api/jurusans/[id]`.

**(d) Kelola Prodi – `/admin/prodi`**
- **Fungsi**: CRUD prodi (Teknik Informatika D3, Teknologi Rekayasa Komputer D4) dengan jenjangnya.
- **API**: `GET/POST /api/prodis`, `PUT/DELETE /api/prodis/[id]`.
- **Relasi**: setiap prodi terhubung ke 1 jurusan.

**(e) Kelola Dosen – `/admin/dosen`**
- **Fungsi**: CRUD profil dosen (NIP, nama, status kepegawaian, kontak) + memetakan dosen ke prodi dan ke akun user.
- **API**: `GET/POST /api/dosens`, `PUT/DELETE /api/dosens/[id]`.

**(f) Kelola Periode AMI – `/admin/periode`**
- **Fungsi**: tambah/ubah/aktifkan periode AMI (mis. "2025/2026"). Hanya satu periode aktif pada waktu tertentu.
- **API**: `GET/POST /api/periodes`, `PUT/DELETE /api/periodes/[id]`.

**(g) Kelola Instrumen AMI – `/admin/instrumen`**
- **Fungsi**: CRUD instrumen audit (header instrumen yang menaungi struktur). Setiap instrumen terikat pada 1 periode.
- **API**: `GET/POST /api/instrumens`, `PUT/DELETE /api/instrumens/[id]`.

**(h) Struktur Instrumen – `/admin/struktur`**
- **Fungsi**: mengelola pohon struktur AMI:
  - Kriteria (mis. "C1: Visi & Misi")
  - Kode AMI (mis. "AMI 1.1")
  - Butir Standar per jenjang (D3, STR, S2)
  - Deskripsi Area Audit
  - Pemeriksaan Unsur (item yang akan diisi dosen)
- **API**:
  - `GET/POST /api/kriteria`, `PUT/DELETE /api/kriteria/[id]`
  - `GET/POST /api/kode-ami`, `PUT/DELETE /api/kode-ami/[id]`
  - `GET/POST /api/butirs`, `PUT/DELETE /api/butirs/[id]`
  - `GET/POST /api/deskripsi-area`, `PUT/DELETE /api/deskripsi-area/[id]`
  - `GET/POST /api/pemeriksaan-unsur`, `PUT/DELETE /api/pemeriksaan-unsur/[id]`

**(i) Rekap Isian AMI – `/admin/rekap`**
- **Fungsi**: melihat rekap menyeluruh status isian seluruh prodi pada periode aktif. Bisa difilter per prodi.
- **API**: `GET /api/isians/summary` dan `GET /api/isians?prodi_id=...`.

---

### 3.3 Module Kaprodi

Akses: user dengan `role = kaprodi`. Setiap kaprodi terikat pada **satu prodi** lewat profil Dosen-nya (`dosens.prodi_id`).  
Layout: `app/kaprodi/layout.tsx`.

#### 3.3.1 Sidebar Menu

| Menu | Path | File |
|------|------|------|
| Dashboard | `/kaprodi` | `app/kaprodi/page.tsx` |
| Verifikasi Dokumen AMI | `/kaprodi/review` | `app/kaprodi/review/page.tsx` |
| Riwayat Review | `/kaprodi/riwayat` | `app/kaprodi/riwayat/page.tsx` |
| Rekap AMI Prodi | `/kaprodi/rekap` | `app/kaprodi/rekap/page.tsx` |
| Profil | `/kaprodi/profil` | `app/kaprodi/profil/page.tsx` |

#### 3.3.2 Halaman & Akses Detail

**(a) Dashboard Kaprodi – `/kaprodi`**
- **Fungsi**: hero card "Periode Aktif", progress %, KPI (Total Isian AMI / Belum Terisi / Terisi / Perlu Revisi), kartu "Status Isian" (Masuk/Valid/Menunggu/Revisi), serta daftar "Prioritas Review" (5 isian terbaru berstatus `proses`).
- **API**: `GET /api/kaprodi/dashboard` (`app/api/kaprodi/dashboard/route.ts`).
- **Logika prodi**: server memanggil `resolveKaprodiProdi(userId)` yang mencari `prodi_id` lewat `dosens.user_id`. Semua hitungan di-filter ke prodi tersebut.

**(b) Verifikasi Dokumen AMI – `/kaprodi/review`**
- **Fungsi**: daftar isian yang menunggu review + form review (Valid / Revisi + catatan kaprodi). Mendukung query string `?isian_id=...` untuk membuka isian tertentu langsung dari dashboard.
- **API**:
  - `GET /api/isians?status=proses` – server menyaring otomatis ke prodi kaprodi.
  - `GET /api/isians/[id]` – detail satu isian.
  - `PATCH /api/isians/[id]/review` – ubah status menjadi `valid` atau `revisi` + catatan. Server memeriksa `isian.prodi_id == kaprodi.prodi_id`; jika beda → 403.
- **Akses**: hanya untuk kaprodi pemilik prodi yang sama dengan isian.

**(c) Riwayat Review – `/kaprodi/riwayat`**
- **Fungsi**: daftar semua isian yang sudah pernah direview kaprodi (status valid atau revisi), terurut terbaru.
- **API**: `GET /api/isians` lalu di-filter di klien berdasarkan status non-`proses`.

**(d) Rekap AMI Prodi – `/kaprodi/rekap`**
- **Fungsi**: rekap status setiap unsur AMI di prodi sendiri – tabel per kriteria, dengan filter pill (Semua / Valid / Menunggu / Revisi / Belum Diisi).
- **API**:
  - `GET /api/auth/me` – ambil prodi user.
  - `GET /api/instrumens?is_active=true`
  - `GET /api/kriteria?instrumen_id=...`
  - `GET /api/isians/by-unsur?prodi_id=...`

**(e) Profil – `/kaprodi/profil`**
- **Fungsi**: menampilkan info akun kaprodi (email, role, prodi, NIP).
- **API**: `GET /api/auth/me`.

---

### 3.4 Module Dosen

Akses: user dengan `role = dosen`. Setiap dosen terikat pada satu prodi via `dosens.prodi_id`.  
Layout: `app/dosen/layout.tsx`.

#### 3.4.1 Sidebar Menu

| Menu | Path | File |
|------|------|------|
| Dashboard | `/dosen` | `app/dosen/page.tsx` |
| Isi AMI | `/dosen/isi-ami` | `app/dosen/isi-ami/page.tsx` |
| Riwayat Isian | `/dosen/riwayat` | `app/dosen/riwayat/page.tsx` |
| Revisi Saya | `/dosen/revisi` | `app/dosen/revisi/page.tsx` |
| Profil | `/dosen/profil` | `app/dosen/profil/page.tsx` |

#### 3.4.2 Halaman & Akses Detail

**(a) Dashboard Dosen – `/dosen`**
- **Fungsi**: hero "Periode Aktif", progress %, KPI total/terisi/perlu-revisi, kartu Status Isian, dan blok "Tindakan Diperlukan" yang adaptif:
  - Jika ada revisi → tombol arahkan ke `/dosen/revisi`.
  - Jika ada unsur kosong → tombol ke `/dosen/isi-ami`.
  - Jika semua menunggu review → arah ke `/dosen/riwayat`.
  - Jika semua valid → ucapan selesai.
- **API**:
  - `GET /api/periodes?is_active=true`
  - `GET /api/instrumens?is_active=true`
  - `GET /api/kriteria?instrumen_id=...` (hitung total unsur)
  - `GET /api/isians/by-unsur` (otomatis di-scope prodi)

**(b) Isi AMI – `/dosen/isi-ami`**
- **Fungsi**: tampilan tree (Kriteria → Kode AMI → Area → Unsur) untuk memilih unsur yang akan diisi. Dilengkapi indikator status kolektif (Valid/Menunggu/Revisi/Belum Diisi) di tiap level node, plus rekap rollup. Setelah memilih unsur, muncul form pengisian.
- **Form fields**: judul dokumen, tahun pelaksanaan, ketersediaan standar, dokumen, pencapaian (SPT-PT, SN-Dikti), daya saing (lokal/nasional/internasional), bukti link, file upload, capaian, keterangan.
- **API**:
  - `GET /api/instrumens?is_active=true`
  - `GET /api/kriteria?instrumen_id=...`
  - `GET /api/isians/by-unsur` (untuk indikator)
  - `POST /api/isians` (kirim isian baru – multipart form-data, status default `proses`)
- **Sifat kolektif**: karena banyak dosen di prodi sama bisa mengisi unsur yang sama, server menyimpan `attempt` per (unsur, periode, dosen) dan rollup status di endpoint `by-unsur` mempertimbangkan attempt terbaru.

**(c) Riwayat Isian – `/dosen/riwayat`**
- **Fungsi**: daftar isian milik dosen sendiri yang pernah disubmit, dengan status. Bisa difilter status, dicari kata kunci, dan dilihat detailnya.
- **API**: `GET /api/isians` (server otomatis filter ke prodi dosen, dosen bisa tambah `?dosen_id=<self>` jika perlu).

**(d) Revisi Saya – `/dosen/revisi`**
- **Fungsi**: daftar isian dengan status `revisi` plus catatan kaprodi yang harus diperbaiki. Bisa langsung diarahkan ke form pengisian ulang (yang akan menambah `attempt`).
- **API**: `GET /api/isians?status=revisi`.

**(e) Profil – `/dosen/profil`**
- **Fungsi**: tampil & edit data dosen (no HP, alamat). Email, NIP, prodi tidak bisa diubah dari sini.
- **API**:
  - `GET /api/auth/me`
  - `PUT /api/dosens/[id]` (terbatas pada dosen pemilik akun)

---

## 4. Daftar Endpoint API (Ringkas)

| Endpoint | Method | Role | Keterangan |
|----------|--------|------|------------|
| `/api/auth/login` | POST | public | Login + terbitkan JWT |
| `/api/auth/me` | GET | semua | Ambil profil user yang sedang login |
| `/api/users` | GET, POST | admin | Kelola user |
| `/api/users/[id]` | PUT, DELETE | admin | Ubah/hapus user |
| `/api/roles` | GET | admin | List role |
| `/api/jurusans` | GET, POST | admin | Kelola jurusan |
| `/api/jurusans/[id]` | PUT, DELETE | admin | Ubah/hapus jurusan |
| `/api/prodis` | GET, POST | admin | Kelola prodi |
| `/api/prodis/[id]` | PUT, DELETE | admin | Ubah/hapus prodi |
| `/api/dosens` | GET, POST | admin | Kelola dosen |
| `/api/dosens/[id]` | GET, PUT, DELETE | admin/dosen sendiri | Ubah profil dosen |
| `/api/periodes` | GET, POST | admin | Kelola periode AMI |
| `/api/periodes/[id]` | PUT, DELETE | admin | Ubah/hapus periode |
| `/api/instrumens` | GET, POST | admin (read: semua) | Kelola instrumen |
| `/api/instrumens/[id]` | PUT, DELETE | admin | Ubah/hapus instrumen |
| `/api/kriteria` | GET, POST | admin (read: semua) | Kelola kriteria |
| `/api/kriteria/[id]` | PUT, DELETE | admin | Ubah/hapus kriteria |
| `/api/kode-ami` | GET, POST | admin (read: semua) | Kelola kode AMI |
| `/api/kode-ami/[id]` | PUT, DELETE | admin | Ubah/hapus kode AMI |
| `/api/butirs` | GET, POST | admin | Kelola butir standar |
| `/api/butirs/[id]` | PUT, DELETE | admin | Ubah/hapus butir |
| `/api/deskripsi-area` | GET, POST | admin (read: semua) | Kelola deskripsi area |
| `/api/deskripsi-area/[id]` | PUT, DELETE | admin | Ubah/hapus area |
| `/api/pemeriksaan-unsur` | GET, POST | admin (read: semua) | Kelola unsur |
| `/api/pemeriksaan-unsur/[id]` | PUT, DELETE | admin | Ubah/hapus unsur |
| `/api/isians` | GET, POST | dosen (post), dosen+kaprodi (get, prodi-scoped) | Submit & list isian |
| `/api/isians/[id]` | GET, PUT, DELETE | dosen owner / kaprodi prodi | Detail isian |
| `/api/isians/[id]/review` | PATCH | kaprodi (prodi-scoped) | Validasi/revisi isian |
| `/api/isians/summary` | GET | admin, kaprodi | Hitungan agregat status isian |
| `/api/isians/by-unsur` | GET | dosen, kaprodi, admin | Rollup status per unsur, prodi-scoped |
| `/api/kaprodi/dashboard` | GET | kaprodi | Data dashboard kaprodi |

---

## 5. Alur Bisnis Utama (Untuk Referensi DFD/UML)

### 5.1 Use Case Utama

1. **UC-01: Login** – Aktor: semua role.
2. **UC-02: Mengelola Master Data** – Aktor: Admin. Termasuk user, jurusan, prodi, dosen, periode, instrumen, kriteria, kode AMI, butir, area, unsur.
3. **UC-03: Mengisi AMI** – Aktor: Dosen. Membuat baris baru di `isian_ami` dengan status `proses`.
4. **UC-04: Memperbaiki Isian (Revisi)** – Aktor: Dosen. Mengirim ulang isian; sistem menambah `attempt`.
5. **UC-05: Mereview Isian** – Aktor: Kaprodi. Mengubah status `proses → valid` atau `proses → revisi` plus catatan, membuat baris di `isian_review_logs`.
6. **UC-06: Memantau Progres Prodi** – Aktor: Kaprodi. Membaca rekap & dashboard.
7. **UC-07: Memantau Progres Global** – Aktor: Admin.

### 5.2 DFD Level 0 (Context Diagram)

```
                    ┌──────────────────────┐
   ┌──── Admin ───→ │                      │
   │                │      SIAMI           │ ←── Dosen (isi AMI, lihat status)
   │                │      (Web App)       │
   ├── Kaprodi ──→  │                      │
   │                └──────────────────────┘
   ↓
  Database MySQL
```

### 5.3 DFD Level 1 (Proses Utama)

| Proses | Input | Output | Datastore |
|--------|-------|--------|-----------|
| 1.0 Autentikasi | email, password | JWT token | `users`, `roles` |
| 2.0 Manajemen Master | data jurusan/prodi/dosen/periode/instrumen | konfirmasi sukses | `jurusans`, `prodis`, `dosens`, `periodes`, `instrumens`, struktur AMI |
| 3.0 Pengisian AMI | judul, bukti, dll | baris isian baru | `isian_ami`, `isian_bukti_files` |
| 4.0 Review AMI | id isian, status, catatan | update status | `isian_ami`, `isian_review_logs` |
| 5.0 Rekap & Dashboard | filter prodi/periode | KPI, list isian | (read-only ke semua tabel) |

### 5.4 Sequence Diagram: Pengisian & Review

```
Dosen          Frontend          API /api/isians       DB           Kaprodi          API /api/isians/[id]/review
  |   isi form     |                   |                |                |                       |
  |───────────────→|                   |                |                |                       |
  |                | POST + token      |                |                |                       |
  |                |──────────────────→| guard(dosen)   |                |                       |
  |                |                   |───────────────→|                |                       |
  |                |                   |  insert isian  |                |                       |
  |                |                   |←───────────────|                |                       |
  |                |   201 created     |                |                |                       |
  |                |←──────────────────|                |                |                       |
  |                                                                       |  buka review          |
  |                                                                       |──────────────────────→|
  |                                                                       |  PATCH + token        |
  |                                                                       |──────────────────────→| guard(kaprodi)
  |                                                                       |                       |  + cek prodi match
  |                                                                       |                       |───→ DB update + log
  |                                                                       |                       |
```

### 5.5 Class Diagram (Domain Inti)

```
+--------+       +-------+       +--------+        +-------+
| Role   |1----*| User  |0..1--1| Dosen  |*------1| Prodi |
+--------+       +-------+       +--------+        +-------+
                    | 1                                | 1
                    | reviewed                         |
                    | created                          |
                    *                                  *
                +------------+   1   *   +-----------+
                | Instrumen  |←──────────| Periode   |
                +------------+           +-----------+
                    1
                    *
                +-----------------+
                | KriteriaStandar |
                +-----------------+
                    1
                    *
                +---------+
                | KodeAmi |
                +---------+
                  1     1
                  *     *
        +----------------+   +----------------------+
        | DeskripsiArea  |   | KodeAmiButirStandar  |
        +----------------+   +----------------------+
              1                       *      1
              *                              +-----------------+
        +-------------------+                | JenjangStandar  |
        | PemeriksaanUnsur  |                +-----------------+
        +-------------------+
              1
              *
        +------------+
        | IsianAmi   | *──*── BuktiFile, ReviewLog
        +------------+
```

---

## 6. Komponen UI Bersama

**`app/components/ui/DashboardLayout.tsx`** – komponen layout untuk dashboard (admin/kaprodi/dosen). Menyediakan:

- Sidebar navy (`#0a2f6f`) dengan brand block "SIAMI / Prodi - {Role} Panel".
- Section "MENU UTAMA" dengan list menu yang dikirim sebagai prop.
- Card profil + tombol Logout di bagian bawah sidebar.
- Topbar dengan breadcrumb otomatis (Role › Halaman aktif), tombol notifikasi, dan badge role.
- Cek otomatis: jika tidak ada `ami_token`, redirect ke `/login`.

Tema warna mengikuti palet biru akademik Polines yang dideklarasikan di `app/globals.css` lewat token Tailwind v4 (`@theme`):

| Token | Warna |
|-------|-------|
| `--siami-navy` | `#0a2f6f` (navy utama) |
| `--siami-navy-strong` | `#06214f` (navy lebih gelap) |
| `--siami-navy-soft` | `#1456a8` (aksen) |
| `--siami-accent` | `#2563cd` |
| `--siami-bg` | `#f4f7fc` (background) |
| `--color-indigo-*` | di-override ke palet brand di atas |

---

## 7. Akun Default (Seeder)

| Role | Email | Password | Prodi |
|------|-------|----------|-------|
| Admin | `admin@polines.ac.id` | `password123` | – |
| Kaprodi TI | `kaprodi.ti@polines.ac.id` | `password123` | Teknik Informatika (D3) |
| Kaprodi TRK | `kaprodi.trk@polines.ac.id` | `password123` | Teknologi Rekayasa Komputer (D4) |
| Dosen 1 | `idhawati.hestiningsih@polines.ac.id` | `password123` | Teknik Informatika |
| Dosen 2 | `muttabik.fathul@polines.ac.id` | `password123` | Teknik Informatika |
| Dosen 3 | `sukamto@polines.ac.id` | `password123` | Teknik Informatika |
| Dosen 4 | `wiktasari@polines.ac.id` | `password123` | Teknologi Rekayasa Komputer |

Seeder dijalankan dengan `npx prisma db seed` (file `prisma/seed.ts`). Semua data master, struktur instrumen AMI, dan beberapa contoh isian otomatis dibuat.

---

## 8. Alur Sesi & Keamanan

1. **Login** → JWT 7 hari → simpan di `localStorage`.
2. **Setiap request API** → header `Authorization: Bearer <token>`.
3. **Server**:
   - `guard` → verifikasi JWT + cek role.
   - Untuk endpoint yang prodi-sensitive → resolve `prodi_id` user dari `dosens.user_id` lalu inject sebagai filter query.
4. **Logout** → `localStorage.removeItem` + redirect ke `/login`.

Untuk kebutuhan UML, ini bisa digambarkan sebagai **State Machine sederhana**:

```
[Anonymous] ── login ──→ [Authenticated]
[Authenticated] ── role:admin ──→ [Admin Session]
[Authenticated] ── role:kaprodi ──→ [Kaprodi Session, prodi=X]
[Authenticated] ── role:dosen ──→ [Dosen Session, prodi=X]
[Any Session] ── logout / token expired ──→ [Anonymous]
```

---

## 9. Ringkasan Diagram untuk DFD/UML

| Diagram | Sumber referensi di dokumen ini |
|---------|---------------------------------|
| Use Case Diagram | Bagian 5.1 |
| DFD Level 0 (Context) | Bagian 5.2 |
| DFD Level 1 | Bagian 5.3 |
| Sequence Diagram (Isi & Review AMI) | Bagian 5.4 |
| Class Diagram | Bagian 5.5 |
| Activity Diagram (Auth) | Bagian 8 |
| State Diagram Sesi | Bagian 8 |
| ERD / Schema | Lihat `doc_database_ami.md` |

---
