# Panduan Penggunaan: Review Instrumen AMI (Kaprodi)

## Overview
Halaman **Review Instrumen AMI** adalah dashboard untuk Kaprodi (Kepala Program Studi) untuk melakukan review dan validasi terhadap isian AMI yang telah disubmit oleh dosen.

## Fitur Utama

### 1. Filter Data
Kaprodi dapat memfilter isian berdasarkan:
- **Periode**: Tahun akademik yang aktif (preselected pada periode aktif)
- **Instrumen**: Instrumen AMI yang spesifik
- **Pilih Berdasarkan**: Filter berdasarkan Dosen atau Prodi
- **Dosen/Prodi**: Pilih dosen atau prodi tertentu (opsional)

### 2. Tabel Daftar Isian
Menampilkan daftar isian AMI dengan kolom:
- **Kode AMI**: Kode standar audit (misal: 1.1, 2.1, dll)
- **Area**: Deskripsi area audit
- **Status**: Badge status
  - 🔵 **Proses** (biru) - Menunggu review
  - 🟢 **Valid** (hijau) - Sudah divalidkan
  - 🟠 **Revisi** (orange) - Dikembalikan untuk revisi

Klik pada baris isian untuk melihat detail dan melakukan review.

### 3. Panel Detail (Kanan)

#### Informasi Isian
- **Judul Dokumen**: Nama dokumen bukti
- **Dosen Pengisi**: Nama dan NIP dosen
- **Program Studi**: Nama prodi dan jenjang (D3/STR/S2)

#### Standar yang Dicapai
Checklist untuk:
- ✓ SPT PT (Standar Pengajaran Tinggi)
- ✓ SN DIKTI (Standar Nasional Pendidikan Tinggi)

#### Daya Saing
Checklist untuk:
- ✓ Lokal
- ✓ Nasional  
- ✓ Internasional

#### Bukti
- **Link Bukti**: Tautan ke dokumen (clickable)
- **File Bukti**: File yang di-upload dengan opsi download
  - Menampilkan nama file dan ukuran

#### Riwayat Review (Expandable)
Menampilkan history review isian:
- Tanggal review
- Status sebelum → Status sesudah (dengan visual)
- Catatan reviewer

### 4. Form Review

#### Pilihan Status
Kaprodi harus memilih salah satu:

**🟢 Validkan**
- Mengindikasikan isian sudah OK dan sesuai standar
- Tidak perlu catatan
- Klik tombol untuk submit langsung

**🟠 Kembalikan Revisi**
- Mengindikasikan ada yang perlu diperbaiki dosen
- **Catatan wajib diisi** - Jelaskan alasan atau perbaikan yang diperlukan
- Tombol submit hanya aktif setelah catatan diisi (validasi client-side)
- Catatan akan ditampilkan ke dosen di halaman revisi mereka

#### Catatan Revisi (Opsional untuk Valid, Wajib untuk Revisi)
Textarea untuk menulis catatan:
- Gunakan untuk revisi: "Mohon lengkapi dokumen XXX", "Tambahkan data YYY", dll
- Gunakan untuk valid: (opsional) bisa kosong atau berikan apresiasi

### 5. Proses Review

#### Step 1: Pilih Periode, Instrumen, Dosen/Prodi
```
[Periode] [Instrumen] [Berdasarkan] [Dosen/Prodi]
```

#### Step 2: Pilih Isian dari Tabel
Klik baris isian yang akan di-review → Detail muncul di panel kanan

#### Step 3: Baca Detail Isian
Periksa:
- Informasi dosen dan prodi
- Standar yang diklaim tercapai
- Bukti (link dan file)
- History review sebelumnya

#### Step 4: Tentukan Status
- Klik **Validkan** untuk approve
- Atau klik **Kembalikan Revisi** untuk minta perbaikan

#### Step 5: Isi Catatan (jika revisi)
Jelaskan alasan revisi atau perbaikan yang diperlukan

#### Step 6: Submit
- Untuk Valid: Klik tombol **Validkan**
- Untuk Revisi: Klik tombol **Kembalikan untuk Revisi** (setelah catatan diisi)

#### Step 7: Konfirmasi
Akan muncul pesan sukses, isian akan hilang dari list, dan history review ter-update

## Badge Status

| Badge | Arti | Aksi |
|-------|------|------|
| 🔵 Proses (Biru) | Menunggu review kaprodi | Bisa di-review |
| 🟢 Valid (Hijau) | Sudah disetujui | Read-only |
| 🟠 Revisi (Orange) | Dikembalikan untuk revisi | Dosen bisa edit & resubmit |

## Catatan Penting

### Validasi
- ✓ Catatan **wajib** diisi jika memilih "Kembalikan Revisi"
- ✓ Jika catatan kosong, tombol akan disabled (tidak bisa diklik)
- ✓ Indikator visual: 🟢 "Catatan sudah diisi" atau 🔴 "Catatan wajib diisi"

### Refresh Data
Setelah submit review:
1. Panel detail akan otomatis tertutup
2. Tabel akan refresh otomatis
3. Isian yang sudah direview akan update statusnya atau hilang dari list (tergantung filter)

### Riwayat Review
Semua review disimpan ke database dengan:
- Timestamp
- Status sebelum → status sesudah
- Catatan reviewer
- Reviewer ID (otomatis dari user yang login)

## Tips Penggunaan

### Efisiensi Review
1. Filter berdasarkan status "proses" untuk fokus pada isian yang belum direview
2. Group isian berdasarkan prodi jika ingin review per-program studi
3. Gunakan catatan yang spesifik dan jelas untuk dosen

### Catatan Revisi yang Baik
```
❌ Tidak baik: "Kurang lengkap"

✓ Baik: 
"Mohon tambahkan dokumen Rencana Strategis Jurusan tahun 2024-2028. 
Dokumen harus ditandatangani oleh Kepala Jurusan dan bermaterai."
```

## Troubleshooting

### Isian tidak muncul di tabel
- Periksa filter periode dan instrumen sudah benar
- Coba ganti filter dosen/prodi
- Pastikan isian sudah disubmit oleh dosen (status bukan draft)

### Tidak bisa submit review
- Pastikan catatan diisi jika memilih "Kembalikan Revisi"
- Periksa koneksi internet
- Coba refresh halaman

### Catatan tidak muncul
- Setelah submit, tunggu beberapa detik
- Coba refresh halaman
- Periksa browser console untuk error

## Layout Reference

```
┌─────────────────────────────────────────────┐
│  Review Instrumen AMI                       │
├─────────────────────────────────────────────┤
│  [Periode] [Instrumen] [Berdasarkan] [...]  │
├──────────────────────┬──────────────────────┤
│                      │                      │
│   Daftar Isian      │  Detail Isian        │
│   (Kiri 2/3)        │  (Kanan 1/3)         │
│                      │                      │
│  Kode | Area | Status│ • Dok                │
│  ───────────────────│ • Dosen              │
│  1.1  |area1|  ✓   │ • Standar            │
│  1.2  |area2|  ⟳   │ • Daya Saing         │
│  2.1  |area3|  ●   │ • Bukti              │
│                      │ • Catatan            │
│                      │ • History            │
│                      │ ─────────────────    │
│                      │ • Status: Valid/Revisi
│                      │ • Catatan (textarea) │
│                      │ [Validkan] [Revisi]  │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

---

**Versi**: 1.0  
**Last Updated**: 2025-05-17  
**Status**: Production Ready
