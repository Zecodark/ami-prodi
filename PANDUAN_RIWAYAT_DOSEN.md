# Panduan: Riwayat Isian AMI Per Dosen

## 📋 Fitur Baru

Sekarang setiap dosen memiliki **riwayat isian AMI terpisah** yang tersimpan di akun login mereka masing-masing.

### ✨ Apa yang Berubah?

#### **Sebelum Update:**
- Satu prodi hanya bisa punya 1 isian per unsur
- Semua dosen di prodi yang sama berbagi isian yang sama
- Ketika Dosen A mengisi unsur X, Dosen B akan melihat isian dari Dosen A
- Riwayat tidak tersimpan per dosen

#### **Setelah Update:**
- ✅ Setiap dosen punya isian terpisah untuk setiap unsur
- ✅ Riwayat isian tersimpan di session akun login masing-masing
- ✅ Dosen A tidak akan melihat isian dari Dosen B
- ✅ Semua dosen di prodi yang sama bisa mengisi unsur yang sama dengan data berbeda

---

## 🎯 Cara Menggunakan

### Untuk Dosen

#### 1. **Mengisi AMI**
1. Login ke sistem dengan akun dosen
2. Buka menu **"Isi AMI"**
3. Pilih unsur yang ingin diisi
4. Isi form dengan data dan bukti
5. Klik **"Simpan Draft"** untuk menyimpan tanpa submit, atau **"Kirim untuk Review"** untuk mengirimkan ke Kaprodi

#### 2. **Melihat Riwayat**
1. Buka menu **"Riwayat Isian"**
2. Anda akan melihat **hanya isian yang Anda buat sendiri**
3. Filter berdasarkan status:
   - 🟢 **Valid**: Sudah disetujui Kaprodi
   - 🟡 **Menunggu Review**: Sedang menunggu review dari Kaprodi
   - 🔴 **Perlu Revisi**: Perlu diperbaiki sesuai catatan Kaprodi
4. Klik **icon mata** untuk melihat detail isian

#### 3. **Merevisi Isian**
1. Buka menu **"Revisi Saya"**
2. Anda akan melihat **hanya isian Anda yang perlu direvisi**
3. Klik **"Perbaiki Isian"** untuk mengedit
4. Baca catatan dari Kaprodi dengan teliti
5. Perbaiki sesuai catatan, lalu submit kembali

---

### Untuk Kaprodi

#### 1. **Melihat Semua Isian Prodi**
1. Login sebagai Kaprodi
2. Buka menu **"Review Isian"**
3. Anda akan melihat **semua isian dari semua dosen** di prodi Anda
4. Filter berdasarkan:
   - Dosen tertentu
   - Status isian
   - Periode

#### 2. **Review & Validasi**
1. Pilih isian yang ingin direview
2. Lihat detail isian dan bukti
3. Pilih status:
   - ✅ **Valid**: Isian sudah sesuai dan disetujui
   - ❌ **Revisi**: Isian perlu diperbaiki (wajib berikan catatan)
4. Berikan catatan jika diperlukan
5. Klik **"Simpan Verifikasi"**

---

## 🔍 FAQ (Pertanyaan yang Sering Diajukan)

### Q: Apakah isian dosen lain akan terlihat oleh dosen lain?
**A:** Tidak. Setiap dosen hanya akan melihat isian mereka sendiri di halaman "Riwayat Isian" dan "Revisi Saya".

### Q: Bagaimana dengan status di halaman "Isi AMI"?
**A:** Status per unsur di halaman "Isi AMI" dihitung secara **kolektif** dari semua dosen di prodi. Contoh:
- Jika Dosen A sudah mengisi unsur X dengan status "Menunggu Review"
- Dosen B akan melihat status unsur X sebagai "Menunggu Review" (warna kuning)
- Tapi ketika Dosen B klik unsur X, form akan kosong (karena isian terpisah)

### Q: Apakah saya bisa melihat isian dari dosen lain di prodi yang sama?
**A (Dosen):** Tidak. Anda hanya bisa melihat isian Anda sendiri.  
**A (Kaprodi):** Ya. Kaprodi bisa melihat semua isian dari semua dosen di prodi.

### Q: Bagaimana jika saya sudah punya isian sebelum update ini?
**A:** Isian lama tetap ada dan tersimpan. Isian tersebut akan muncul di riwayat dosen yang membuatnya (berdasarkan `dosen_id`).

### Q: Bagaimana cara menghapus isian?
**A:** Saat ini fitur hapus belum tersedia. Jika ada isian yang salah, Anda bisa:
- Edit isian tersebut (jika masih draft atau revisi)
- Hubungi admin untuk menghapus isian yang sudah valid

---

## 📊 Contoh Skenario

### Skenario 1: Dua Dosen Mengisi Unsur yang Sama

**Setup:**
- Prodi: Teknik Informatika
- Unsur: "Dokumen Kurikulum Program Studi"
- Dosen A: Dr. Ahmad
- Dosen B: Dr. Budi

**Langkah:**
1. **Dr. Ahmad** login → Isi unsur → Judul: "Kurikulum TI 2024" → Submit
2. **Dr. Budi** login → Buka unsur yang sama → Form masih kosong
3. **Dr. Budi** mengisi → Judul: "Revisi Kurikulum TI 2025" → Submit
4. **Kaprodi** login → Melihat **2 isian berbeda** untuk unsur yang sama:
   - Isian dari Dr. Ahmad: "Kurikulum TI 2024"
   - Isian dari Dr. Budi: "Revisi Kurikulum TI 2025"

### Skenario 2: Revisi Isian

**Setup:**
- Dosen: Dr. Ahmad
- Unsur: "Dokumen Kurikulum Program Studi"
- Status awal: "Menunggu Review"

**Langkah:**
1. **Kaprodi** review isian Dr. Ahmad → Berikan status "Revisi" → Catatan: "Mohon lampirkan SK Dekan"
2. **Dr. Ahmad** login → Buka menu "Revisi Saya" → Melihat catatan dari Kaprodi
3. **Dr. Ahmad** klik "Perbaiki Isian" → Tambahkan file SK Dekan → Submit ulang
4. **Kaprodi** review kembali → Jika sudah sesuai, berikan status "Valid"

---

## 🛠️ Troubleshooting

### Masalah: Isian saya tidak muncul di riwayat
**Solusi:**
1. Pastikan Anda sudah **submit** isian (bukan hanya draft)
2. Refresh halaman (tekan F5)
3. Cek koneksi internet
4. Logout dan login kembali

### Masalah: Saya tidak bisa edit isian yang sudah valid
**Solusi:**
Isian yang sudah divalidasi oleh Kaprodi **tidak dapat diubah**. Ini untuk menjaga integritas data. Jika perlu diubah, hubungi Kaprodi atau admin.

### Masalah: Error "Dokumen isian ini sudah divalidasi"
**Solusi:**
Isian tersebut sudah disetujui Kaprodi dan tidak bisa diubah lagi. Jika memang perlu diubah:
1. Hubungi Kaprodi untuk mengubah status menjadi "Revisi"
2. Setelah status berubah, Anda bisa edit kembali

---

## 📞 Kontak

Jika ada pertanyaan atau masalah, hubungi:
- **Admin Sistem**: admin@polines.ac.id
- **Helpdesk IT**: it-support@polines.ac.id

---

**Terakhir diupdate**: 19 Juni 2026
