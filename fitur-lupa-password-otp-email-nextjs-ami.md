# Rencana Fitur Lupa Password dengan OTP Email - Next.js AMI Prodi

## 1. Tujuan Fitur

Tambahkan fitur **Lupa Password** pada aplikasi Next.js AMI Prodi.

Fitur ini digunakan oleh user yang lupa password, terutama role:

- Dosen
- Kaprodi
- Admin jika diperlukan

Alur utama:

```text
User klik Lupa Password
↓
User memasukkan email akun AMI
↓
Sistem validasi apakah email terdaftar
↓
Sistem membuat OTP
↓
OTP dikirim dari email sistem: amiprodiiktrk@gmail.com
↓
User membuka email dan memasukkan OTP
↓
Sistem validasi OTP
↓
User membuat password baru
↓
Password disimpan dalam bentuk hash bcrypt
↓
User bisa login dengan password baru
```

Catatan penting:

```text
Email amiprodiiktrk@gmail.com digunakan sebagai email pengirim OTP.
Bukan berarti OTP diteruskan manual, tetapi sistem Next.js mengirim OTP otomatis melalui SMTP menggunakan email tersebut.
```

---

## 2. Konsep Fitur

Fitur ini terdiri dari 3 halaman utama:

```text
/lupa-password
/verifikasi-otp
/reset-password
```

Atau bisa dibuat dalam satu halaman dengan 3 step:

```text
Step 1: Input Email
Step 2: Input OTP
Step 3: Buat Password Baru
```

Rekomendasi:

```text
Gunakan multi-step form dalam satu flow agar lebih sederhana dan rapi.
```

---

## 3. Library yang Dibutuhkan

Tambahkan library berikut pada project Next.js:

```text
nodemailer
bcryptjs
zod
```

Fungsi library:

### `nodemailer`

Untuk mengirim OTP dari email sistem ke email user.

Email pengirim:

```text
amiprodiiktrk@gmail.com
```

### `bcryptjs`

Untuk hash password baru sebelum disimpan ke database.

### `zod`

Untuk validasi request body seperti email, OTP, dan password baru.

Jika project sudah menggunakan `bcryptjs`, tidak perlu install ulang.

---

## 4. Environment Variable yang Dibutuhkan

Tambahkan konfigurasi pada file `.env`.

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=amiprodiiktrk@gmail.com
SMTP_PASS=ISI_APP_PASSWORD_GMAIL
OTP_EXPIRED_MINUTES=10
```

Catatan:

```text
SMTP_PASS bukan password login Gmail biasa.
Gunakan App Password Gmail.
Akun Gmail harus mengaktifkan 2-Step Verification agar bisa membuat App Password.
```

Jangan commit file `.env` ke GitHub.

---

## 5. Update Database

Tambahkan tabel baru untuk menyimpan OTP reset password.

Nama tabel yang disarankan:

```text
password_reset_otps
```

Tabel ini digunakan untuk menyimpan OTP sementara.

Semua ID tetap menggunakan **Int**, bukan BigInt.

Struktur tabel yang dibutuhkan:

```text
id
user_id
email
otp_hash
expires_at
used_at
attempt_count
created_at
updated_at
```

Penjelasan field:

### `id`

Primary key dengan tipe **Int**.

### `user_id`

Relasi ke tabel `users.id`.

Tipe tetap **Int**.

### `email`

Email user yang meminta reset password.

### `otp_hash`

OTP tidak disimpan dalam bentuk asli.

OTP harus disimpan dalam bentuk hash agar lebih aman.

### `expires_at`

Waktu OTP kedaluwarsa.

Contoh:

```text
OTP berlaku 10 menit
```

### `used_at`

Waktu OTP dipakai.

Jika masih `null`, berarti OTP belum digunakan.

### `attempt_count`

Jumlah percobaan input OTP.

Digunakan untuk membatasi percobaan salah OTP.

### `created_at`

Waktu data OTP dibuat.

### `updated_at`

Waktu data OTP diperbarui.

---

## 6. Prisma Model yang Dibutuhkan

Tambahkan model baru di Prisma schema dengan nama:

```text
PasswordResetOtp
```

Catatan penting:

```text
Semua ID dan foreign key tetap Int.
Jangan ubah menjadi BigInt.
```

Relasi:

```text
User
└── PasswordResetOtp
```

Satu user bisa memiliki banyak request OTP reset password.

Namun hanya OTP terbaru yang aktif.

---

## 7. Aturan Keamanan OTP

Terapkan aturan berikut:

1. OTP terdiri dari 6 digit angka.
2. OTP berlaku selama 10 menit.
3. OTP hanya boleh digunakan satu kali.
4. OTP yang sudah digunakan harus diberi `used_at`.
5. OTP yang kedaluwarsa tidak boleh dipakai.
6. OTP disimpan dalam bentuk hash, bukan plain text.
7. Maksimal percobaan salah OTP adalah 5 kali.
8. Jika user meminta OTP baru, OTP lama untuk user tersebut boleh dianggap tidak aktif.
9. Sistem tidak boleh memberi tahu terlalu detail apakah email terdaftar atau tidak untuk alasan keamanan.
10. Namun untuk kebutuhan aplikasi internal kampus, pesan boleh dibuat ramah seperti:
    - "Jika email terdaftar, kode OTP akan dikirim."

---

## 8. Endpoint API yang Dibutuhkan

Buat 3 endpoint utama.

---

### 8.1 Request OTP

Endpoint:

```text
POST /api/auth/forgot-password/request-otp
```

Fungsi:

```text
Menerima email user, membuat OTP, menyimpan OTP hash ke database, lalu mengirim OTP ke email user.
```

Request body:

```json
{
  "email": "dosen@polines.ac.id"
}
```

Proses:

1. Validasi format email.
2. Cari user berdasarkan email.
3. Pastikan user aktif.
4. Jika user ditemukan:
   - Generate OTP 6 digit.
   - Hash OTP.
   - Simpan ke tabel `password_reset_otps`.
   - Kirim OTP ke email user.
5. Response tetap dibuat aman.

Response sukses:

```json
{
  "message": "Jika email terdaftar, kode OTP akan dikirim."
}
```

Catatan:

```text
Jangan mengirim OTP jika user tidak ditemukan.
Namun response tetap dibuat sama agar tidak membuka informasi akun.
```

---

### 8.2 Verify OTP

Endpoint:

```text
POST /api/auth/forgot-password/verify-otp
```

Fungsi:

```text
Memvalidasi OTP yang dimasukkan user.
```

Request body:

```json
{
  "email": "dosen@polines.ac.id",
  "otp": "123456"
}
```

Proses:

1. Validasi email dan OTP.
2. Cari OTP terbaru berdasarkan email.
3. Pastikan `used_at` masih null.
4. Pastikan `expires_at` belum lewat.
5. Pastikan `attempt_count` belum melewati batas.
6. Bandingkan OTP input dengan `otp_hash`.
7. Jika salah:
   - Tambah `attempt_count`.
   - Beri response error.
8. Jika benar:
   - Beri tanda bahwa OTP valid.
   - Bisa memakai token reset sementara atau simpan session sementara di frontend.

Response sukses:

```json
{
  "message": "OTP valid. Silakan buat password baru.",
  "reset_token": "temporary-reset-token"
}
```

Catatan:

```text
Agar lebih aman, setelah OTP valid, sistem bisa membuat reset token sementara.
Reset token ini dipakai saat endpoint reset password.
```

---

### 8.3 Reset Password

Endpoint:

```text
POST /api/auth/forgot-password/reset
```

Fungsi:

```text
Mengubah password user setelah OTP valid.
```

Request body:

```json
{
  "email": "dosen@polines.ac.id",
  "otp": "123456",
  "password": "passwordbaru123",
  "confirm_password": "passwordbaru123"
}
```

Alternatif lebih aman:

```json
{
  "reset_token": "temporary-reset-token",
  "password": "passwordbaru123",
  "confirm_password": "passwordbaru123"
}
```

Proses:

1. Validasi password baru.
2. Pastikan password dan confirm password sama.
3. Pastikan OTP atau reset token valid.
4. Hash password baru dengan bcryptjs.
5. Update tabel `users.password`.
6. Tandai OTP sebagai sudah digunakan dengan `used_at`.
7. Hapus atau nonaktifkan OTP lama untuk user tersebut.
8. Response sukses.

Response sukses:

```json
{
  "message": "Password berhasil diubah. Silakan login."
}
```

---

## 9. Halaman Frontend yang Dibutuhkan

### 9.1 Halaman Lupa Password

Route:

```text
/lupa-password
```

Komponen:

- Input email
- Tombol Kirim OTP
- Link kembali ke Login

Validasi:

- Email wajib diisi
- Format email harus valid

Setelah berhasil:

```text
Arahkan user ke halaman input OTP
```

---

### 9.2 Halaman Verifikasi OTP

Route:

```text
/verifikasi-otp
```

Komponen:

- Input OTP 6 digit
- Tombol Verifikasi OTP
- Tombol Kirim Ulang OTP
- Informasi waktu berlaku OTP

Validasi:

- OTP wajib 6 digit angka

Setelah berhasil:

```text
Arahkan user ke halaman reset password
```

---

### 9.3 Halaman Reset Password

Route:

```text
/reset-password
```

Komponen:

- Input password baru
- Input konfirmasi password
- Tombol Simpan Password Baru

Validasi:

- Password minimal 8 karakter
- Konfirmasi password harus sama
- Password tidak boleh kosong

Setelah berhasil:

```text
Arahkan user ke halaman login
Tampilkan toast: Password berhasil diubah
```

---

## 10. Desain UI yang Disarankan

Gunakan tampilan yang konsisten dengan halaman login aplikasi AMI.

Elemen UI:

- Card di tengah layar
- Judul: Lupa Password
- Deskripsi singkat
- Input email / OTP / password
- Tombol utama berwarna biru
- Toast notification untuk sukses/error
- Loading state saat submit

Contoh teks:

```text
Masukkan email akun AMI Anda. Sistem akan mengirimkan kode OTP untuk mengatur ulang password.
```

Untuk OTP:

```text
Masukkan 6 digit kode OTP yang telah dikirim ke email Anda.
```

Untuk reset password:

```text
Buat password baru untuk akun AMI Anda.
```

---

## 11. Template Email OTP

Subject email:

```text
Kode OTP Reset Password AMI Prodi
```

Isi email:

```text
Halo,

Kami menerima permintaan reset password untuk akun AMI Prodi Anda.

Kode OTP Anda adalah:

123456

Kode ini berlaku selama 10 menit.

Jika Anda tidak meminta reset password, abaikan email ini.

Salam,
Sistem AMI Prodi
```

Gunakan HTML email sederhana agar lebih rapi.

---

## 12. Validasi Role

Fitur lupa password berlaku untuk user yang ada di tabel `users`.

User yang boleh menggunakan fitur:

- Admin
- Dosen
- Kaprodi

Namun fokus utama fitur ini adalah:

- Dosen
- Kaprodi

Jika akun `is_active = false`, jangan izinkan reset password.

Tampilkan pesan umum:

```text
Jika email terdaftar dan aktif, kode OTP akan dikirim.
```

---

## 13. Alur Detail Sistem

```text
User membuka halaman lupa password
↓
User mengisi email
↓
Frontend request ke /api/auth/forgot-password/request-otp
↓
Backend mencari user berdasarkan email
↓
Jika user aktif ditemukan:
    Generate OTP
    Hash OTP
    Simpan OTP ke password_reset_otps
    Kirim email via nodemailer
↓
User membuka email
↓
User input OTP
↓
Frontend request ke /api/auth/forgot-password/verify-otp
↓
Backend validasi OTP
↓
Jika OTP valid:
    User boleh membuat password baru
↓
User input password baru
↓
Frontend request ke /api/auth/forgot-password/reset
↓
Backend hash password baru
↓
Backend update users.password
↓
Backend tandai OTP sudah digunakan
↓
User diarahkan ke halaman login
```

---

## 14. Hal yang Tidak Boleh Dilakukan

1. Jangan simpan OTP dalam bentuk plain text.
2. Jangan mengubah ID menjadi BigInt.
3. Jangan mengirim OTP ke email yang tidak terdaftar.
4. Jangan menampilkan detail apakah email benar-benar terdaftar jika ingin aman.
5. Jangan menyimpan password baru tanpa hash.
6. Jangan membiarkan OTP berlaku selamanya.
7. Jangan membiarkan OTP bisa digunakan berkali-kali.
8. Jangan menerima password kurang dari 8 karakter.
9. Jangan commit SMTP password ke repository.
10. Jangan hardcode credential Gmail di source code.

---

## 15. Acceptance Criteria

Fitur dianggap selesai jika:

1. Ada link **Lupa Password** di halaman login.
2. User bisa membuka halaman lupa password.
3. User bisa memasukkan email.
4. Sistem mengirim OTP ke email user jika email terdaftar dan aktif.
5. OTP dikirim melalui email `amiprodiiktrk@gmail.com`.
6. OTP berlaku selama 10 menit.
7. OTP disimpan dalam bentuk hash di database.
8. User bisa memasukkan OTP.
9. Sistem bisa memvalidasi OTP.
10. OTP salah menambah `attempt_count`.
11. OTP tidak bisa digunakan jika sudah kedaluwarsa.
12. OTP tidak bisa digunakan jika sudah dipakai.
13. User bisa membuat password baru setelah OTP valid.
14. Password baru disimpan dalam bentuk hash bcrypt.
15. User bisa login dengan password baru.
16. Semua ID tetap menggunakan Int.
17. Tidak ada field ID yang dikembalikan ke BigInt.

---

## 16. Instruksi untuk AI Coding Agent

Tolong tambahkan fitur **Lupa Password dengan OTP Email** pada aplikasi Next.js AMI Prodi.

Gunakan email sistem:

```text
amiprodiiktrk@gmail.com
```

sebagai pengirim OTP melalui SMTP.

Buat fitur dengan alur:

```text
Input email
→ Kirim OTP ke email user
→ Verifikasi OTP
→ Reset password baru
→ Login ulang
```

Tambahkan tabel baru:

```text
password_reset_otps
```

Dengan field:

```text
id
user_id
email
otp_hash
expires_at
used_at
attempt_count
created_at
updated_at
```

Catatan database:

```text
Semua ID menggunakan Int.
Jangan ubah kembali menjadi BigInt.
```

Library yang digunakan:

```text
nodemailer
bcryptjs
zod
```

Endpoint yang dibuat:

```text
POST /api/auth/forgot-password/request-otp
POST /api/auth/forgot-password/verify-otp
POST /api/auth/forgot-password/reset
```

Halaman yang dibuat:

```text
/lupa-password
/verifikasi-otp
/reset-password
```

Aturan keamanan:

```text
OTP 6 digit
OTP berlaku 10 menit
OTP disimpan dalam hash
OTP hanya bisa digunakan satu kali
Maksimal percobaan OTP 5 kali
Password baru minimal 8 karakter
Password wajib di-hash dengan bcryptjs
```

Pastikan UI konsisten dengan halaman login aplikasi AMI Prodi.

Tambahkan link **Lupa Password?** pada halaman login.
