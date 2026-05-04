# Panduan Testing API Aplikasi AMI Prodi

Dokumen ini berisi daftar lengkap endpoint REST API aplikasi AMI Prodi beserta instruksi dan parameter yang dibutuhkan untuk melakukan testing menggunakan tools seperti **Postman**, **Insomnia**, atau ekstensi VS Code (**Thunder Client**).

---

## 🛠️ Persiapan Awal

1. **Jalankan Server Development**
   Pastikan server lokal sudah berjalan. Di terminal *root* proyek, jalankan:
   ```bash
   npm run dev
   ```
2. **Base URL**
   Semua *request* harus diarahkan ke URL dasar berikut:
   `http://localhost:3000/api`
3. **Autentikasi (Bearer Token)**
   Hampir seluruh endpoint diproteksi. Cara mengaturnya di Postman:
   - Hit endpoint **Login** terlebih dahulu (lihat Bagian 1).
   - Salin isi field `token` dari *response* JSON.
   - Pada request endpoint lain, buka tab **Authorization**.
   - Pilih **Type:** `Bearer Token`.
   - Paste token ke dalam kolom **Token**.

---

## 🔐 1. Endpoint Autentikasi

### A. Login
- **Method:** `POST`
- **URL:** `/auth/login`
- **Akses:** Public (Tanpa Token)
- **Tipe Body:** `application/json` (Pilih tab **Raw** -> JSON)
- **Body Request:**
  ```json
  {
    "email": "admin@example.com",
    "password": "password123"
  }
  ```

### B. Dapatkan Profil Saat Ini (Me)
- **Method:** `GET`
- **URL:** `/auth/me`
- **Akses:** Semua Role (Perlu Token)
- **Body Request:** *(Kosong)*

---

## 👑 2. Manajemen Master Data (Hanya Admin)
> **Penting:** Pastikan menggunakan token dari akun berstatus `Admin`. Semua body di bagian ini menggunakan **Raw -> JSON**.

### A. Kelola Data User
| Method | URL | Penjelasan & Parameter |
|---|---|---|
| `GET` | `/users` | Menampilkan seluruh data user. <br> *Body Kosong.* |
| `POST` | `/users` | Membuat user baru. <br> **Body:** `{"email": "dosenbaru@mail.com", "password": "123", "role_id": 3}` |
| `PUT` | `/users/[id]` | Edit user (ganti `[id]` dengan ID asli). <br> **Body:** `{"email": "edit@mail.com"}` *(semua opsional)* |
| `DELETE` | `/users/[id]` | Menghapus data user. <br> *Body Kosong.* |

### B. Kelola Data Jurusan
| Method | URL | Penjelasan & Parameter |
|---|---|---|
| `GET` | `/jurusans` | Menampilkan seluruh data jurusan. <br> *Body Kosong.* |
| `POST` | `/jurusans` | Membuat jurusan baru. <br> **Body:** `{"nama_jurusan": "Teknik Elektro"}` |
| `PUT` | `/jurusans/[id]` | Mengedit nama jurusan. <br> **Body:** `{"nama_jurusan": "Teknik Mesin"}` |
| `DELETE` | `/jurusans/[id]` | Menghapus jurusan beserta prodinya (Otomatis Cascade). <br> *Body Kosong.* |

### C. Kelola Data Prodi
| Method | URL | Penjelasan & Parameter |
|---|---|---|
| `GET` | `/prodis` | Menampilkan semua data Prodi. <br> *Body Kosong.* |
| `POST` | `/prodis` | Menambahkan prodi dan di-assign ke jurusan. <br> **Body:** `{"nama_prodi": "D4 TRPL", "jurusan_id": 1}` |
| `PUT` | `/prodis/[id]` | Edit data prodi. <br> **Body:** Sama seperti POST. |
| `DELETE` | `/prodis/[id]` | Hapus prodi. <br> *Body Kosong.* |

### D. Kelola Data Dosen
| Method | URL | Penjelasan & Parameter |
|---|---|---|
| `GET` | `/dosens` | Menampilkan data dosen berserta nama relasi user & prodinya. <br> *Body Kosong.* |
| `GET` | `/dosens/[id]` | Detail spesifik dosen 1 orang. <br> *Body Kosong.* |
| `POST` | `/dosens` | Membuat data dosen baru. <br> **Body:** `{"nip": "1990...", "nama_lengkap": "Budi", "user_id": 3, "prodi_id": 1}` |
| `PUT` | `/dosens/[id]` | Edit biodata dosen. <br> **Body:** Sama seperti POST. |
| `DELETE` | `/dosens/[id]` | Hapus data dosen. <br> *Body Kosong.* |

---

## 🗂️ 3. Instrumen & Periode AMI (Hanya Admin)
> **Penting:** Semua body menggunakan **Raw -> JSON**.

### A. Kelola Periode AMI
| Method | URL | Penjelasan & Parameter |
|---|---|---|
| `POST` | `/periodes` | **Body:** `{"tahun": "2024/2025", "is_active": false}` |
| `GET` | `/periodes` | Menampilkan data periode beserta hitungan isian dan instrumennya. |
| `PUT` | `/periodes/[id]` | **Body:** `{"tahun": "2025/2026"}` |
| `PATCH`| `/periodes/[id]/activate`| **Mengaktifkan 1 periode khusus**. Ini otomatis akan mematikan status `is_active` periode yang lain. <br> *Body Kosong.* |
| `DELETE`| `/periodes/[id]` | Hapus data periode. |

### B. Kelola Instrumen
| Method | URL | Penjelasan & Parameter |
|---|---|---|
| `POST` | `/instrumens` | **Body:** `{"nama_instrumen": "Pendidikan", "periode_id": 1}` |
| `GET` | `/instrumens` | Bisa di-filter by URL Query: `/instrumens?periode_id=1` |
| `PUT` | `/instrumens/[id]` | **Body:** Sama seperti POST |
| `DELETE`| `/instrumens/[id]` | Hapus instrumen. |

### C. Kelola Butir Instrumen
| Method | URL | Penjelasan & Parameter |
|---|---|---|
| `POST` | `/butirs` | **Body:** `{"kode_butir": "A.1", "deskripsi_area_audit": "...", "target_standar": "...", "instrumen_id": 1}` |
| `GET` | `/butirs` | Bisa di-filter by URL Query: `/butirs?instrumen_id=1` |
| `PUT` | `/butirs/[id]` | **Body:** Sama seperti POST |
| `DELETE`| `/butirs/[id]` | Hapus butir. |

---

## 📝 4. Isian AMI (Dosen & Kaprodi)

### A. Kirim / Submit Isian Baru (Role: Dosen)
- **Method:** `POST`
- **URL:** `/isians`
- **Tipe Body:** PENTING! Harus menggunakan **`form-data`** (bukan JSON), karena terdapat *file upload*.
- **Parameter Form Data:**
  - `butir_id` (Teks/Angka): 1
  - `periode_id` (Teks/Angka): 1
  - `judul_dokumen` (Teks): Laporan Keuangan
  - `ketersediaan_standar` (Teks): pilih `ada` atau `tidak_ada`
  - `dokumen` (Teks): pilih `ada` atau `tidak_ada`
  - `pencapaian_standar_spt_pt` (Teks): `true` atau `false`
  - `pencapaian_standar_sn_dikti` (Teks): `true` atau `false`
  - `lokal`, `nasional`, `internasional` (Teks): `true` atau `false`
  - `tahun_pelaksanaan` (Teks): "2024"
  - `bukti_link` (Teks opsional): "https://gdrive..."
  - `bukti_dokumen` **(Tipe: FILE)**: Silakan upload file PDF/doc Anda. 

### B. Lihat Isian (Role: Dosen & Kaprodi)
- **Method:** `GET`
- **URL:** `/isians`
- **Penjelasan:** Otomatis menyesuaikan role. Dosen hanya melihat miliknya. Kaprodi melihat semuanya.
- **Filter Query URL (Opsional):**
  - `/isians?periode_id=1`
  - `/isians?status=proses` (Bisa `valid`, `revisi`, atau `proses`)
  - `/isians?dosen_id=2` (Hanya Kaprodi)

### C. Update Data Isian (Role: Dosen)
- **Method:** `PUT`
- **URL:** `/isians/[id]`
- **Penjelasan:** Format Body persis sama seperti fitur **A (POST Submit)** di atas menggunakan `form-data`.
- **Aturan:** Anda hanya meng-update kolom tertentu saja. Status otomatis akan terganti ke `proses` lagi. Jika status sudah `valid`, API akan otomatis menolak proses *update*.

### D. Approval / Review Kaprodi (Role: Kaprodi)
- **Method:** `PATCH`
- **URL:** `/isians/[id]/review`
- **Tipe Body:** `application/json` (Raw -> JSON)
- **Body Request:**
  ```json
  {
    "status": "valid",
    "catatan_kaprodi": "Bagus, standar terpenuhi."
  }
  ```
  *Pilihan status: `valid` atau `revisi`.*

### E. Statistik / Summary Kaprodi (Role: Kaprodi)
- **Method:** `GET`
- **URL:** `/isians/summary?periode_id=1`
- **Penjelasan:** Mengembalikan total statistik berupa angka dari berapa banyak isian yang ada, status `valid`, `revisi`, `proses`, dan jumlah Dosen yang terlibat pada periode tertentu.
