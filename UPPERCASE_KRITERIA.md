# Uppercase Text untuk Kriteria

## 📋 Overview
Semua teks nama kriteria di seluruh aplikasi sekarang ditampilkan dalam huruf besar (UPPERCASE) untuk konsistensi visual dan memudahkan identifikasi.

## ✅ Files yang Diupdate

### 1. Halaman Dosen

#### `app/dosen/isi-ami/page.tsx`
**Lokasi 1 - Tree View Kriteria:**
```tsx
<span className="font-semibold text-slate-800 text-sm uppercase">
  [{node.kode_kriteria}] {node.nama_kriteria}
</span>
```

**Lokasi 2 - UnsurBreadcrumb Component:**
```tsx
<div className="text-[11px] text-slate-500 mt-1 uppercase">
  Kriteria: {kriteria.nama_kriteria}
</div>
```

#### `app/dosen/isi-ami/ViewValidIsian.tsx`
**Display Kriteria pada View-Only:**
```tsx
<p className="font-medium text-slate-700 uppercase">
  {unsurInfo.nama_kriteria}
</p>
```

#### `app/dosen/revisi/page.tsx`
**Display Kriteria pada Halaman Revisi:**
```tsx
<p className="text-slate-800 font-medium mt-1 text-sm uppercase">
  [{revisi.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.kode_kriteria}] 
  {revisi.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.nama_kriteria}
</p>
```

### 2. Halaman Kaprodi

#### `app/kaprodi/review/page.tsx`
**Detail Modal - Display Kriteria:**
```tsx
<p className="font-bold text-gray-900 uppercase">
  {detailData.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.nama_kriteria}
</p>
```

#### `app/kaprodi/review/[id]/page.tsx`
**Header Review Page:**
```tsx
<h2 className="text-sm font-bold text-gray-900 uppercase mb-4">
  Kriteria {data.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.kode_kriteria}:{' '}
  {data.pemeriksaan_unsur.deskripsi_area.kode_ami.kriteria.nama_kriteria}
</h2>
```
*Note: Sudah uppercase dari sebelumnya, tidak perlu diubah*

#### `app/kaprodi/rekap/page.tsx`
**Tree View Kriteria:**
```tsx
<span className="font-semibold text-slate-800 text-sm uppercase">
  [{node.kode_kriteria}] {node.nama_kriteria}
</span>
```

### 3. Halaman Admin

#### `app/admin/rekap/page.tsx`
**Tree View Kriteria:**
```tsx
<span className="font-semibold text-slate-800 text-sm uppercase">
  [{node.kode_kriteria}] {node.nama_kriteria}
</span>
```

#### `app/admin/struktur/page.tsx`
**Display Kriteria di Tree Management:**
```tsx
<span className="text-sm font-bold text-slate-800 uppercase">
  {k.nama_kriteria}
</span>
```

## 🎯 Benefit

### 1. **Konsistensi Visual**
- Semua nama kriteria tampil seragam dengan huruf besar
- Mudah dikenali di seluruh aplikasi
- Professional appearance

### 2. **Hierarchy yang Jelas**
```
[K1] CRITERIA 1: VISI, MISI, TUJUAN DAN STRATEGI  ← Uppercase (Parent)
  └─ AMI 1.1                                       ← Normal (Child)
      └─ Kesesuaian Visi, Misi...                  ← Normal (Grandchild)
          └─ Renstra Polines                       ← Normal (Content)
```

### 3. **Sesuai Standar Akreditasi**
- Nama kriteria dalam dokumen akreditasi biasanya uppercase
- Konsisten dengan format dokumen resmi

## 📸 Before & After

### Before:
```
[K1] Criteria 1: Visi, Misi, Tujuan dan Strategi
```

### After:
```
[K1] CRITERIA 1: VISI, MISI, TUJUAN DAN STRATEGI
```

## 🧪 Testing

### Test Case 1: Tree View di Isi AMI
1. Login sebagai Dosen
2. Buka "Isi AMI"
3. Verify: Semua nama kriteria tampil UPPERCASE
4. Expected: `[K1] CRITERIA 1: VISI, MISI, TUJUAN DAN STRATEGI`

### Test Case 2: Breadcrumb
1. Klik salah satu unsur di tree
2. Lihat breadcrumb di atas form
3. Verify: Nama kriteria tampil UPPERCASE
4. Expected: `Kriteria: CRITERIA 1: VISI, MISI, TUJUAN DAN STRATEGI`

### Test Case 3: View-Only Valid Isian
1. Klik unsur dengan status "Valid"
2. Lihat ViewValidIsian component
3. Verify: Nama kriteria di section "Informasi Unsur AMI" tampil UPPERCASE
4. Expected: `Kriteria: CRITERIA 1: VISI, MISI, TUJUAN DAN STRATEGI`

### Test Case 4: Kaprodi Review
1. Login sebagai Kaprodi
2. Buka "Review AMI"
3. Klik detail isian
4. Verify: Nama kriteria di modal detail tampil UPPERCASE

### Test Case 5: Admin Struktur
1. Login sebagai Admin
2. Buka "Struktur Instrumen"
3. Expand tree
4. Verify: Semua nama kriteria tampil UPPERCASE

## 🔧 CSS Classes Used

- `uppercase` - Tailwind CSS utility class
- Transforms text to uppercase using `text-transform: uppercase;`
- Works with any text content regardless of original casing

## 📝 Notes

1. **Data tidak berubah**: Perubahan hanya di tampilan (UI), data di database tetap seperti aslinya
2. **Reusable**: Class `uppercase` bisa digunakan di tempat lain jika perlu
3. **Reversible**: Jika perlu dikembalikan ke normal, cukup hapus class `uppercase`

## ✅ Status

- [x] Dosen - Isi AMI page
- [x] Dosen - Isi AMI breadcrumb
- [x] Dosen - View Valid Isian component
- [x] Dosen - Revisi page
- [x] Kaprodi - Review page (modal detail)
- [x] Kaprodi - Review [id] page (header)
- [x] Kaprodi - Rekap page
- [x] Admin - Rekap page
- [x] Admin - Struktur page

---

**Implementation Date**: 2026-06-19  
**Status**: ✅ **COMPLETE**
