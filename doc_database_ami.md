# Dokumentasi Database SIAMI – Audit Mutu Internal Prodi

> Sumber: `prisma/schema.prisma` dan `prisma/migrations/20260511_init_new_schema/migration.sql`. Database menggunakan **MySQL 8** dengan charset `utf8mb4` dan collation `utf8mb4_unicode_ci`.

---

## 1. Gambaran Umum Skema

Database SIAMI dirancang untuk menampung tiga area utama:

1. **Otentikasi & Otorisasi** – tabel `roles`, `users`.
2. **Master Data Akademik** – tabel `jurusans`, `prodis`, `dosens`.
3. **Struktur Instrumen AMI** – tabel `periodes`, `instrumens`, `kriteria_standars`, `kode_amis`, `jenjang_standars`, `kode_ami_butir_standars`, `deskripsi_areas`, `pemeriksaan_unsurs`.
4. **Transaksi Pengisian** – tabel `isian_ami`, `isian_bukti_files`, `isian_review_logs`.

Total terdapat **16 tabel utama** dan **3 enum**:

| Enum | Nilai |
|------|-------|
| `KetersediaanStandar` | `ada`, `tidak_ada` |
| `DokumenStatus` | `ada`, `tidak_ada` |
| `IsianStatus` | `proses`, `valid`, `revisi` |

### 1.1 Diagram Relasi (Tekstual)

```
roles (1) ──< users (1) ──< dosens (N) >── prodis (N) >── jurusans
                  ↑              │
                  │              └──< isian_ami (N) >── prodis
                  │
                  └─── (audit trail) ── isian_review_logs, isian_bukti_files

periodes (1) ──< instrumens (1) ──< kriteria_standars (1) ──< kode_amis (1) ──< deskripsi_areas (1) ──< pemeriksaan_unsurs (1) ──< isian_ami

kode_amis (1) ──< kode_ami_butir_standars (N) >── jenjang_standars
```

### 1.2 Perilaku Foreign Key Default

- **Cascade pada DELETE & UPDATE**: untuk relasi struktural AMI (kriteria → kode_ami → area → unsur). Hapus parent akan mengikut sertakan anak.
- **Restrict pada DELETE**: untuk transaksi yang sudah ada isian (`isian_ami` ke `pemeriksaan_unsur`, `periode`, `dosen`). Mencegah hilangnya data audit.
- **SetNull pada DELETE**: untuk relasi yang opsional (`users.role_id`, `dosens.prodi_id`, `isians.prodi_id`, `isians.reviewed_by`, dll).

---

## 2. Tabel-Tabel Detail

### 2.1 `roles`

**Fungsi**: master daftar peran pengguna (admin, kaprodi, dosen).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK, auto-increment | Identitas unik role |
| `nama_role` | VARCHAR(50) | UNIQUE, NOT NULL | Nama role (`admin`, `kaprodi`, `dosen`) |
| `deskripsi` | VARCHAR(100) | NULL | Deskripsi peran |
| `created_at` | TIMESTAMP | default CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | default CURRENT_TIMESTAMP, on update | |

Index: `roles_nama_role_key` (UNIQUE).  
Relasi: `users.role_id → roles.id` (1:N).

---

### 2.2 `users`

**Fungsi**: kredensial dan info dasar setiap akun yang bisa login.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `email` | VARCHAR(50) | UNIQUE, NOT NULL | Email login |
| `password` | VARCHAR(255) | NOT NULL | Disimpan sebagai hash bcrypt |
| `role_id` | INT(10) | NULL, FK → `roles.id` ON DELETE SET NULL | Peran user |
| `is_active` | BOOLEAN | default `true` | Flag akun aktif |
| `last_login_at` | TIMESTAMP | NULL | Diperbarui saat login berhasil |
| `created_at` | TIMESTAMP | default CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | default CURRENT_TIMESTAMP, on update | |

Index: `users_email_key` (UNIQUE), `users_role_id_idx`.  
Relasi:
- `roles.id ← users.role_id` (N:1)
- `dosens.user_id → users.id` (1:1, opsional)
- `instrumens.created_by → users.id` (auditor pembuat instrumen)
- `isian_ami.reviewed_by → users.id` (kaprodi pereview)
- `isian_bukti_files.uploaded_by → users.id`
- `isian_review_logs.reviewer_id → users.id`

---

### 2.3 `jurusans`

**Fungsi**: master jurusan akademik (mis. "Teknik Elektro").

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `nama_jurusan` | VARCHAR(30) | UNIQUE, NOT NULL | Nama jurusan |
| `created_at` | TIMESTAMP | default | |
| `updated_at` | TIMESTAMP | default, on update | |

Index: `jurusans_nama_jurusan_key` (UNIQUE).  
Relasi: `prodis.jurusan_id → jurusans.id` (1:N).

---

### 2.4 `prodis`

**Fungsi**: master program studi yang berada di bawah jurusan.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `jurusan_id` | INT(10) | NULL, FK → `jurusans.id` ON DELETE SET NULL | Jurusan induk |
| `nama_prodi` | VARCHAR(50) | NOT NULL | Nama prodi (mis. "Teknik Informatika") |
| `jenjang` | VARCHAR(20) | NULL | Jenjang program (D3, D4) |
| `created_at` | TIMESTAMP | default | |
| `updated_at` | TIMESTAMP | default, on update | |

Index: `prodis_jurusan_id_idx`, `prodis_nama_prodi_jurusan_id_key` (UNIQUE composite).  
Relasi:
- `jurusans.id ← prodis.jurusan_id`
- `dosens.prodi_id → prodis.id`
- `isian_ami.prodi_id → prodis.id`

**Catatan**: kombinasi `(nama_prodi, jurusan_id)` unik supaya satu jurusan tidak bisa punya prodi dengan nama persis sama.

---

### 2.5 `dosens`

**Fungsi**: profil dosen dan kaprodi (kaprodi adalah dosen yang user-nya berperan kaprodi). Penghubung antara akun user dengan prodi.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `user_id` | INT(10) | UNIQUE NULL, FK → `users.id` ON DELETE SET NULL | Akun login dosen |
| `prodi_id` | INT(10) | NULL, FK → `prodis.id` ON DELETE SET NULL | Prodi tempat dosen bertugas |
| `nip` | VARCHAR(20) | UNIQUE, NOT NULL | Nomor Induk Pegawai |
| `nama_lengkap` | VARCHAR(50) | NOT NULL | Nama lengkap dengan gelar |
| `status_kepegawaian` | VARCHAR(50) | NOT NULL | "PNS", "Kontrak", dll |
| `no_hp` | VARCHAR(20) | NULL | |
| `alamat` | TEXT | NULL | |
| `is_active` | BOOLEAN | default `true` | |
| `created_at`, `updated_at` | TIMESTAMP | | |

Index: `dosens_user_id_key` (UNIQUE), `dosens_nip_key` (UNIQUE), `dosens_prodi_id_idx`.  
Relasi:
- `users.id ← dosens.user_id` (1:1)
- `prodis.id ← dosens.prodi_id` (N:1)
- `isian_ami.dosen_id → dosens.id` (1:N – satu dosen bisa punya banyak isian)

**Peran kaprodi** berasal dari kombinasi `users.role_id = kaprodi` + `dosens.prodi_id`. Jadi prodi yang di-otorisasi untuk dilihat seorang kaprodi diambil dari relasi `dosens.user_id → users.id` lalu `dosens.prodi_id`.

---

### 2.6 `periodes`

**Fungsi**: master periode AMI (mis. "2025/2026").

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `tahun` | VARCHAR(10) | UNIQUE, NOT NULL | Tahun ajaran (mis. "2025/2026") |
| `is_active` | BOOLEAN | default `false` | Hanya satu periode boleh aktif |
| `tanggal_mulai` | DATE | NULL | Mulai pengisian |
| `tanggal_selesai` | DATE | NULL | Selesai pengisian |
| `created_at`, `updated_at` | TIMESTAMP | | |

Index: `periodes_tahun_key` (UNIQUE), `periodes_is_active_idx`.  
Relasi:
- `instrumens.periode_id → periodes.id`
- `isian_ami.periode_id → periodes.id`

---

### 2.7 `instrumens`

**Fungsi**: header instrumen audit pada satu periode.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `periode_id` | INT(10) | NULL, FK → `periodes.id` ON DELETE SET NULL | Periode tempat instrumen aktif |
| `nama_instrumen` | VARCHAR(50) | NOT NULL | "Instrumen AMI Program Studi 2025/2026" |
| `deskripsi` | TEXT | NULL | Catatan singkat |
| `is_active` | BOOLEAN | default `true` | |
| `created_by` | INT(10) | NULL, FK → `users.id` ON DELETE SET NULL | Admin yang membuat |
| `created_at`, `updated_at` | TIMESTAMP | | |

Index: `instrumens_periode_id_idx`, `instrumens_is_active_idx`, `instrumens_created_by_idx`.  
Relasi:
- `periodes.id ← instrumens.periode_id`
- `users.id ← instrumens.created_by`
- `kriteria_standars.instrumen_id → instrumens.id`

---

### 2.8 `kriteria_standars`

**Fungsi**: kriteria audit (level tertinggi struktur instrumen). Contoh: "C1: Visi, Misi, Tujuan dan Strategi".

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `instrumen_id` | INT(10) | NOT NULL, FK → `instrumens.id` ON DELETE CASCADE | |
| `kode_kriteria` | VARCHAR(50) | NOT NULL | "K1", "K2", dst |
| `nama_kriteria` | VARCHAR(50) | NOT NULL | Nama panjang kriteria |
| `deskripsi` | TEXT | NULL | |
| `urutan` | INT UNSIGNED | default 1 | Urutan tampil |
| `created_at`, `updated_at` | TIMESTAMP | | |

Index: `kriteria_standars_instrumen_id_idx`, `kriteria_standars_urutan_idx`, `kriteria_standars_instrumen_id_kode_kriteria_key` (UNIQUE composite).  
Relasi:
- `instrumens.id ← kriteria_standars.instrumen_id`
- `kode_amis.kriteria_id → kriteria_standars.id`

---

### 2.9 `kode_amis`

**Fungsi**: kode AMI per area pemeriksaan dalam satu kriteria. Contoh: "AMI 1.1", "AMI 1.2", dst.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `kriteria_id` | INT(10) | NOT NULL, FK → `kriteria_standars.id` ON DELETE CASCADE | |
| `kode_ami` | VARCHAR(50) | NOT NULL | Mis. "1.1 - AMI 1.1" |
| `urutan` | INT UNSIGNED | default 1 | |
| `created_at`, `updated_at` | TIMESTAMP | | |

Index: `kode_amis_kriteria_id_idx`, `kode_amis_urutan_idx`, `kode_amis_kriteria_id_kode_ami_key` (UNIQUE composite).  
Relasi:
- `kriteria_standars.id ← kode_amis.kriteria_id`
- `kode_ami_butir_standars.kode_ami_id → kode_amis.id`
- `deskripsi_areas.kode_ami_id → kode_amis.id`

---

### 2.10 `jenjang_standars`

**Fungsi**: master jenjang studi yang dipakai untuk butir standar (D3, Sarjana Terapan, S2 Magister).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `kode_jenjang` | VARCHAR(10) | UNIQUE, NOT NULL | "D3", "STR", "S2_MGTR" |
| `nama_jenjang` | VARCHAR(50) | NOT NULL | Nama tampil |
| `urutan` | INT UNSIGNED | default 1 | |
| `created_at`, `updated_at` | TIMESTAMP | | |

Index: `jenjang_standars_kode_jenjang_key` (UNIQUE).  
Relasi: `kode_ami_butir_standars.jenjang_id → jenjang_standars.id`.

---

### 2.11 `kode_ami_butir_standars`

**Fungsi**: matriks "kode AMI × jenjang" yang menyimpan no butir standar yang berlaku per jenjang. Contoh: AMI 1.1 di jenjang D3 → "1.1", di S2 → "1.1".

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `kode_ami_id` | INT(10) | NOT NULL, FK → `kode_amis.id` ON DELETE CASCADE | |
| `jenjang_id` | INT(10) | NOT NULL, FK → `jenjang_standars.id` ON DELETE RESTRICT | |
| `no_butir` | VARCHAR(50) | NULL | Nomor butir per jenjang |
| `created_at`, `updated_at` | TIMESTAMP | | |

Index: `kode_ami_butir_standars_kode_ami_id_idx`, `kode_ami_butir_standars_jenjang_id_idx`, dan UNIQUE composite `(kode_ami_id, jenjang_id)` agar satu kode AMI tidak punya dua butir untuk jenjang sama.

---

### 2.12 `deskripsi_areas`

**Fungsi**: deskripsi area audit yang berada di bawah satu kode AMI. Satu kode AMI bisa punya banyak deskripsi area.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `kode_ami_id` | INT(10) | NOT NULL, FK → `kode_amis.id` ON DELETE CASCADE | |
| `deskripsi_area_audit` | TEXT | NOT NULL | Narasi area audit |
| `target_standar` | TEXT | NULL | Target/standar yang harus dipenuhi |
| `urutan` | INT UNSIGNED | default 1 | |
| `created_at`, `updated_at` | TIMESTAMP | | |

Index: `deskripsi_areas_kode_ami_id_idx`, `deskripsi_areas_urutan_idx`.  
Relasi: `pemeriksaan_unsurs.deskripsi_area_id → deskripsi_areas.id`.

---

### 2.13 `pemeriksaan_unsurs`

**Fungsi**: unit terkecil yang akan diisi dosen. Setiap baris di kolom "Pemeriksaan Pada Unsur" di Excel disimpan jadi satu row.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `deskripsi_area_id` | INT(10) | NOT NULL, FK → `deskripsi_areas.id` ON DELETE CASCADE | |
| `isi_unsur` | TEXT | NOT NULL | Teks unsur yang diaudit |
| `urutan` | INT UNSIGNED | default 1 | |
| `created_at`, `updated_at` | TIMESTAMP | | |

Index: `pemeriksaan_unsurs_deskripsi_area_id_idx`, `pemeriksaan_unsurs_urutan_idx`.  
Relasi: `isian_ami.pemeriksaan_unsur_id → pemeriksaan_unsurs.id`.

---

### 2.14 `isian_ami`

**Fungsi**: tabel transaksi utama – berisi pengajuan AMI yang dibuat dosen. Setiap baris merepresentasikan satu kali pengisian oleh seorang dosen pada satu unsur dalam satu periode (untuk satu attempt).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `pemeriksaan_unsur_id` | INT(10) | NOT NULL, FK → `pemeriksaan_unsurs.id` ON DELETE RESTRICT | Unsur yang diisi |
| `periode_id` | INT(10) | NOT NULL, FK → `periodes.id` ON DELETE RESTRICT | |
| `dosen_id` | INT(10) | NOT NULL, FK → `dosens.id` ON DELETE RESTRICT | Pengisi |
| `prodi_id` | INT(10) | NULL, FK → `prodis.id` ON DELETE SET NULL | Prodi (snapshot dari dosen saat submit) |
| `judul_dokumen` | VARCHAR(100) | NULL | Judul bukti |
| `ketersediaan_standar` | ENUM('ada', 'tidak_ada') | default 'tidak_ada' | |
| `dokumen` | ENUM('ada', 'tidak_ada') | default 'tidak_ada' | |
| `pencapaian_standar_spt_pt` | BOOLEAN | default false | |
| `pencapaian_standar_sn_dikti` | BOOLEAN | default false | |
| `daya_saing_lokal` | BOOLEAN | default false | |
| `daya_saing_nasional` | BOOLEAN | default false | |
| `daya_saing_internasional` | BOOLEAN | default false | |
| `bukti_link` | VARCHAR(255) | NULL | URL eksternal (Google Drive dll) |
| `tahun_pelaksanaan` | CHAR(4) | NULL | "2024", "2025" |
| `capaian` | TEXT | NULL | |
| `keterangan` | TEXT | NULL | |
| `status` | ENUM('proses', 'valid', 'revisi') | default 'proses' | Status review |
| `catatan_kaprodi` | TEXT | NULL | Catatan ketika di-review |
| `reviewed_by` | INT(10) | NULL, FK → `users.id` ON DELETE SET NULL | Kaprodi pereview |
| `reviewed_at` | TIMESTAMP | NULL | Waktu review |
| `attempt` | INT UNSIGNED | default 1 | Counter percobaan (revisi → naik) |
| `submitted_at` | TIMESTAMP | NULL | Waktu submit |
| `created_at`, `updated_at` | TIMESTAMP | | |

Index:
- `isian_ami_pemeriksaan_unsur_id_idx`
- `isian_ami_periode_id_idx`
- `isian_ami_dosen_id_idx`
- `isian_ami_prodi_id_idx`
- `isian_ami_status_idx`
- `isian_ami_reviewed_by_idx`
- `isian_ami_submitted_at_idx`
- UNIQUE composite `(pemeriksaan_unsur_id, periode_id, dosen_id, attempt)` – mencegah duplikat untuk attempt yang sama.

**Catatan penting**:
- Karena pengisian bersifat **kolektif per-prodi**, banyak dosen di prodi sama bisa mengisi unsur yang sama. Server merangkum status terbaru per (unsur, dosen) lewat `attempt` di endpoint `/api/isians/by-unsur`.
- Kolom `prodi_id` disnapshot dari `dosens.prodi_id` saat submit, supaya seandainya dosen berpindah prodi, isian yang sudah ada tetap milik prodi lama.

---

### 2.15 `isian_bukti_files`

**Fungsi**: file bukti (PDF/JPG/PNG) yang diunggah dosen untuk sebuah isian. Satu isian bisa punya banyak file.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `isian_id` | INT(10) | NOT NULL, FK → `isian_ami.id` ON DELETE CASCADE | |
| `original_name` | VARCHAR(50) | NOT NULL | Nama file asli (terpotong 50) |
| `file_name` | VARCHAR(50) | NOT NULL | Nama file yang disimpan di server |
| `file_path` | VARCHAR(100) | NOT NULL | Path relatif (mis. `/uploads/bukti/...`) |
| `mime_type` | VARCHAR(50) | NULL | |
| `file_size` | INT(10) | NULL | dalam bytes |
| `uploaded_by` | INT(10) | NULL, FK → `users.id` ON DELETE SET NULL | |
| `created_at` | TIMESTAMP | default | |

Index: `isian_bukti_files_isian_id_idx`, `isian_bukti_files_uploaded_by_idx`.  
Relasi: `isian_ami.id ← isian_bukti_files.isian_id`, `users.id ← isian_bukti_files.uploaded_by`.

---

### 2.16 `isian_review_logs`

**Fungsi**: jejak audit (audit trail) untuk setiap kali kaprodi mereview sebuah isian. Berguna untuk melihat history perubahan status.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | INT(10) | PK | |
| `isian_id` | INT(10) | NOT NULL, FK → `isian_ami.id` ON DELETE CASCADE | |
| `reviewer_id` | INT(10) | NULL, FK → `users.id` ON DELETE SET NULL | Kaprodi pereview |
| `status_sebelum` | ENUM | NULL | Status sebelum review |
| `status_sesudah` | ENUM | NOT NULL | Status sesudah review |
| `catatan` | TEXT | NULL | Catatan kaprodi |
| `created_at` | TIMESTAMP | default | |

Index: `isian_review_logs_isian_id_idx`, `isian_review_logs_reviewer_id_idx`, `isian_review_logs_status_sesudah_idx`.

---

## 3. Hirarki Struktur Instrumen AMI

```
Periode (1)
   └─ Instrumen (N)
         └─ Kriteria Standar (N)               [contoh: K1: Visi & Misi]
               └─ Kode AMI (N)                  [contoh: AMI 1.1]
                     ├─ Butir Standar (N) ─→ Jenjang (D3/STR/S2)
                     └─ Deskripsi Area (N)
                           └─ Pemeriksaan Unsur (N)   ← objek isian dosen
                                 └─ Isian AMI (N) per dosen × attempt
                                        ├─ Bukti File (N)
                                        └─ Review Log (N)
```

Hirarki ini menjelaskan kenapa hampir semua FK turun ke bawah memakai `ON DELETE CASCADE`: jika instrumen dihapus, seluruh struktur turunannya ikut hilang.

---

## 4. Pola Query & Join Utama

Berikut query-join yang dipakai aplikasi (dalam SQL plain – Prisma di belakang layar).

### 4.1 Login + ambil profil dengan prodi

```sql
SELECT u.id, u.email, u.password, u.is_active,
       r.id  AS role_id, r.nama_role,
       d.id  AS dosen_id, d.nip, d.nama_lengkap,
       p.id  AS prodi_id, p.nama_prodi, p.jenjang
FROM   users u
       LEFT JOIN roles  r ON r.id = u.role_id
       LEFT JOIN dosens d ON d.user_id = u.id
       LEFT JOIN prodis p ON p.id = d.prodi_id
WHERE  u.email = ?
LIMIT  1;
```

### 4.2 Resolve Prodi Kaprodi (untuk filtering otorisasi)

```sql
SELECT d.prodi_id
FROM   dosens d
WHERE  d.user_id = ?
LIMIT  1;
```

### 4.3 Tree Struktur Instrumen (untuk halaman Isi AMI)

Prisma menyusun ini sebagai nested include. SQL setara:

```sql
SELECT k.id  AS kriteria_id, k.kode_kriteria, k.nama_kriteria,
       a.id  AS kode_ami_id, a.kode_ami,
       da.id AS deskripsi_area_id, da.deskripsi_area_audit,
       pu.id AS pemeriksaan_unsur_id, pu.isi_unsur
FROM   kriteria_standars  k
       JOIN kode_amis           a  ON a.kriteria_id     = k.id
       JOIN deskripsi_areas     da ON da.kode_ami_id    = a.id
       JOIN pemeriksaan_unsurs  pu ON pu.deskripsi_area_id = da.id
WHERE  k.instrumen_id = ?
ORDER  BY k.urutan, a.urutan, da.urutan, pu.urutan;
```

### 4.4 Status Kolektif Per Unsur (`/api/isians/by-unsur`)

```sql
SELECT i.pemeriksaan_unsur_id,
       SUM(i.status = 'valid')  AS n_valid,
       SUM(i.status = 'proses') AS n_proses,
       SUM(i.status = 'revisi') AS n_revisi,
       COUNT(*) AS total
FROM   (
         SELECT *
         FROM   isian_ami
         WHERE  periode_id = ?
           AND  prodi_id   = ?
       ) AS x
       JOIN isian_ami i ON i.id = x.id
GROUP  BY i.pemeriksaan_unsur_id;
```

Logika gabungan di server: untuk tiap (unsur, dosen) ambil row dengan `attempt` tertinggi, lalu turunkan status kolektif:
- `valid > 0` → unsur dianggap **valid**
- else jika `revisi > 0` → unsur **revisi**
- else jika `proses > 0` → unsur **proses**
- else → **kosong**

### 4.5 Daftar Isian yang Menunggu Review Kaprodi

```sql
SELECT i.id, i.judul_dokumen, i.submitted_at,
       d.nama_lengkap AS dosen_nama, d.nip,
       a.kode_ami,
       k.nama_kriteria
FROM   isian_ami         i
       JOIN dosens             d ON d.id = i.dosen_id
       JOIN pemeriksaan_unsurs pu ON pu.id = i.pemeriksaan_unsur_id
       JOIN deskripsi_areas    da ON da.id = pu.deskripsi_area_id
       JOIN kode_amis          a  ON a.id  = da.kode_ami_id
       JOIN kriteria_standars  k  ON k.id  = a.kriteria_id
WHERE  i.periode_id = ?
  AND  i.prodi_id   = ?           -- prodi kaprodi
  AND  i.status     = 'proses'
ORDER  BY i.submitted_at DESC
LIMIT  5;
```

### 4.6 Update Review (Atomic Transaction)

```sql
START TRANSACTION;

UPDATE isian_ami
SET    status         = 'valid',     -- atau 'revisi'
       catatan_kaprodi = ?,
       reviewed_by    = ?,           -- user id kaprodi
       reviewed_at    = NOW()
WHERE  id = ?;

INSERT INTO isian_review_logs
       (isian_id, reviewer_id, status_sebelum, status_sesudah, catatan)
VALUES (?, ?, 'proses', 'valid', ?);

COMMIT;
```

### 4.7 Rekap Statistik Status (`/api/isians/summary`)

```sql
SELECT status, COUNT(*) AS jumlah
FROM   isian_ami
WHERE  periode_id = ?
  AND  (prodi_id = ? OR ? IS NULL)
GROUP  BY status;
```

---

## 5. View / Virtual View yang Direkomendasikan

Saat ini aplikasi tidak membuat `VIEW` di MySQL (semua agregasi dilakukan di sisi aplikasi via Prisma). Namun untuk kebutuhan reporting/UML/DFD, view-view berikut dapat ditambahkan di MySQL:

### 5.1 `v_user_lengkap`

Gabungan user, role, dosen, prodi, dan jurusan. Memudahkan query kontekstual.

```sql
CREATE OR REPLACE VIEW v_user_lengkap AS
SELECT u.id              AS user_id,
       u.email,
       u.is_active,
       u.last_login_at,
       r.nama_role        AS role,
       d.id              AS dosen_id,
       d.nip,
       d.nama_lengkap,
       d.status_kepegawaian,
       p.id              AS prodi_id,
       p.nama_prodi,
       p.jenjang,
       j.id              AS jurusan_id,
       j.nama_jurusan
FROM   users    u
LEFT   JOIN roles    r ON r.id        = u.role_id
LEFT   JOIN dosens   d ON d.user_id   = u.id
LEFT   JOIN prodis   p ON p.id        = d.prodi_id
LEFT   JOIN jurusans j ON j.id        = p.jurusan_id;
```

### 5.2 `v_struktur_instrumen`

Pohon datar instrumen untuk reporting Excel/PDF.

```sql
CREATE OR REPLACE VIEW v_struktur_instrumen AS
SELECT i.id              AS instrumen_id,
       i.nama_instrumen,
       p.tahun           AS periode,
       k.id              AS kriteria_id,
       k.kode_kriteria,
       k.nama_kriteria,
       a.id              AS kode_ami_id,
       a.kode_ami,
       da.id             AS deskripsi_area_id,
       da.deskripsi_area_audit,
       pu.id             AS pemeriksaan_unsur_id,
       pu.isi_unsur,
       k.urutan, a.urutan, da.urutan, pu.urutan
FROM   instrumens         i
LEFT   JOIN periodes               p  ON p.id  = i.periode_id
JOIN   kriteria_standars  k        ON k.instrumen_id     = i.id
JOIN   kode_amis          a        ON a.kriteria_id      = k.id
JOIN   deskripsi_areas    da       ON da.kode_ami_id     = a.id
JOIN   pemeriksaan_unsurs pu       ON pu.deskripsi_area_id = da.id;
```

### 5.3 `v_isian_lengkap`

Isian + konteks lengkap (dosen, prodi, kriteria) untuk monitoring.

```sql
CREATE OR REPLACE VIEW v_isian_lengkap AS
SELECT i.id               AS isian_id,
       i.status,
       i.attempt,
       i.judul_dokumen,
       i.submitted_at,
       i.reviewed_at,
       d.nama_lengkap     AS dosen_nama,
       d.nip,
       p.nama_prodi,
       p.jenjang,
       per.tahun          AS periode,
       k.kode_kriteria,
       k.nama_kriteria,
       a.kode_ami,
       da.deskripsi_area_audit,
       pu.isi_unsur,
       reviewer.email     AS reviewer_email
FROM   isian_ami           i
JOIN   dosens              d   ON d.id   = i.dosen_id
LEFT   JOIN prodis              p   ON p.id   = i.prodi_id
JOIN   periodes            per ON per.id = i.periode_id
JOIN   pemeriksaan_unsurs  pu  ON pu.id  = i.pemeriksaan_unsur_id
JOIN   deskripsi_areas     da  ON da.id  = pu.deskripsi_area_id
JOIN   kode_amis           a   ON a.id   = da.kode_ami_id
JOIN   kriteria_standars   k   ON k.id   = a.kriteria_id
LEFT   JOIN users               reviewer ON reviewer.id = i.reviewed_by;
```

### 5.4 `v_status_unsur_prodi`

Status kolektif tiap unsur per (prodi, periode) – berguna untuk dashboard Kaprodi.

```sql
CREATE OR REPLACE VIEW v_status_unsur_prodi AS
SELECT i.prodi_id,
       i.periode_id,
       i.pemeriksaan_unsur_id,
       SUM(i.status = 'valid')  AS n_valid,
       SUM(i.status = 'revisi') AS n_revisi,
       SUM(i.status = 'proses') AS n_proses,
       COUNT(DISTINCT i.dosen_id) AS n_dosen,
       MAX(i.updated_at)        AS last_update
FROM   isian_ami i
GROUP  BY i.prodi_id, i.periode_id, i.pemeriksaan_unsur_id;
```

Status agregat unsur lalu diturunkan oleh aplikasi:
- `n_valid > 0` → `valid`
- else `n_revisi > 0` → `revisi`
- else `n_proses > 0` → `proses`
- else → `kosong`

### 5.5 `v_progress_prodi`

Total unsur, terisi, dan perlu revisi per (prodi, periode).

```sql
CREATE OR REPLACE VIEW v_progress_prodi AS
SELECT  per.id   AS periode_id,
        per.tahun AS periode,
        p.id     AS prodi_id,
        p.nama_prodi,
        (
          SELECT COUNT(*) FROM pemeriksaan_unsurs pu2
          JOIN deskripsi_areas    da2 ON da2.id = pu2.deskripsi_area_id
          JOIN kode_amis          a2  ON a2.id  = da2.kode_ami_id
          JOIN kriteria_standars  k2  ON k2.id  = a2.kriteria_id
          JOIN instrumens         i2  ON i2.id  = k2.instrumen_id
          WHERE i2.periode_id = per.id
        ) AS total_unsur,
        SUM(v.n_valid > 0)                            AS unsur_valid,
        SUM(v.n_valid = 0 AND v.n_proses > 0)         AS unsur_proses,
        SUM(v.n_valid = 0 AND v.n_proses = 0 AND v.n_revisi > 0) AS unsur_revisi
FROM   v_status_unsur_prodi v
       JOIN prodis   p   ON p.id   = v.prodi_id
       JOIN periodes per ON per.id = v.periode_id
GROUP  BY per.id, p.id;
```

---

## 6. Indeks & Optimasi

Indeks kunci yang sudah dibuat (`@@index` di Prisma):

- `users.role_id`
- `prodis.jurusan_id`
- `dosens.prodi_id`, `dosens.user_id` (UNIQUE)
- `periodes.is_active`
- `instrumens.periode_id`, `instrumens.is_active`, `instrumens.created_by`
- `kriteria_standars.instrumen_id`, `kriteria_standars.urutan`
- `kode_amis.kriteria_id`, `kode_amis.urutan`
- `kode_ami_butir_standars.kode_ami_id`, `.jenjang_id`
- `deskripsi_areas.kode_ami_id`, `.urutan`
- `pemeriksaan_unsurs.deskripsi_area_id`, `.urutan`
- `isian_ami.pemeriksaan_unsur_id`, `.periode_id`, `.dosen_id`, `.prodi_id`, `.status`, `.reviewed_by`, `.submitted_at`
- `isian_bukti_files.isian_id`, `.uploaded_by`
- `isian_review_logs.isian_id`, `.reviewer_id`, `.status_sesudah`

UNIQUE composite penting:
- `(prodis.nama_prodi, jurusans.id)` – cegah duplikat prodi dalam jurusan.
- `(kriteria_standars.instrumen_id, kriteria_standars.kode_kriteria)` – cegah duplikat kode kriteria.
- `(kode_amis.kriteria_id, kode_amis.kode_ami)` – cegah duplikat kode AMI.
- `(kode_ami_butir_standars.kode_ami_id, kode_ami_butir_standars.jenjang_id)` – satu butir per jenjang.
- `(isian_ami.pemeriksaan_unsur_id, isian_ami.periode_id, isian_ami.dosen_id, isian_ami.attempt)` – satu attempt per (unsur, periode, dosen).

---

## 7. ERD (Crow's Foot, Tekstual)

```
┌─────────┐  1   *  ┌─────────┐
│ roles   │────────→│ users   │
└─────────┘         └─────────┘
                       │ 1
                       │
                       │ 1
                  ┌─────────┐  *   1  ┌─────────┐  *   1  ┌──────────┐
                  │ dosens  │────────→│ prodis  │────────→│ jurusans │
                  └─────────┘         └─────────┘         └──────────┘
                       │ 1                 │
                       │ N                 │ 1
                  ┌────────────┐           │
                  │ isian_ami  │←──────────┘ N (snapshot prodi_id)
                  └────────────┘
                       ↑ N            ↑ N           ↑ N
                       │              │             │
                       │              │             │
              ┌────────────────┐      │     ┌──────────────────┐
              │ isian_bukti_   │      │     │ isian_review_logs│
              │ files          │      │     └──────────────────┘
              └────────────────┘      │
                                      │
                                      │
                                      │
            ┌─────────┐ 1   *  ┌──────────────┐ 1  * ┌──────────────────┐
            │ periode │───────→│ instrumens   │─────→│ kriteria_standars│
            └─────────┘        └──────────────┘      └──────────────────┘
                                                            │ 1
                                                            ↓ *
                                                      ┌────────────┐
                                                      │ kode_amis  │
                                                      └────────────┘
                                                       1 ↓ *      1 ↓ *
                                              ┌─────────────────┐  ┌──────────────────────┐
                                              │ deskripsi_areas │  │ kode_ami_butir_      │
                                              └─────────────────┘  │ standars             │
                                                       1 ↓ *       └──────────────────────┘
                                              ┌────────────────────┐         ↑ N
                                              │ pemeriksaan_unsurs │         │
                                              └────────────────────┘   ┌──────────────────┐
                                                       1 ↓ *           │ jenjang_standars │
                                              ┌────────────┐           └──────────────────┘
                                              │ isian_ami  │
                                              └────────────┘
```

---

## 8. Aturan Bisnis Penting yang Tertanam di Database

1. **Email user unik** – satu orang satu akun.
2. **NIP dosen unik** – mencegah duplikasi profil.
3. **`(unsur, periode, dosen, attempt)` unik** – tidak boleh ada dua isian dengan attempt sama.
4. **Cascade delete** untuk struktur AMI – hapus instrumen otomatis menghapus turunannya.
5. **Restrict delete** untuk transaksi isian – tidak boleh hapus periode/dosen/unsur jika sudah ada isian terkait.
6. **Snapshot `prodi_id` di `isian_ami`** – isian dosen tetap milik prodi lama meski dosen pindah.
7. **`is_active`** ada di `users`, `dosens`, `instrumens`, `periodes` – soft inactive tanpa hapus.
8. **Audit trail** – setiap perubahan status review otomatis dicatat di `isian_review_logs` (lewat aplikasi).

---

## 9. Konfigurasi Koneksi

`.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/ami_prodi"
JWT_SECRET="..."
JWT_EXPIRES_IN="7d"
```

Migrasi: `npx prisma migrate dev` (development) atau `npx prisma db push --force-reset` (untuk reset full).  
Seed: `npx prisma db seed` (membaca `prisma/seed.ts`).

---
