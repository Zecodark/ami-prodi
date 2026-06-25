# Fix: Instrumen Tidak Muncul untuk Prodi yang Belum Di-Link

## Problem

Dosen TRK (Teknik Rekayasa Komputer) login dan melihat instrumen "Instrumen Uji Export (Testing)", tapi menampilkan **"Tidak ada data struktur instrumen"**.

**Root Cause:**
- Instrumen aktif belum di-link ke prodi TRK oleh Admin
- API instrumen filter `prodi_links` secara strict
- Jika tidak ada link, dosen tidak bisa lihat instrumen sama sekali

---

## Solution: Fallback Mechanism

Added **fallback mechanism**: Jika tidak ada instrumen yang ter-link ke prodi dosen/kaprodi, system akan fallback ke instrumen aktif dari periode aktif.

Ini memungkinkan:
- ✅ Prodi baru bisa langsung lihat dan pakai instrumen aktif
- ✅ Admin tidak perlu link instrumen dulu sebelum prodi bisa mulai kerja
- ✅ Jika sudah di-link, tetap gunakan instrumen yang ter-link (proper way)

---

## Changes

### 1. API Instrumens with Fallback

**File:** `app/api/instrumens/route.ts`

```typescript
// Try to get instrumen linked to this prodi
const linkedData = await prisma.instrumen.findMany({
  where: {
    ...where,
    prodi_links: {
      some: {
        prodi_id: user.prodiId,
        is_active: true
      }
    }
  }
});

// If no linked instrumen found, fallback to all instrumen from active periode
if (linkedData.length === 0) {
  console.log(`[INFO] No linked instrumen for prodi ${user.prodiId}, using fallback`);
  const fallbackData = await prisma.instrumen.findMany({ where });
  return R.ok(serialize(fallbackData));
}

return R.ok(serialize(linkedData));
```

**Behavior:**
1. **First:** Try to get instrumen yang ter-link ke prodi
2. **Fallback:** Jika tidak ada, return semua instrumen (filtered by `is_active` and `periode_id`)

### 2. Dashboard Kaprodi with Fallback

**File:** `app/api/kaprodi/dashboard/route.ts`

```typescript
// Try to get linked instrumen
let activeInstrumen = await prisma.instrumen.findFirst({
  where: { 
    periode_id: activePeriode.id, 
    is_active: true,
    prodi_links: {
      some: { prodi_id: prodiId, is_active: true }
    }
  }
});

// Fallback: if no linked instrumen, get any active instrumen for this periode
if (!activeInstrumen) {
  activeInstrumen = await prisma.instrumen.findFirst({
    where: { 
      periode_id: activePeriode.id, 
      is_active: true
    }
  });
}
```

### 3. Dashboard Dosen with Fallback

**File:** `app/api/dosen/dashboard/route.ts`

Same fallback logic as Kaprodi.

---

## Fallback Flow

```
┌─────────────────────────────────────────┐
│ Dosen TRK login                         │
│ prodiId = 2 (TRK)                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Query: instrumen + prodi_links(prodi=2) │
└──────────────┬──────────────────────────┘
               │
               ▼
        ┌──────┴──────┐
        │ Found link? │
        └──────┬──────┘
               │
        ┌──────┴──────────┐
        │                 │
       Yes               No
        │                 │
        ▼                 ▼
    ┌───────┐      ┌────────────┐
    │Return │      │ FALLBACK:  │
    │linked │      │ Query all  │
    │instr. │      │ active     │
    └───────┘      │ instrumen  │
                   └──────┬─────┘
                          │
                          ▼
                   ┌────────────┐
                   │ Return all │
                   │ (including │
                   │ unlinked)  │
                   └────────────┘
```

---

## Expected Behavior

### Before Fix:

**Dosen TRK (prodi belum di-link):**
- Dashboard: Error / Empty
- Isi AMI: "Tidak ada data struktur instrumen"

**Dosen TI (prodi sudah di-link):**
- Dashboard: ✅ Normal
- Isi AMI: ✅ Normal

### After Fix:

**Dosen TRK (prodi belum di-link):**
- Dashboard: ✅ Menampilkan instrumen aktif (fallback)
- Isi AMI: ✅ Menampilkan struktur instrumen (fallback)
- Console log: `[INFO] No linked instrumen for prodi 2, using fallback`

**Dosen TI (prodi sudah di-link):**
- Dashboard: ✅ Menampilkan instrumen yang ter-link (proper)
- Isi AMI: ✅ Menampilkan struktur instrumen (proper)

---

## Recommendation

**⚠️ Admin should link instrumen to all prodi:**

Fallback adalah temporary solution. Yang proper adalah:

1. **Admin** masuk ke halaman **Kelola Instrumen AMI**
2. Edit instrumen "Instrumen Uji Export (Testing)"
3. **Link instrumen ke semua prodi** yang aktif:
   - ✅ Teknik Informatika (D3)
   - ✅ Teknik Rekayasa Komputer (D4)
   - ✅ (Prodi lain yang ada)

**Cara Link Instrumen:**
- Buka halaman Admin → Kelola Instrumen AMI
- Klik "Edit" pada instrumen
- Di bagian "Prodi Terhubung", centang semua prodi yang akan menggunakan instrumen ini
- Simpan

Setelah di-link, system akan otomatis gunakan instrumen yang ter-link (bukan fallback).

---

## Testing

### Test Case 1: Prodi Belum Di-Link (TRK)

**Steps:**
1. Login sebagai Dosen TRK
2. Buka Dashboard
3. Buka Isi AMI

**Expected:**
- ✅ Dashboard menampilkan Total Isian AMI = 107
- ✅ Isi AMI menampilkan struktur instrumen dengan kriteria
- ✅ Console log: `[INFO] No linked instrumen for prodi 2, using fallback`

### Test Case 2: Prodi Sudah Di-Link (TI)

**Steps:**
1. Login sebagai Dosen TI
2. Buka Dashboard
3. Buka Isi AMI

**Expected:**
- ✅ Dashboard menampilkan Total Isian AMI = 107
- ✅ Isi AMI menampilkan struktur instrumen dengan kriteria
- ✅ NO console log (because using proper linked instrumen)

### Test Case 3: Admin Link Instrumen ke TRK

**Steps:**
1. Login sebagai Admin
2. Kelola Instrumen AMI → Edit "Instrumen Uji Export (Testing)"
3. Link ke prodi TRK
4. Logout, login sebagai Dosen TRK
5. Buka Dashboard dan Isi AMI

**Expected:**
- ✅ Dashboard dan Isi AMI tetap berfungsi normal
- ✅ NO console log (because now using proper linked instrumen)

---

## Files Modified

1. ✅ `app/api/instrumens/route.ts` - Added fallback mechanism
2. ✅ `app/api/kaprodi/dashboard/route.ts` - Added fallback for dashboard
3. ✅ `app/api/dosen/dashboard/route.ts` - Added fallback for dashboard

---

## Summary

✅ **Fallback mechanism** memungkinkan prodi baru langsung pakai instrumen aktif  
✅ **Backward compatible** - prodi yang sudah di-link tetap pakai instrumen proper  
⚠️ **Admin should link instrumen** ke semua prodi untuk proper operation  
✅ **Console log** membantu admin identify prodi yang belum di-link
