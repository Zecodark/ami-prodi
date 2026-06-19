# View Valid Logic - Semua Dosen Lihat Isian Valid

## Overview
Ketika ada isian AMI yang sudah divalidasi (status: `valid`) untuk suatu unsur tertentu, **SEMUA dosen di prodi yang sama** hanya bisa **VIEW ONLY** untuk unsur tersebut.

## Alur Logic

### Scenario 1: Unsur Sudah Ada Isian Valid
```
User: Dosen A (Prodi Informatika)
Unsur 1.1: Sudah divalidasi (isian milik Dosen B)

Ketika Dosen A klik Unsur 1.1:
→ Sistem cek statusMap → status = 'valid'
→ Sistem fetch isian yang valid (milik Dosen B)
→ Tampilkan ViewValidIsian component (VIEW ONLY)
→ Dosen A TIDAK BISA edit/submit isian lagi
```

### Scenario 2: Unsur Belum Valid (Dosen Punya Isian Sendiri)
```
User: Dosen A (Prodi Informatika)
Unsur 1.2: Status 'proses' atau 'revisi' (isian milik Dosen A sendiri)

Ketika Dosen A klik Unsur 1.2:
→ Sistem cek statusMap → status = 'proses' atau 'revisi'
→ Sistem fetch isian milik Dosen A
→ Tampilkan form editable
→ Dosen A bisa edit dan submit ulang
```

### Scenario 3: Unsur Belum Ada Isian Sama Sekali
```
User: Dosen A (Prodi Informatika)
Unsur 1.3: Status 'kosong'

Ketika Dosen A klik Unsur 1.3:
→ Sistem cek statusMap → status = 'kosong'
→ Tampilkan form kosong baru
→ Dosen A bisa mengisi dan submit
```

### Scenario 4: Isian Dosen Ter-superseded
```
User: Dosen A (Prodi Informatika)
Unsur 1.4: Dosen A sudah isi tapi Dosen B yang divalidasi (Dosen A = superseded)

Ketika Dosen A klik Unsur 1.4:
→ Sistem cek statusMap → status = 'valid' (karena ada isian valid dari Dosen B)
→ Sistem fetch isian yang valid (milik Dosen B)
→ Tampilkan ViewValidIsian component (VIEW ONLY)
→ Isian milik Dosen A (superseded) TIDAK ditampilkan
→ Dosen A lihat isian pemenang (Dosen B)
```

## Implementation Details

### Frontend Logic (`app/dosen/isi-ami/page.tsx`)

```typescript
const handleNodeClick = async (e: React.MouseEvent | any, id: string) => {
  // 1. Check statusMap terlebih dahulu
  const unsurInfo = statusMap[id];
  
  // 2. Jika status = 'valid', fetch isian yang valid untuk view-only
  if (unsurInfo?.status === 'valid' && unsurInfo.latest_isian_id) {
    const detailRes = await fetch(`/api/isians/${unsurInfo.latest_isian_id}`);
    const detailJson = await detailRes.json();
    
    if (detailJson.data) {
      setViewValidData(detailJson.data); // VIEW ONLY
      return; // Stop here
    }
  }
  
  // 3. Jika belum valid, fetch isian milik dosen sendiri
  const res = await fetch(`/api/isians?pemeriksaan_unsur_id=${id}`);
  const json = await res.json();
  
  if (json.data?.length > 0) {
    setIsianForm(json.data[0]); // EDITABLE FORM
  } else {
    resetForm(id); // EMPTY FORM
  }
};
```

### API Response (`/api/isians/by-unsur`)

```json
{
  "data": {
    "123": {
      "status": "valid",
      "counts": {
        "valid": 1,
        "revisi": 0,
        "proses": 0,
        "total": 3
      },
      "latest_isian_id": "456",
      "latest_dosen_nama": "Idhawati Hestiningsih, S.KOM., M.KOM.",
      "reviewed_at": "2026-06-19T10:30:00Z",
      "updated_at": "2026-06-19T10:30:00Z"
    }
  }
}
```

**Key Fields:**
- `status`: Status aggregate untuk unsur ini di prodi
- `latest_isian_id`: ID isian yang valid (untuk fetch detail)
- `latest_dosen_nama`: Nama dosen pemilik isian valid

## User Experience

### Dosen yang Menang (Isian Divalidasi)
✅ Klik unsur → Lihat isian sendiri (VIEW ONLY)
✅ Badge hijau "Valid"
✅ Informasi kapan divalidasi
✅ Tidak bisa edit lagi (final)

### Dosen Lain di Prodi yang Sama
✅ Klik unsur → Lihat isian yang divalidasi (VIEW ONLY)
✅ Badge hijau "Valid"
✅ Tampilan sama seperti dosen pemenang
✅ Tidak bisa submit isian baru (unsur sudah selesai)

### Benefit untuk Dosen Lain
1. **Transparansi**: Lihat isian mana yang diterima
2. **Pembelajaran**: Bisa lihat contoh isian yang valid
3. **Koordinasi**: Tahu unsur mana yang sudah selesai
4. **Tidak duplikasi**: Tidak perlu mengisi ulang unsur yang sudah selesai

## Status Badge Behavior

### Di Tree View
```
Unsur 1.1 [●] Renstra Polines 2025-2029
          ↑
    Dot hijau = Ada isian valid
```

### Di Detail Panel
```
┌─────────────────────────────────┐
│ ✅ TERVALIDASI                  │
│                                 │
│ Renstra Polines 2025-2029       │
│ Isian ini telah divalidasi oleh │
│ Kaprodi dan tidak dapat diubah  │
│ lagi!                           │
│                                 │
│ PENGISI                         │
│ Idhawati Hestiningsih, S.KOM.   │
│ 1962108/123821                  │
│                                 │
│ TANGGAL SUBMIT                  │
│ 19 Juni 2026                    │
│                                 │
│ DIVALIDASI                      │
│ 19 Juni 2026                    │
│ 11:20 WIB                       │
└─────────────────────────────────┘
```

## Edge Cases Handled

### ✅ Case 1: Dosen C Join Setelah Validasi
```
Timeline:
1. Dosen A & B compete untuk Unsur 1.1
2. Dosen B menang (valid)
3. Dosen C baru ditambahkan ke prodi
4. Dosen C klik Unsur 1.1

Result:
→ Dosen C lihat isian valid milik Dosen B (VIEW ONLY)
→ Tidak bisa submit isian baru
```

### ✅ Case 2: Race Condition (2 Dosen Submit Bersamaan)
```
Timeline:
1. Dosen A submit Unsur 1.1 (jam 10:00)
2. Dosen B submit Unsur 1.1 (jam 10:01)
3. Kaprodi validasi isian Dosen A (jam 10:30)

Result:
→ Isian Dosen A = valid (menang)
→ Isian Dosen B = superseded (kalah)
→ Semua dosen di prodi lihat isian Dosen A
```

### ✅ Case 3: Isian Valid Kemudian Dihapus (Tidak Mungkin)
```
Sistem tidak allow delete isian valid.
API akan reject jika ada attempt delete isian valid.
```

## API Endpoints Used

### 1. Get Status Map
```
GET /api/isians/by-unsur?periode_id=1&prodi_id=2
```
Returns: Status aggregate per unsur untuk prodi

### 2. Get Valid Isian Detail
```
GET /api/isians/{isian_id}
```
Returns: Detail lengkap isian yang valid

### 3. Get Dosen Own Isian
```
GET /api/isians?pemeriksaan_unsur_id={unsur_id}
```
Returns: Isian milik dosen yang sedang login

## Database Query Flow

```sql
-- 1. statusMap query (by-unsur API)
SELECT 
  pemeriksaan_unsur_id,
  status,
  COUNT(*) as total,
  MAX(CASE WHEN status = 'valid' THEN id END) as latest_valid_id
FROM isian_ami
WHERE periode_id = 1 AND prodi_id = 2
GROUP BY pemeriksaan_unsur_id

-- 2. Detail query (when status = valid)
SELECT * FROM isian_ami
WHERE id = {latest_valid_id}
INCLUDE dosen, bukti_files, pemeriksaan_unsur

-- 3. Own isian query (when status != valid)
SELECT * FROM isian_ami
WHERE pemeriksaan_unsur_id = {unsur_id}
  AND dosen_id = {current_dosen_id}
ORDER BY attempt DESC
LIMIT 1
```

## Testing Checklist

### Test Case 1: View Valid Isian (Dosen Lain)
- [ ] Login sebagai Dosen A
- [ ] Klik unsur yang sudah valid (milik Dosen B)
- [ ] Verifikasi: ViewValidIsian component muncul
- [ ] Verifikasi: Nama dosen = Dosen B
- [ ] Verifikasi: Tidak ada button Submit/Simpan

### Test Case 2: View Own Valid Isian
- [ ] Login sebagai Dosen B
- [ ] Klik unsur yang valid (milik Dosen B sendiri)
- [ ] Verifikasi: ViewValidIsian component muncul
- [ ] Verifikasi: Nama dosen = Dosen B
- [ ] Verifikasi: Badge "Tervalidasi" muncul

### Test Case 3: Edit Isian Revisi (Own)
- [ ] Login sebagai Dosen C
- [ ] Klik unsur dengan status revisi (milik Dosen C)
- [ ] Verifikasi: Form editable muncul
- [ ] Verifikasi: Catatan kaprodi visible
- [ ] Verifikasi: Button "Kirim Ulang" available

### Test Case 4: New Isian
- [ ] Login sebagai Dosen A
- [ ] Klik unsur kosong (belum ada isian)
- [ ] Verifikasi: Form kosong baru
- [ ] Verifikasi: All fields editable
- [ ] Verifikasi: Button "Simpan Draft" & "Kirim untuk Review"

### Test Case 5: Superseded (Hidden)
- [ ] Login sebagai Dosen D (isian superseded)
- [ ] Klik unsur yang valid (menang: Dosen B)
- [ ] Verifikasi: Lihat isian Dosen B (bukan isian sendiri)
- [ ] Verifikasi: Tidak bisa submit lagi

## Summary

| Kondisi | Dosen Pemilik Isian | Dosen Lain di Prodi | Action Allowed |
|---------|-------------------|-------------------|----------------|
| Status Valid | View Only | View Only | ❌ No Edit/Submit |
| Status Proses | View/Edit Own | Cannot See | ✅ Wait for Review |
| Status Revisi | View/Edit Own | Cannot See | ✅ Fix & Resubmit |
| Status Superseded | View Winner | View Winner | ❌ No Action |
| Status Kosong | Can Fill | Can Fill | ✅ Submit New |

**Kesimpulan:**
- ✅ Satu unsur yang valid = selesai untuk seluruh prodi
- ✅ Semua dosen lihat isian yang sama (view-only)
- ✅ Tidak ada duplikasi effort
- ✅ Transparansi penuh untuk semua dosen di prodi

---

_Last Updated: 2026-06-19_
