# Fix Dashboard Kaprodi dan Dosen - Filter Instrumen dan Jenjang

## Problem

Dashboard Kaprodi dan Dosen menampilkan total unsur yang **tidak sesuai** dengan struktur instrumen yang aktif untuk prodi tersebut, dan angka mereka tidak sinkron.

**Root Cause:**
1. Dashboard Dosen menggunakan **client-side calculation** yang kompleks dan tidak konsisten
2. Query `totalUnsur` tidak filter berdasarkan **jenjang prodi** (D3/D4/STR)
3. Query `totalUnsur` tidak filter berdasarkan **prodi_links** (instrumen yang terhubung dengan prodi)
4. Dashboard Dosen dan Kaprodi menggunakan logic yang berbeda

---

## Solution

### 1. Buat API Dashboard Dosen (Baru)

Created: `app/api/dosen/dashboard/route.ts`

API ini menggunakan **logic yang sama persis** dengan Dashboard Kaprodi:

```typescript
// Filter instrumen by prodi_links
const activeInstrumen = await prisma.instrumen.findFirst({
  where: { 
    prodi_links: {
      some: {
        prodi_id: prodiId,
        is_active: true
      }
    }
  },
});

// Filter total unsur by jenjang
const targetJenjangs = [prodi.jenjang];
if (prodi.jenjang === 'D4') targetJenjangs.push('STR');
if (prodi.jenjang === 'STR') targetJenjangs.push('D4');

totalUnsur = await prisma.pemeriksaanUnsur.count({
  where: {
    deskripsi_area: {
      kode_ami: { 
        kriteria: { instrumen_id: activeInstrumen.id },
        butir_standars: {
          some: {
            jenjang: { kode_jenjang: { in: targetJenjangs } }
          }
        }
      },
    },
  },
});

// Hitung status kolektif per-prodi (sama dengan Kaprodi)
const grouped = new Map<unsurId, Isian[]>();
for (const [unsurId, list] of grouped) {
  let valid = 0, revisi = 0, proses = 0;
  
  // Cek semua isian di unsur tersebut
  for (const it of list) {
    if (it.status === 'valid') valid++;
    else if (it.status === 'revisi') revisi++;
    else if (it.status === 'proses') proses++;
  }
  
  // Priority: valid > revisi > proses
  if (valid > 0) unsurValid++;
  else if (revisi > 0) unsurRevisi++;
  else if (proses > 0) unsurProses++;
}

// Statistik khusus dosen yang login
let dosenProses = 0, dosenRevisi = 0;
for (const it of latestPerDosen.values()) {
  if (it.dosen_id === dosen.id) {
    if (it.status === 'proses') dosenProses++;
    else if (it.status === 'revisi') dosenRevisi++;
  }
}
```

**Output:**
```typescript
{
  periode_aktif: "2025/2026",
  instrumen_aktif: "Instrumen AMI Program Studi 2025/2026",
  prodi: { id: 1, nama_prodi: "Teknik Informatika", jenjang: "D3" },
  
  // Statistik kolektif per-prodi (sama dengan Kaprodi)
  total_unsur: 35,
  unsur_valid: 16,
  unsur_perlu_revisi: 4,
  unsur_proses: 6,
  unsur_belum_valid: 19,
  unsur_terisi: 26,
  progress: 46,
  
  // Statistik khusus dosen yang login (untuk UI "Menunggu Review" dan "Perlu Revisi")
  dosen_proses: 2,
  dosen_revisi: 1
}
```

### 2. Update Dashboard Dosen Frontend

Simplified dari **complex client-side calculation** ke **single API call**:

**Sebelum:**
```typescript
// Fetch multiple APIs
const [periodeRes, instrumenRes, statusRes] = await Promise.all([...]);

// Manual calculation di client
let totalUnsur = 0;
const krRes = await fetch(`/api/kriteria?instrumen_id=${insId}`);
for (const k of krJson.data) {
  for (const ami of k.kode_amis) {
    // Complex nested loop...
    totalUnsur += area.pemeriksaan_unsurs.length;
  }
}
```

**Sesudah:**
```typescript
// Single API call
const res = await fetch('/api/dosen/dashboard', { headers });
const data = res.data;

// Direct assignment
setStat({
  total: data.total_unsur,
  valid: data.unsur_valid,
  proses: data.dosen_proses,  // Statistik khusus dosen
  revisi: data.dosen_revisi,  // Statistik khusus dosen
  kosong: data.total_unsur - data.unsur_terisi,
});
```

### 3. Update Dashboard Kaprodi API

Added filtering (same as Dosen):

```typescript
// Filter instrumen by prodi_links
const activeInstrumen = await prisma.instrumen.findFirst({
  where: { 
    prodi_links: {
      some: { prodi_id: prodiId, is_active: true }
    }
  },
});

// Filter by jenjang (same logic)
const targetJenjangs = [prodi.jenjang];
if (prodi.jenjang === 'D4') targetJenjangs.push('STR');
if (prodi.jenjang === 'STR') targetJenjangs.push('D4');

// Use filter consistently for all queries
const whereIsianFilter = {
  periode_id: activePeriode.id,
  prodi_id: prodiId,
  pemeriksaan_unsur: {
    deskripsi_area: {
      kode_ami: {
        kriteria: { instrumen_id: activeInstrumen.id },
        butir_standars: {
          some: {
            jenjang: { kode_jenjang: { in: targetJenjangs } }
          }
        }
      }
    }
  }
};
```

---

## What Changed

### Dashboard Dosen
✅ **NEW:** API `/api/dosen/dashboard` dengan logic yang sama dengan Kaprodi  
✅ **SIMPLIFIED:** Frontend dari complex client calculation ke single API call  
✅ **CONSISTENT:** Menggunakan filter yang sama (prodi_links, jenjang)  

### Dashboard Kaprodi
✅ **UPDATED:** Added filter by prodi_links  
✅ **UPDATED:** Added filter by jenjang  
✅ **CONSISTENT:** Menggunakan logic yang sama dengan Dosen  

---

## Data Consistency

**Sekarang SAMA:**
- ✅ Total Isian AMI
- ✅ Total Valid
- ✅ Total Belum Valid  
- ✅ Progress %

**Berbeda (by design):**
- 📊 **Dosen:** "Menunggu Review" = isian **milik dosen yang login** (personal)
- 📊 **Kaprodi:** "Menunggu Review" = **semua isian proses** (semua dosen)

---

## Why Jenjang Mapping?

D4 dan STR (Sarjana Terapan) menggunakan butir standar yang sama:

```typescript
if (prodi.jenjang === 'D4') targetJenjangs = ['D4', 'STR'];
if (prodi.jenjang === 'STR') targetJenjangs = ['STR', 'D4'];
```

Jadi prodi D4 dan STR akan melihat unsur yang sama.

---

## Testing

**Expected Result:**

| Metric | Dosen TI (D3) | Kaprodi TI (D3) | Status |
|--------|---------------|-----------------|--------|
| Total Isian AMI | 35 | 35 | ✅ SAMA |
| Total Valid | 16 | 16 | ✅ SAMA |
| Total Belum Valid | 19 | 19 | ✅ SAMA |
| Progress | 46% | 46% | ✅ SAMA |
| Perlu Revisi | 1 (personal) | 4 (semua dosen) | ✅ BEDA (by design) |
| Menunggu Review | 2 (personal) | 6 (semua dosen) | ✅ BEDA (by design) |

---

## Files Modified

1. ✅ `app/api/dosen/dashboard/route.ts` - **NEW** API with same logic as Kaprodi
2. ✅ `app/api/kaprodi/dashboard/route.ts` - Added filtering
3. ✅ `app/dosen/page.tsx` - Simplified to use new API

---

## No Breaking Changes

- Frontend: Tetap kompatibel (interface tidak berubah)
- Database: Tidak ada perubahan schema
- Logic: **Unified** between Dosen and Kaprodi

---

## Summary

✅ Dashboard Dosen dan Kaprodi sekarang menggunakan **logic yang sama**  
✅ Total unsur dan progress **100% sinkron**  
✅ Filter konsisten: instrumen → prodi_links → jenjang → isian  
✅ Dashboard Dosen simplified dari complex client calculation ke single API call
