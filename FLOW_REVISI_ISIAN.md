# Flow Revisi Isian AMI

## 📋 Problem yang Mungkin Terjadi

**Gejala**: Kaprodi tidak bisa validasi isian yang statusnya "revisi"

**Penyebab**: Status "revisi" berarti dosen belum submit ulang setelah memperbaiki isian.

---

## ✅ Flow yang Benar

### 1. **Dosen Submit Pertama Kali**
```
Dosen:
1. Isi form AMI
2. Klik "Kirim untuk Review"
3. Status isian: "PROSES" (menunggu review)

Database:
- status: "proses"
- submitted_at: [timestamp]
```

### 2. **Kaprodi Review (Pertama)**
```
Kaprodi:
1. Buka halaman "Review Isian"
2. Pilih isian dengan status "Menunggu Review"
3. Lihat detail isian
4. Opsi:
   a. Klik "Validasi" → Status jadi "VALID" ✅
   b. Klik "Minta Revisi" + kasih catatan → Status jadi "REVISI" ❌

Database (jika revisi):
- status: "revisi"
- catatan_kaprodi: [catatan dari kaprodi]
- reviewed_at: [timestamp]
```

### 3. **Dosen Perbaiki Isian (Setelah Revisi)** ⚠️ **PENTING!**
```
Dosen:
1. Login → Buka "Revisi Saya"
2. Lihat catatan dari Kaprodi
3. Klik "Perbaiki Isian"
4. Form terbuka dengan data lama
5. Perbaiki sesuai catatan
6. ⚠️ WAJIB KLIK "Kirim untuk Review" LAGI
7. Status berubah: "REVISI" → "PROSES"

Database (setelah submit ulang):
- status: "proses"           ← Berubah dari "revisi"
- catatan_kaprodi: null      ← Di-reset
- reviewed_by: null          ← Di-reset
- reviewed_at: null          ← Di-reset
- submitted_at: [timestamp baru]
- attempt: [increment +1]
```

### 4. **Kaprodi Review Lagi (Kedua)**
```
Kaprodi:
1. Buka "Review Isian"
2. Lihat isian dengan status "Menunggu Review" (yang tadi revisi)
3. Review hasil perbaikan dosen
4. Klik "Validasi" → Status jadi "VALID" ✅

Database:
- status: "valid"
- reviewed_at: [timestamp]
```

---

## ❌ Flow yang Salah (Menyebabkan Masalah)

### **Kesalahan: Dosen Tidak Submit Ulang**
```
Dosen:
1. Buka "Revisi Saya"
2. Lihat catatan Kaprodi
3. Edit form
4. ❌ Klik "Simpan Draft" (bukan "Kirim untuk Review")
5. ❌ Atau langsung close tanpa submit
6. Status tetap: "REVISI" ← STUCK!

Kaprodi:
1. Buka "Review Isian"
2. ❌ Tidak melihat isian tersebut (karena masih "revisi")
3. ❌ Atau klik "Validasi" → Error: "Isian ini menunggu perbaikan dari dosen"
```

**Akibat**:
- Status isian stuck di "revisi"
- Kaprodi tidak bisa review
- Dosen bingung kenapa isiannya tidak direview

---

## 🔧 Cara Memperbaiki

### Jika Dosen Lupa Submit Ulang:

#### **Opsi 1: Dosen Submit Ulang** (Recommended)
```
1. Login sebagai dosen
2. Buka "Revisi Saya"
3. Klik "Perbaiki Isian"
4. (Isian sudah diperbaiki sebelumnya)
5. Klik "Kirim untuk Review" ← PENTING!
6. Status berubah jadi "Proses"
7. Kaprodi sekarang bisa review
```

#### **Opsi 2: Admin Manual Update** (Emergency)
```sql
-- WARNING: Hanya untuk admin dengan akses database
-- Update status dari "revisi" ke "proses"

UPDATE isian_ami 
SET status = 'proses', 
    submitted_at = NOW()
WHERE id = [id_isian]
  AND status = 'revisi';
```

#### **Opsi 3: Kaprodi Bypass Review** (Future Feature)
```
// TODO: Tambahkan fitur untuk Kaprodi
// untuk "force review" isian dengan status "revisi"
// jika dosen sudah memperbaiki tapi lupa submit

Button: "Paksa Review" (hanya untuk status "revisi")
```

---

## 🎨 Improvement UI/UX

### 1. **Halaman Revisi Dosen - Tambah Warning**

**Sebelum** (kurang jelas):
```
[Form Isian]
[Simpan Draft] [Kirim untuk Review]
```

**Sesudah** (lebih jelas):
```
⚠️ PENTING: Setelah memperbaiki isian, Anda WAJIB klik 
   "Kirim untuk Review" agar Kaprodi bisa mereview lagi.

[Form Isian]

❌ [Simpan Draft]    ✅ [Kirim untuk Review] ← Gunakan ini!
   (draft saja)         (kirim ke Kaprodi)
```

### 2. **Halaman Review Kaprodi - Filter Lebih Jelas**

**Sebelum**:
```
Status: [Menunggu Review ▼]
```

**Sesudah**:
```
Status: [Menunggu Review ▼]

ℹ️ Isian dengan status "Revisi" tidak tampil di sini.
   Dosen harus submit ulang setelah memperbaiki.
   
📊 Status Isian:
   • Menunggu Review: [count] isian
   • Menunggu Perbaikan Dosen (Revisi): [count] isian
```

### 3. **Notifikasi Real-time**

**Untuk Dosen** (setelah Kaprodi minta revisi):
```
🔔 Isian AMI Anda perlu diperbaiki

Unsur: [nama unsur]
Catatan Kaprodi: [catatan]

[Perbaiki Sekarang] [Lihat Detail]
```

**Untuk Kaprodi** (setelah Dosen submit ulang):
```
🔔 Isian AMI sudah diperbaiki

Dosen: [nama dosen]
Unsur: [nama unsur]
Attempt: #[number]

[Review Sekarang] [Lihat Detail]
```

---

## 🧪 Testing Checklist

### Test 1: Flow Normal (Revisi → Perbaiki → Submit → Valid)
```
✅ Dosen submit pertama → status: "proses"
✅ Kaprodi revisi → status: "revisi"
✅ Dosen perbaiki + submit ulang → status: "proses"
✅ Kaprodi validasi → status: "valid"
```

### Test 2: Dosen Lupa Submit Ulang
```
✅ Dosen submit pertama → status: "proses"
✅ Kaprodi revisi → status: "revisi"
❌ Dosen perbaiki tapi simpan draft saja → status: "revisi" (stuck)
✅ Kaprodi coba review → Error: "Menunggu perbaikan dosen"
✅ Error message jelas
```

### Test 3: Multiple Revisi
```
✅ Attempt #1: Submit → Revisi
✅ Attempt #2: Submit → Revisi
✅ Attempt #3: Submit → Valid
✅ Attempt counter bertambah setiap submit
```

---

## 📊 Database Status Lifecycle

```
┌─────────┐
│  DRAFT  │  ← Dosen sedang mengisi (belum submit)
└────┬────┘
     │ submit (is_draft=false)
     ↓
┌─────────┐
│ PROSES  │  ← Menunggu review Kaprodi
└────┬────┘
     │ review by Kaprodi
     ├─────────────┬─────────────┐
     │             │             │
     ↓             ↓             ↓
┌────────┐    ┌────────┐    ┌──────────┐
│ VALID  │    │ REVISI │    │SUPERSEDED│
│  (✅)  │    │  (❌)  │    │  (⚪)    │
└────────┘    └───┬────┘    └──────────┘
                  │ dosen perbaiki + submit ulang
                  ↓
              ┌─────────┐
              │ PROSES  │  ← Kembali ke review
              └────┬────┘
                   │ review lagi
                   ↓
              ┌────────┐
              │ VALID  │
              │  (✅)  │
              └────────┘
```

**Catatan**:
- `REVISI` → `PROSES`: Butuh **aksi dosen** (submit ulang)
- `PROSES` → `VALID/REVISI`: Butuh **aksi kaprodi** (review)
- `PROSES` → `SUPERSEDED`: **Otomatis** (ada isian valid lain)

---

## 📝 Kesimpulan

### ✅ Yang Harus Dilakukan Dosen Setelah Revisi:
1. Buka "Revisi Saya"
2. Perbaiki isian sesuai catatan
3. **WAJIB** klik "Kirim untuk Review" (bukan simpan draft)
4. Tunggu Kaprodi review lagi

### ✅ Yang Harus Dilakukan Kaprodi:
1. Review hanya isian dengan status "Menunggu Review" (proses)
2. Jika minta revisi, berikan catatan yang jelas
3. Tunggu dosen submit ulang
4. Review lagi setelah dosen submit ulang

### ❌ Yang TIDAK Boleh:
- ❌ Dosen: Perbaiki tapi tidak submit ulang
- ❌ Kaprodi: Coba review isian dengan status "revisi"
- ❌ Admin: Ubah status manual tanpa alasan jelas

---

**Last Updated**: June 19, 2026  
**Author**: Development Team  
**Version**: 1.0
