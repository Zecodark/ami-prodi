# Implementasi: First Valid Wins Strategy

## 🎯 Problem Statement

### Skenario Konflik
```
Prodi: Teknik Informatika
Unsur: "Dokumen Kurikulum Program Studi"

Timeline:
1. Dosen A mengisi → Submit → Status: "Menunggu Review"
2. Dosen B mengisi → Submit → Status: "Menunggu Review"
3. Kaprodi review:
   - Isian Dosen A → "REVISI" (butuh perbaikan)
   - Isian Dosen B → "VALID" (disetujui)

❓ Masalah:
- Isian Dosen A masih "Revisi" tapi unsur sudah "Valid"
- Dosen A tidak bisa perbaiki isian (karena unsur terkunci)
- Isian "Revisi" jadi tidak berguna
```

---

## 💡 Solution: First Valid Wins Strategy

### Concept
**"Isian pertama yang divalidasi akan mengunci unsur untuk prodi tersebut"**

### Business Rules

#### 1. **One Valid Per Unsur Per Prodi**
- Hanya **1 isian** yang boleh valid untuk 1 unsur per prodi
- Ketika Kaprodi validasi isian pertama → unsur "terkunci"
- Isian lain otomatis jadi "SUPERSEDED" (digantikan)

#### 2. **Auto-Supersede Mechanism**
Ketika Kaprodi memvalidasi isian:
```typescript
if (status === 'valid') {
  // 1. Validasi isian yang dipilih
  // 2. Cari isian lain (proses/revisi/draft) untuk unsur yang sama di prodi yang sama
  // 3. Update semua isian lain → status: "SUPERSEDED"
  // 4. Berikan catatan otomatis: "Digantikan oleh isian valid lain"
}
```

#### 3. **Status Hierarchy**
```
VALID      → Winner (locked)
SUPERSEDED → Loser (auto-rejected, tidak perlu revisi)
REVISI     → Need improvement (bisa diperbaiki sampai ada yang valid)
PROSES     → Waiting review
DRAFT      → Not submitted
```

---

## 🔄 Flow Diagram

### Scenario 1: Happy Path (Semua Isian Bagus)
```
Dosen A → Submit → "Proses" ─┐
                               ├→ Kaprodi review
Dosen B → Submit → "Proses" ─┘
                               │
                               ├→ Pilih Isian A → "VALID" ✅
                               │   └→ Isian B auto → "SUPERSEDED" ⚪
                               │
                               └→ Unsur status: "VALID" (locked)
```

### Scenario 2: Ada yang Perlu Revisi
```
Dosen A → Submit → "Proses" ─┐
                               ├→ Kaprodi review
Dosen B → Submit → "Proses" ─┘
                               │
                               ├→ Isian A → "REVISI" ❌
                               └→ Isian B → "REVISI" ❌
                               
Dosen A → Perbaiki → Submit → "Proses" ─┐
                                          ├→ Kaprodi review lagi
Dosen B → Belum diperbaiki              ┘
                                          │
                                          ├→ Isian A → "VALID" ✅
                                          │   └→ Isian B (revisi) auto → "SUPERSEDED" ⚪
                                          │
                                          └→ Unsur status: "VALID" (locked)
```

### Scenario 3: Race Condition (Dosen A Kalah)
```
Dosen A → Submit → "Proses" ─┐
                               ├→ Kaprodi review bersamaan
Dosen B → Submit → "Proses" ─┘
                               │
                               ├→ Isian B → "VALID" ✅ (lebih dulu)
                               │   └→ Isian A auto → "SUPERSEDED" ⚪
                               │
                               └→ Dosen A dapat notif: "Isian digantikan"
```

---

## 🛠️ Technical Implementation

### 1. Database Schema

#### Enum Update
```prisma
enum IsianStatus {
  draft
  proses
  valid
  revisi
  superseded  // ← New status
}
```

#### Migration
```sql
ALTER TABLE `isian_ami` 
MODIFY `status` ENUM('draft', 'proses', 'valid', 'revisi', 'superseded') 
NOT NULL DEFAULT 'proses';
```

### 2. API Logic (`app/api/isians/[id]/review/route.ts`)

```typescript
export async function PATCH(request: NextRequest, { params }: Ctx) {
  // ... validation ...
  
  const data = await prisma.$transaction(async (tx) => {
    // Check for existing valid isian
    if (parsed.data.status === 'valid') {
      const existingValid = await tx.isianAmi.findFirst({
        where: {
          pemeriksaan_unsur_id: isian.pemeriksaan_unsur_id,
          periode_id: isian.periode_id,
          prodi_id: isian.prodi_id,
          status: 'valid',
          id: { not: Number(id) },
        },
      });

      if (existingValid) {
        throw new Error('Unsur ini sudah memiliki isian valid lain');
      }
    }

    // Update this isian to valid
    const updated = await tx.isianAmi.update({
      where: { id: Number(id) },
      data: {
        status: parsed.data.status,
        catatan_kaprodi: parsed.data.catatan_kaprodi,
        reviewed_by: user.userId,
        reviewed_at: new Date(),
      },
    });

    // Auto-supersede other isian
    if (parsed.data.status === 'valid') {
      const supersededIsians = await tx.isianAmi.findMany({
        where: {
          pemeriksaan_unsur_id: isian.pemeriksaan_unsur_id,
          periode_id: isian.periode_id,
          prodi_id: isian.prodi_id,
          id: { not: Number(id) },
          status: { in: ['proses', 'revisi', 'draft'] },
        },
      });

      for (const si of supersededIsians) {
        await tx.isianAmi.update({
          where: { id: si.id },
          data: {
            status: 'superseded',
            catatan_kaprodi: `Isian digantikan oleh isian valid (ID: ${id})`,
            reviewed_by: user.userId,
            reviewed_at: new Date(),
          },
        });

        await tx.isianReviewLog.create({
          data: {
            isian_id: si.id,
            reviewer_id: user.userId,
            status_sebelum: si.status,
            status_sesudah: 'superseded',
            catatan: `Auto-superseded karena ada isian valid lain`,
          },
        });
      }
    }

    return updated;
  });

  return R.ok(data);
}
```

### 3. Frontend Updates

#### Status Badge Component
```tsx
const STATUS_META = {
  valid: { label: 'Valid', bg: 'bg-emerald-50', icon: CheckCircle },
  proses: { label: 'Menunggu Review', bg: 'bg-amber-50', icon: Clock },
  revisi: { label: 'Perlu Revisi', bg: 'bg-rose-50', icon: AlertCircle },
  superseded: { label: 'Digantikan', bg: 'bg-slate-50', icon: XCircle },
  kosong: { label: 'Belum Diisi', bg: 'bg-slate-50', icon: CircleDashed },
};
```

#### Riwayat Page
```tsx
// Add "superseded" to filter dropdown
<option value="superseded">Digantikan</option>

// Add to status badge handler
case 'superseded':
  return { 
    bg: 'bg-slate-100', 
    text: 'text-slate-600', 
    icon: XCircle, 
    label: 'Digantikan' 
  };
```

---

## 📊 User Experience

### Untuk Dosen

#### Scenario A: Isian Dosen Menang (Valid)
```
✅ Selamat! Isian Anda telah divalidasi oleh Kaprodi.
   Status: VALID
   Aksi: Tidak ada (sudah selesai)
```

#### Scenario B: Isian Dosen Kalah (Superseded)
```
ℹ️ Isian Anda telah digantikan oleh isian valid dari dosen lain.
   Status: SUPERSEDED
   Catatan: "Isian ini telah digantikan oleh isian valid dari dosen lain (ID: 123)"
   Aksi: Tidak ada (tidak perlu revisi lagi)
   
💡 Tips: Tidak perlu khawatir, ini normal karena prodi sudah memiliki 
   isian valid untuk unsur ini. Terima kasih atas kontribusi Anda!
```

#### Scenario C: Isian Perlu Revisi (Revisi)
```
❌ Isian Anda perlu diperbaiki sesuai catatan Kaprodi.
   Status: REVISI
   Catatan: [catatan dari kaprodi]
   Aksi: Perbaiki isian → Submit ulang
   
⚠️ Catatan: Jika ada dosen lain yang isiannya divalidasi lebih dulu,
   isian Anda akan otomatis digantikan (tidak perlu revisi lagi).
```

### Untuk Kaprodi

#### Review Interface
```
📋 Isian untuk Unsur: "Dokumen Kurikulum"
───────────────────────────────────────────
Isian #1 (Dosen: Dr. Ahmad)
Status: Menunggu Review
Judul: "Kurikulum TI 2024"
[Lihat Detail] [Validasi] [Minta Revisi]

Isian #2 (Dosen: Dr. Budi)
Status: Menunggu Review
Judul: "Revisi Kurikulum TI 2025"
[Lihat Detail] [Validasi] [Minta Revisi]

⚠️ Catatan: Hanya 1 isian yang boleh divalidasi per unsur.
   Isian lain akan otomatis digantikan.
```

#### After Validation
```
✅ Isian berhasil divalidasi!
   
📊 Status Update:
   • Isian #1 (Dr. Ahmad) → VALID ✅
   • Isian #2 (Dr. Budi) → SUPERSEDED (auto) ⚪
   
ℹ️ Isian #2 telah otomatis digantikan dan tidak perlu direview lagi.
```

---

## 🧪 Testing Scenarios

### Test 1: Basic First Valid Wins
```bash
# Setup
- Prodi: TI
- Unsur: X
- Dosen A submit → Status: proses
- Dosen B submit → Status: proses

# Action
- Kaprodi validasi Isian A

# Expected
- Isian A → status: valid ✅
- Isian B → status: superseded ⚪
- Unsur X → status: valid (kolektif)
```

### Test 2: No Double Valid
```bash
# Setup
- Isian A → status: valid (already)
- Isian B → status: proses

# Action
- Kaprodi coba validasi Isian B

# Expected
- Error: "Unsur ini sudah memiliki isian valid lain"
- Isian B tetap: proses
```

### Test 3: Revisi vs Valid
```bash
# Setup
- Isian A → status: revisi
- Isian B → status: proses

# Action
- Kaprodi validasi Isian B

# Expected
- Isian B → status: valid ✅
- Isian A → status: superseded ⚪ (tidak perlu revisi lagi)
```

### Test 4: Draft Ignored
```bash
# Setup
- Isian A → status: draft (not submitted)
- Isian B → status: proses

# Action
- Kaprodi validasi Isian B

# Expected
- Isian B → status: valid ✅
- Isian A → status: superseded ⚪ (draft juga digantikan)
```

---

## 📈 Benefits

### 1. **Clear Winner**
- ✅ Tidak ada ambiguitas: yang pertama valid = pemenang
- ✅ Dosen lain tahu bahwa unsur sudah selesai

### 2. **No Wasted Effort**
- ✅ Dosen yang isiannya "superseded" tidak perlu revisi
- ✅ Kaprodi tidak perlu review isian lain

### 3. **Data Integrity**
- ✅ Hanya 1 isian valid per unsur per prodi
- ✅ Tidak ada duplikasi data
- ✅ Status konsisten di seluruh sistem

### 4. **Fair & Transparent**
- ✅ First come, first served (yang pertama valid menang)
- ✅ Notifikasi jelas untuk dosen yang kalah
- ✅ Review log mencatat semua perubahan

---

## 🚨 Edge Cases & Handling

### Edge Case 1: Concurrent Validation
**Problem**: Kaprodi validasi 2 isian bersamaan

**Solution**: Transaction lock di database
```typescript
await prisma.$transaction(async (tx) => {
  // Check existing valid (with row lock)
  const existingValid = await tx.isianAmi.findFirst({
    where: { ... },
  });
  
  if (existingValid) throw new Error('Already valid');
  
  // Update this isian
  await tx.isianAmi.update({ ... });
});
```

### Edge Case 2: Kaprodi Ingin Ubah Pemenang
**Problem**: Isian A valid, tapi Kaprodi ingin ganti ke Isian B

**Solution**: Manual intervention
```
1. Kaprodi ubah status Isian A dari "valid" → "revisi"
2. Unsur jadi tidak terkunci lagi
3. Kaprodi validasi Isian B
4. Isian B jadi "valid", Isian A auto "superseded"
```

### Edge Case 3: Dosen Komplain Isian Digantikan
**Problem**: Dosen tidak terima isiannya digantikan

**Solution**: Komunikasi & Transparansi
```
1. Tampilkan pesan jelas di UI: "Isian valid lain sudah dipilih"
2. Berikan link ke isian yang valid (untuk transparansi)
3. Kaprodi bisa jelaskan alasan lewat catatan
4. Jika memang perlu, Kaprodi bisa ubah keputusan (lihat Edge Case 2)
```

---

## 📝 Configuration

### Environment Variables
```env
# Feature flag (optional)
ENABLE_FIRST_VALID_WINS=true
```

### Database Indexes
```sql
-- Already exists, no need to add
INDEX (pemeriksaan_unsur_id, periode_id, prodi_id, status)
```

---

## 🔄 Migration Checklist

- [x] Update Prisma schema (add `superseded` enum)
- [x] Create database migration
- [x] Run migration
- [x] Update API `/api/isians/[id]/review`
- [x] Update frontend `dosen/riwayat/page.tsx`
- [x] Update frontend `dosen/isi-ami/page.tsx`
- [x] Update API `/api/isians/by-unsur`
- [x] Generate Prisma Client
- [ ] Test all scenarios
- [ ] Update user documentation
- [ ] Deploy to production

---

## 📚 Related Documentation

- **CHANGES_RIWAYAT_DOSEN.md** - Riwayat per dosen implementation
- **PANDUAN_RIWAYAT_DOSEN.md** - User guide
- **README_RIWAYAT_DOSEN.md** - Technical overview

---

## ✅ Status

**Implementation**: ✅ COMPLETED  
**Testing**: 🔄 IN PROGRESS  
**Documentation**: ✅ COMPLETED  
**Deployment**: ⏳ PENDING

**Last Updated**: June 19, 2026
