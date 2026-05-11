Buatkan aplikasi web bernama “Sistem AMI Prodi” untuk pengelolaan Audit Mutu Internal Program Studi. Aplikasi memiliki 3 role utama: Admin, Dosen, dan Kaprodi. Gunakan desain modern, clean, profesional, responsif, dengan sidebar navigation, dashboard cards, tabel data, form input, badge status, filter, search, dan modal konfirmasi.

Gunakan konsep role-based access control. Setelah login, user diarahkan ke dashboard sesuai role.

Alur utama aplikasi:

1. Halaman Login

- Tampilan login sederhana dan profesional.
- Form terdiri dari email dan password.
- Setelah login, sistem membaca role user.
- Jika role admin, masuk ke Dashboard Admin.
- Jika role dosen, masuk ke Dashboard Dosen.
- Jika role kaprodi, masuk ke Dashboard Kaprodi.
- Tambahkan validasi form dan pesan error jika login gagal.

2. Role Admin
   Admin bertugas mengelola data master, anggota, periode, dan instrumen AMI.

Buat tampilan Admin dengan menu:

- Dashboard
- Kelola Anggota/User
- Kelola Jurusan
- Kelola Prodi
- Kelola Dosen
- Kelola Periode AMI
- Kelola Instrumen AMI
- Struktur Instrumen
- Rekap Isian AMI
- Logout

Dashboard Admin:

- Card total user
- Card total dosen
- Card total prodi
- Card periode aktif
- Card instrumen aktif
- Card total isian AMI
- Grafik/ringkasan status isian: proses, valid, revisi
- Tabel aktivitas terbaru

Kelola Anggota/User:

- Tabel user berisi email, role, status aktif, last login, aksi edit/hapus.
- Form tambah user: email, password, role admin/dosen/kaprodi, status aktif.
- Bisa edit role dan status aktif.
- Untuk user dosen, bisa dihubungkan ke data dosen.

Kelola Jurusan:

- Tabel jurusan.
- Form tambah/edit nama jurusan.
- Aksi hapus jika tidak digunakan.

Kelola Prodi:

- Tabel prodi berisi nama prodi, jenjang, jurusan.
- Form tambah/edit prodi.
- Relasi prodi ke jurusan.

Kelola Dosen:

- Tabel dosen berisi NIP, nama lengkap, prodi, status kepegawaian, no HP, status aktif.
- Form tambah/edit dosen.
- Dosen dapat dikaitkan dengan akun user.

Kelola Periode AMI:

- Tabel periode berisi tahun, tanggal mulai, tanggal selesai, status aktif.
- Form tambah/edit periode.
- Tombol “Aktifkan Periode”.
- Hanya satu periode yang aktif dalam satu waktu.
- Periode aktif akan menjadi periode utama untuk pengisian AMI.

Kelola Instrumen AMI:

- Tabel instrumen berisi nama instrumen, periode, deskripsi, status aktif, pembuat.
- Form tambah/edit instrumen.
- Tombol aktif/nonaktif instrumen.
- Instrumen aktif akan tampil di dashboard dosen untuk diisi.

Struktur Instrumen:
Buat halaman untuk menyusun struktur instrumen AMI secara bertingkat:

- Kriteria Standar
- Kode AMI
- Jenjang Standar / No Butir Standar
- Deskripsi Area Audit
- Pemeriksaan Unsur

Tampilan struktur instrumen dibuat seperti tree/table bertingkat. Admin bisa tambah, edit, dan hapus data pada setiap level. Gunakan accordion atau nested table agar mudah dipahami.

Rekap Isian AMI:

- Admin bisa melihat semua isian dosen.
- Filter berdasarkan periode, prodi, instrumen, dosen, dan status.
- Tampilkan total proses, valid, dan revisi.
- Admin hanya melihat dan memantau, approval utama dilakukan oleh Kaprodi.

3. Role Dosen
   Dosen bertugas mengisi instrumen AMI yang aktif.

Buat tampilan Dosen dengan menu:

- Dashboard
- Isi AMI
- Riwayat Isian
- Revisi Saya
- Profil
- Logout

Dashboard Dosen:

- Card periode aktif
- Card instrumen aktif
- Card total isian saya
- Card isian proses
- Card isian valid
- Card isian revisi
- Tampilkan daftar instrumen yang perlu diisi.
- Tampilkan progress pengisian dalam bentuk progress bar.

Isi AMI:

- Dosen memilih instrumen AMI aktif.
- Sistem menampilkan daftar pemeriksaan unsur berdasarkan struktur instrumen.
- Form pengisian AMI per unsur berisi:
  - Judul dokumen
  - Ketersediaan standar: ada / tidak ada
  - Dokumen: ada / tidak ada
  - Pencapaian Standar SPT PT: checkbox
  - Pencapaian Standar SN Dikti: checkbox
  - Daya saing lokal: checkbox
  - Daya saing nasional: checkbox
  - Daya saing internasional: checkbox
  - Link bukti
  - Upload file bukti
  - Tahun pelaksanaan
  - Capaian
  - Keterangan
- Tambahkan tombol Simpan Draft dan Submit.
- Setelah submit, status menjadi “proses”.
- Jika sudah valid, dosen tidak bisa mengubah kecuali admin/kaprodi membuka revisi.
- Jika status revisi, dosen bisa memperbaiki isian dan submit ulang.

Riwayat Isian:

- Tabel daftar isian milik dosen.
- Kolom: instrumen, periode, pemeriksaan unsur, judul dokumen, status, tanggal submit, catatan kaprodi, aksi detail/edit.
- Gunakan badge warna:
  - Proses = kuning
  - Valid = hijau
  - Revisi = merah/oranye

Revisi Saya:

- Tampilkan hanya isian dengan status revisi.
- Tampilkan catatan kaprodi dengan jelas.
- Ada tombol “Perbaiki Isian”.

Profil:

- Tampilkan data dosen: NIP, nama lengkap, prodi, status kepegawaian, no HP, alamat.
- Bisa edit informasi kontak seperti no HP dan alamat.

4. Role Kaprodi
   Kaprodi bertugas memeriksa, memberikan catatan, dan approval isian AMI dari dosen.

Buat tampilan Kaprodi dengan menu:

- Dashboard
- Review Isian AMI
- Approval
- Riwayat Review
- Rekap Prodi
- Logout

Dashboard Kaprodi:

- Card total isian masuk
- Card menunggu review/proses
- Card valid
- Card revisi
- Card total dosen di prodi
- Progress pengisian per dosen
- Grafik status isian AMI

Review Isian AMI:

- Tabel isian dosen.
- Filter berdasarkan periode, instrumen, dosen, status.
- Kolom: nama dosen, prodi, instrumen, kriteria, kode AMI, unsur, judul dokumen, status, tanggal submit, aksi review.
- Klik detail untuk melihat semua jawaban dosen.
- Detail review menampilkan:
  - Informasi dosen
  - Periode
  - Instrumen
  - Kriteria
  - Kode AMI
  - Deskripsi area audit
  - Pemeriksaan unsur
  - Jawaban dosen
  - Link bukti
  - File bukti
  - Capaian
  - Keterangan
  - Riwayat catatan

Approval:

- Kaprodi dapat memilih:
  - Setujui / Valid
  - Kembalikan Revisi
- Jika valid, status isian menjadi “valid”.
- Jika revisi, status isian menjadi “revisi” dan wajib mengisi catatan kaprodi.
- Simpan reviewer dan waktu review.
- Setiap approval disimpan sebagai log review.

Riwayat Review:

- Tabel histori review yang pernah dilakukan kaprodi.
- Kolom: dosen, isian, status sebelum, status sesudah, catatan, tanggal review.

Rekap Prodi:

- Ringkasan isian AMI berdasarkan prodi, periode, dan instrumen.
- Tampilkan jumlah total isian, proses, valid, revisi, dan jumlah dosen.
- Tambahkan filter periode dan instrumen.
- Tambahkan tombol export PDF/Excel secara visual.

5. Tampilan UI/UX
   Gunakan gaya visual:

- Clean dashboard akademik
- Warna utama biru, putih, abu-abu lembut
- Sidebar tetap di kiri
- Header berisi nama aplikasi, nama user, role, dan tombol logout
- Gunakan cards untuk statistik
- Gunakan table dengan search dan filter
- Gunakan modal untuk tambah/edit data
- Gunakan badge status untuk proses, valid, revisi
- Gunakan stepper atau progress bar untuk pengisian AMI
- Gunakan toast notification untuk sukses/gagal
- Semua halaman responsive untuk desktop dan tablet

6. Data Model yang Digunakan
   Gunakan entity berikut:

- roles
- users
- jurusans
- prodis
- dosens
- periodes
- instrumens
- kriteria_standars
- kode_amis
- jenjang_standars
- kode_ami_butir_standars
- deskripsi_areas
- pemeriksaan_unsurs
- isian_ami
- isian_bukti_files
- isian_review_logs

7. Status dan aturan penting

- Role user terdiri dari admin, dosen, kaprodi.
- Periode memiliki status aktif.
- Instrumen memiliki status aktif.
- Dosen hanya bisa mengisi instrumen yang aktif pada periode aktif.
- Status isian AMI:
  - proses: isian sudah dikirim dan menunggu review kaprodi
  - valid: isian disetujui kaprodi
  - revisi: isian dikembalikan oleh kaprodi untuk diperbaiki
- Kaprodi wajib mengisi catatan jika memilih revisi.
- Simpan histori review pada isian_review_logs.
- File bukti disimpan pada isian_bukti_files.
- Dashboard menggunakan data summary untuk menampilkan progress.

Buatkan aplikasi ini sebagai prototype frontend yang lengkap, dengan halaman login, routing berdasarkan role, dashboard untuk setiap role, sidebar, tabel, form, modal, filter, dan dummy data yang menyerupai data AMI Prodi. Fokus pada alur aplikasi dan tampilan yang rapi.
