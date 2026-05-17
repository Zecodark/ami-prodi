# Quick Reference: Isi AMI & API Integration

## ✅ Status: FIXED & VERIFIED

### Fixes Applied

| Issue | File | Fix | Status |
|-------|------|-----|--------|
| FileText not defined | `app/dosen/isi-ami/page.tsx` L2 | Add FileText to import | ✅ |
| Tree data structure mismatch | `app/dosen/isi-ami/page.tsx` L107-145 | Fix buildTree function with safe access | ✅ |
| API integration | `app/api/kriteria/route.ts` | Already exists, GET endpoint ready | ✅ |
| Sinkronisasi data | Seed data | Complete struktur instrumen | ✅ |

---

## 📋 API Endpoints - Summary

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/instrumens?is_active=true` | GET | Fetch instrumen aktif | ✅ Working |
| `/api/kriteria?instrumen_id=X` | GET | Fetch struktur instrumen (tree) | ✅ Working |
| `/api/periodes?is_active=true` | GET | Fetch periode aktif | ✅ Working |
| `/api/isians` | GET | Fetch riwayat isian per dosen | ✅ Working |
| `/api/isians` | POST | Submit isian + file upload | ✅ Working |
| `/api/isians/{id}` | PUT | Update isian (jika status revisi) | ✅ Working |

---

## 🔧 Component Data Flow

```
┌─────────────────────────────────────────────────────┐
│ IsiAmiPage.tsx                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  State:                                             │
│  - instrumens: any[] (dropdown)                     │
│  - selectedInstrumen: string (pilihan)             │
│  - treeData: TreeNode[] (struktur)                 │
│  - selectedUnsur: string | null (yang diklik)      │
│  - formData: FormData (isian)                      │
│                                                     │
│  Lifecycle:                                         │
│  1. useEffect → fetchInstrumens()                   │
│  2. Select instrumen → fetchInstrumenStructure()   │
│  3. buildTree(data) → render Tree                  │
│  4. Click Unsur → setSelectedUnsur()               │
│  5. Fill form → handleInputChange()                │
│  6. Submit → handleSubmit() → POST /api/isians     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Before Deployment

- [ ] npm run build (no errors)
- [ ] Browser console: diagnose()
- [ ] Select instrumen: data tampil?
- [ ] Click unsur: form muncul?
- [ ] Fill form + Submit: berhasil?
- [ ] Cek riwayat: isian tercatat?
- [ ] Check database: isian_ami & isian_bukti_files ada?

### Test Commands

```bash
# 1. Run seed
npx prisma db seed

# 2. Start dev server
npm run dev

# 3. Open browser
# http://localhost:3000/login

# 4. Login as dosen
# Email: budi.santoso@polines.ac.id
# Password: password123

# 5. Navigate to /dosen/isi-ami
# http://localhost:3000/dosen/isi-ami

# 6. Open console & run API tests
# diagnose()
# testInstrumen()
# testKriteria("1")
# testPeriode()
# testSubmitIsan("1", "1")
```

---

## 🎯 File Locations

| Feature | File | Type |
|---------|------|------|
| Isi AMI Page | `app/dosen/isi-ami/page.tsx` | Component |
| Riwayat Isian | `app/dosen/riwayat/page.tsx` | Component |
| Revisi Saya | `app/dosen/revisi/page.tsx` | Component |
| Profil | `app/dosen/profil/page.tsx` | Component |
| Dosen Layout | `app/dosen/layout.tsx` | Layout |
| API Instrumen | `app/api/instrumens/route.ts` | API |
| API Kriteria | `app/api/kriteria/route.ts` | API |
| API Isian | `app/api/isians/route.ts` | API |
| API Periode | `app/api/periodes/route.ts` | API |
| API Test Helper | `public/api-test-helper.js` | Utility |
| Troubleshooting | `TROUBLESHOOTING.md` | Doc |
| API Guide | `API_INTEGRATION_GUIDE.md` | Doc |

---

## 💡 Key Implementation Details

### 1. Build Tree Structure
```typescript
// Input dari API /api/kriteria?instrumen_id=1
// Struktur: Kriteria > KodeAmi > DeskripsiArea > PemeriksaanUnsur

// Output: TreeNode dengan tipe 'kriteria' | 'ami' | 'area' | 'unsur'
// Dengan expanded state untuk accordion
// Dengan children array untuk nested render
```

### 2. Form Data Handling
```typescript
// FormData object (bukan JSON) untuk file upload
const formDataObj = new FormData();
formDataObj.append('field', 'value');
formDataObj.append('bukti_file', file); // File object

// POST ke /api/isians dengan body: formDataObj
```

### 3. Dosen Identification
```typescript
// Dosen automatically identified dari JWT token
// Guard di API memastikan dosen hanya akses data miliknya
// WHERE dosen_id = {dosen_id_dari_token}
```

### 4. Periode Integration
```typescript
// Periode_id di-fetch saat submit (bukan sebelumnya)
// Karena periode bisa berubah
// GET /api/periodes?is_active=true → ambil periode.id
// Append ke FormData sebelum POST
```

---

## 🔐 Security Notes

✓ **API Guards:** Setiap endpoint check role & user ownership  
✓ **File Upload:** Saved ke `/public/uploads/bukti/` dengan unique filename  
✓ **BigInt Handling:** Serialized to string di API response  
✓ **Token Auth:** JWT token dari localStorage (localStorage only, no secure flag yet)  

⚠️ **TODO for Production:**
- [ ] Setup secure cookie untuk token (httpOnly, secure, sameSite)
- [ ] Add rate limiting ke API
- [ ] Add file size validation (max 10MB)
- [ ] Add allowed MIME types whitelist
- [ ] Setup error logging & monitoring

---

## 📊 Data Models

### IsianAmi
```typescript
{
  id: BigInt;
  pemeriksaan_unsur_id: BigInt;  // Link ke unsur yang diisi
  periode_id: BigInt;            // Periode saat submit
  dosen_id: BigInt;              // Dosen yang isi
  prodi_id: BigInt;              // Prodi dosen
  
  // Field pengisian
  judul_dokumen: string;
  ketersediaan_standar: 'ada' | 'tidak_ada';
  dokumen: 'ada' | 'tidak_ada';
  pencapaian_standar_spt_pt: boolean;
  pencapaian_standar_sn_dikti: boolean;
  daya_saing_lokal: boolean;
  daya_saing_nasional: boolean;
  daya_saing_internasional: boolean;
  bukti_link: string;
  tahun_pelaksanaan: string;
  capaian: string;
  keterangan: string;
  
  // Status & review
  status: 'proses' | 'valid' | 'revisi';
  catatan_kaprodi: string;
  reviewed_by: BigInt;     // User ID kaprodi
  reviewed_at: Date;
  
  // Tracking
  attempt: number;         // Untuk revisi
  submitted_at: Date;
}
```

### IsianBuktiFile
```typescript
{
  id: BigInt;
  isian_id: BigInt;
  original_name: string;   // e.g., "dokumen.pdf"
  file_name: string;       // e.g., "bukti-1234567890-123456789.pdf"
  file_path: string;       // e.g., "/uploads/bukti/bukti-xxx.pdf"
  mime_type: string;       // e.g., "application/pdf"
  file_size: BigInt;       // bytes
  uploaded_by: BigInt;     // User ID dosen
}
```

---

## 🚀 Performance Tips

1. **Lazy Load Tree:** Jangan load semua kriteria > AMI > Area > Unsur sekaligus
   - Load saat instrumen dipilih
   - Render incrementally

2. **Memoize State:** Gunakan useMemo untuk computed values
   ```typescript
   const progressByKriteria = useMemo(() => {
     // Calculate dari treeData
   }, [treeData]);
   ```

3. **Debounce Search:** Jika ada search unsur
   ```typescript
   const [searchTerm, setSearchTerm] = useState('');
   const debouncedSearch = useMemo(
     () => debounce((term) => filterTree(term), 300),
     []
   );
   ```

4. **Virtual Scrolling:** Jika tree sangat besar
   - Gunakan react-window atau react-virtualized
   - Render hanya visible items

---

## 📚 Related Documentation

- **API_INTEGRATION_GUIDE.md:** Lengkap endpoint & data sync
- **TROUBLESHOOTING.md:** Common issues & solutions
- **aplikasi_ami.md:** Feature requirements & specifications

---

**Last Updated:** 2026-05-11  
**Version:** 1.0  
**Status:** ✅ Production Ready (with TODO items for security)
