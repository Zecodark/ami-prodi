# Troubleshooting: Isi AMI Error & Solusi

## 🔴 Error: "FileText is not defined"

### ✅ Status: FIXED

**Penyebab:** Icon `FileText` dari lucide-react tidak diimport di isi-ami/page.tsx

**Solusi yang diterapkan:**
```typescript
// SEBELUM (ERROR):
import { FileUp, ChevronDown, Save, Send, AlertCircle, CheckCircle } from 'lucide-react';

// SESUDAH (BENAR):
import { FileUp, ChevronDown, Save, Send, AlertCircle, CheckCircle, FileText } from 'lucide-react';
```

**File yang diupdate:** `app/dosen/isi-ami/page.tsx` line 2

---

## 🟡 Potensi Issue: Data Tree Struktur Kosong

### Penyebab Umum

#### 1. API `/api/kriteria` tidak return data
**Check:**
```javascript
// Di browser console setelah login
fetch('/api/kriteria?instrumen_id=1', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('ami_token')}` }
})
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)))
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "1",
      "kode_kriteria": "K1",
      "nama_kriteria": "Visi, Misi, Tujuan dan Strategi",
      "kode_amis": [...]
    }
  ]
}
```

#### 2. Data struktur tidak match dengan buildTree function
**Perbaikan yang sudah diterapkan:**
```typescript
const buildTree = (kriteria: any[]) => {
  const tree: TreeNode[] = kriteria.map(k => {
    const kodeAmis = (k.kode_amis || []).map((ami: any) => {
      const deskripsiAreas = (ami.deskripsi_areas || []).map((area: any) => ({
        id: area.id?.toString() || Math.random().toString(),
        deskripsi_area_audit: area.deskripsi_area_audit,
        type: 'area' as const,
        expanded: true,
        children: (area.pemeriksaan_unsurs || []).map((unsur: any) => ({
          id: unsur.id?.toString() || Math.random().toString(),
          isi_unsur: unsur.isi_unsur,
          type: 'unsur' as const,
        }))
      }));
      
      return {
        id: ami.id?.toString() || Math.random().toString(),
        kode_ami: ami.kode_ami,
        type: 'ami' as const,
        expanded: true,
        children: deskripsiAreas
      };
    });
    
    return {
      id: k.id?.toString() || Math.random().toString(),
      kode_kriteria: k.kode_kriteria,
      nama_kriteria: k.nama_kriteria,
      type: 'kriteria' as const,
      expanded: true,
      children: kodeAmis
    };
  });
  setTreeData(tree);
};
```

**Perubahan:**
- ✓ Convert BigInt ke string dengan `.toString()`
- ✓ Add fallback `Math.random()` untuk data tanpa ID
- ✓ Safe access dengan `?.` operator
- ✓ Proper type casting dengan `as const`

---

## 🟢 Verifikasi Data Sinkronisasi

### Checklist untuk Admin yang membuat data:

```sql
-- 1. Check Periode Aktif
SELECT * FROM periodes WHERE is_active = TRUE;
-- ✓ Harus ada minimal 1 periode aktif

-- 2. Check Instrumen Aktif
SELECT i.*, p.tahun FROM instrumens i
JOIN periodes p ON i.periode_id = p.id
WHERE i.is_active = TRUE;
-- ✓ Harus ada instrumen dengan is_active = TRUE

-- 3. Check Struktur Instrumen
SELECT k.* FROM kriteria_standars k
WHERE k.instrumen_id = 1
ORDER BY k.urutan;
-- ✓ Harus ada kriteria

-- 4. Check Kode AMI
SELECT ka.* FROM kode_amis ka
JOIN kriteria_standars k ON ka.kriteria_id = k.id
WHERE k.instrumen_id = 1
ORDER BY ka.urutan;
-- ✓ Harus ada kode AMI untuk setiap kriteria

-- 5. Check Deskripsi Area
SELECT da.* FROM deskripsi_areas da
JOIN kode_amis ka ON da.kode_ami_id = ka.id
WHERE ka.kriteria_id IN (
  SELECT id FROM kriteria_standars WHERE instrumen_id = 1
)
ORDER BY da.urutan;
-- ✓ Harus ada deskripsi area

-- 6. Check Pemeriksaan Unsur
SELECT pu.* FROM pemeriksaan_unsurs pu
ORDER BY pu.urutan;
-- ✓ Harus ada minimal 3-5 unsur per area
```

---

## 🧪 Testing Step-by-Step

### Step 1: Verify Seed Data
```bash
# 1a. Jalankan seed jika belum
npx prisma db seed

# 1b. Check apakah data sudah ada
npm run dev
# Buka browser: http://localhost:3000
```

### Step 2: Test Login Dosen
```
Email: budi.santoso@polines.ac.id
Password: password123
```

### Step 3: Test Isi AMI Page
```javascript
// Di browser console
// Paste isi file: public/api-test-helper.js

// Jalankan diagnostic
diagnose()

// Harus output:
// ✅ Instrumen: X ditemukan
// ✅ Periode: X ditemukan
// ✅ Kriteria: X ditemukan
// ✅ Riwayat: X isian ditemukan
```

### Step 4: Test Pilih Instrumen & Struktur
```javascript
// Di console
testKriteria("1")

// Analyze output:
// - Kriteria ada?
// - Kode AMI ada?
// - Deskripsi Area ada?
// - Pemeriksaan Unsur ada?
```

### Step 5: Test Submit Isian
```javascript
// Get periode aktif
testPeriode()
// Copy periode_id dari output (biasanya "1")

// Get pemeriksaan_unsur_id
testKriteria("1")
// Scroll melihat struktur, catat unsur ID (biasanya "1")

// Test submit
testSubmitIsan("1", "1")
// Harus output: ✅ BERHASIL Submit Isian!
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot read property 'map' of undefined"
```
❌ Error: Cannot read property 'map' of undefined
```
**Solusi:**
- API tidak return `data` array
- Check response format di Network tab
- Pastikan API endpoint benar: `/api/kriteria?instrumen_id=X`
- Pastikan token valid

**Test:**
```javascript
testKriteria("1")
// Harus return object dengan property "data"
```

---

### Issue 2: Tree render kosong padahal data ada
```
❌ Struktur tidak muncul di sidebar
```
**Penyebab:** Data struktur tidak match dengan renderTree function

**Check:**
```javascript
// Di isi-ami/page.tsx state
console.log('treeData:', treeData)
```

**Solusi:** Sudah diperbaiki di buildTree function dengan safe access

---

### Issue 3: Submit gagal dengan error "periodo tidak ditemukan"
```
❌ Error: Tidak ada periode aktif
```
**Penyebab:** Tidak ada periode dengan is_active = TRUE

**Solusi:**
```sql
-- Update di database
UPDATE periodes SET is_active = TRUE WHERE tahun = '2025/2026';

-- Atau buat periode baru via admin UI
```

---

### Issue 4: File upload tidak bekerja
```
❌ File tidak tercopy ke /public/uploads/bukti/
```
**Penyebab:**
1. Directory permission issue
2. FormData tidak properly formatted
3. File size terlalu besar

**Solusi:**
```bash
# 1. Create uploads directory
mkdir -p public/uploads/bukti
chmod 755 public/uploads/bukti

# 2. Test dengan file kecil (<1MB)
# 3. Check console.log formData
```

**Debug:**
```javascript
// Di handleSubmit sebelum submit
console.log('FormData entries:');
for (let pair of formDataObj.entries()) {
  console.log(pair[0], ':', pair[1]);
}
```

---

### Issue 5: Authentication/Authorization error
```
❌ Error: 401 Unauthorized atau 403 Forbidden
```
**Penyebab:**
- Token expired
- Role tidak tepat
- Dosen profile tidak ada

**Solusi:**
```javascript
// 1. Clear dan re-login
localStorage.clear()

// 2. Verify user profile
console.log(JSON.parse(localStorage.getItem('ami_user')))
// Harus ada property: { role: "Dosen", dosen: { id, nama_lengkap, ... } }

// 3. Verify token valid
console.log(localStorage.getItem('ami_token').length > 0)
```

---

## 📝 Checklist Sebelum Production

- [ ] ✓ Semua imports sudah lengkap (FileText etc)
- [ ] ✓ buildTree function sudah fix struktur data
- [ ] ✓ Error handling sudah diterapkan
- [ ] ✓ Seed data sudah lengkap
- [ ] ✓ Periode aktif sudah ada
- [ ] ✓ Instrumen aktif sudah ada
- [ ] ✓ Struktur instrumen lengkap (K, AMI, Area, Unsur)
- [ ] ✓ API endpoints tested & working
- [ ] ✓ File upload directory exist & writeable
- [ ] ✓ Authentication flow verified
- [ ] [ ] Error logging setup
- [ ] [ ] Performance optimization (pagination, caching)
- [ ] [ ] Security audit (SQL injection, XSS, CSRF)

---

## 🚀 Quick Fix Script

Jika masih ada error, jalankan script ini di browser console:

```javascript
// 1. Reload page
window.location.reload()

// 2. Clear cache
window.caches.keys().then(names => {
  names.forEach(name => window.caches.delete(name))
})

// 3. Force re-login
localStorage.clear()
window.location.href = '/login'
```

---

## 📞 Support

Jika masih error setelah semua perbaikan:

1. **Check Network Tab:**
   - Buka DevTools (F12)
   - Go to Network tab
   - Reload page
   - Check setiap request ke `/api/`
   - Lihat status & response

2. **Check Console:**
   - Go to Console tab
   - Lihat error message detail
   - Copy-paste error ke dokumentasi ini

3. **Debug dengan API Helper:**
   ```javascript
   // Inject helper
   const script = document.createElement('script');
   script.src = '/api-test-helper.js';
   document.head.appendChild(script);
   
   // Tunggu loaded
   setTimeout(() => diagnose(), 2000);
   ```

---

**Last Updated:** 2026-05-11  
**Status:** ✅ All critical errors fixed
