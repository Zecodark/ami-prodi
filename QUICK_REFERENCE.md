# Quick Reference - Sistem AMI Prodi

## 🚀 Quick Start

```bash
# 1. Reset Database
npx prisma migrate reset --force

# 2. Start Server
npm run dev

# 3. Access
http://localhost:3000
```

---

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@polines.ac.id | password123 |
| **Kaprodi TI** | kaprodi.ti@polines.ac.id | password123 |
| **Kaprodi TRK** | kaprodi.trk@polines.ac.id | password123 |
| **Dosen 1 (TI)** | idhawati.hestiningsih@polines.ac.id | password123 |
| **Dosen 2 (TI)** | muttabik.fathul@polines.ac.id | password123 |
| **Dosen 3 (TI)** | sukamto@polines.ac.id | password123 |
| **Dosen 4 (TRK)** | wiktasari@polines.ac.id | password123 |

---

## 🎯 Key Features

### 1. View-Only untuk Isian Valid ✅
```
Dosen → Klik unsur valid → ViewValidIsian (read-only)
      → Submit buttons TIDAK tampil
      → Bisa download file & klik link
```

### 2. Per-Dosen History ✅
```
Constraint: unique([unsur_id, periode_id, dosen_id])
Setiap dosen: Riwayat isian terpisah
```

### 3. First Valid Wins ✅
```
Multiple dosen mengisi → Kaprodi validasi 1 → Winner
                       → Lainnya auto superseded
```

### 4. Revision Flow ✅
```
Submit → Revisi → Perbaiki → **SUBMIT ULANG** → Review
```

### 5. Uppercase Kriteria ✅
```
Display: [K1] CRITERIA 1: VISI, MISI, TUJUAN DAN STRATEGI
```

---

## 📊 Sample Data (Seeder)

| Prodi | Valid | Proses | Revisi | Superseded | Kosong |
|-------|-------|--------|--------|------------|--------|
| **TI (D3)** | 40 | 10 | 8 | 5 | ~40 |
| **TRK (D4)** | 15 | 5 | 3 | 0 | ~77 |

**Special Scenario:**
- Unsur 1.1: 3 dosen compete → Dosen 1 wins (valid) → Dosen 2 & 3 superseded
- Unsur 1.2: 2 dosen compete → Dosen 2 wins (valid) → Dosen 1 superseded

---

## 🧪 Testing Checklist

### Test 1: View Valid Isian
- [ ] Login Dosen 1
- [ ] Klik unsur 1.1 (status valid)
- [ ] Verify: ViewValidIsian tampil
- [ ] Verify: Submit buttons TIDAK tampil
- [ ] Verify: Bisa download file

### Test 2: Competing Scenario
- [ ] Login Dosen 2
- [ ] Klik unsur 1.1
- [ ] Verify: Status "Digantikan"
- [ ] Verify: Catatan menyebut Dosen 1

### Test 3: Revision Flow
- [ ] Login Dosen
- [ ] Klik unsur revisi
- [ ] Verify: Form editable
- [ ] Verify: Catatan kaprodi tampil
- [ ] Edit & submit ulang
- [ ] Verify: Status jadi "Menunggu Review"

### Test 4: Per-Dosen History
- [ ] Login Dosen 1 → Riwayat Saya
- [ ] Verify: Hanya tampil isian Dosen 1
- [ ] Login Dosen 2 → Riwayat Saya
- [ ] Verify: Hanya tampil isian Dosen 2

### Test 5: Uppercase Kriteria
- [ ] Check tree view di Isi AMI
- [ ] Check breadcrumb
- [ ] Check ViewValidIsian
- [ ] Verify: Semua kriteria UPPERCASE

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| ViewValidIsian tidak muncul | Check console: `viewValidData` state |
| Multiple isian untuk unsur sama | Expected! Per-dosen history |
| Kaprodi tidak bisa validasi revisi | By design! Dosen submit ulang dulu |
| Status superseded tidak muncul | Run migrations & generate Prisma |
| Cache issue | Hapus folder `.next`, restart server |

---

## 📂 Important Files

### Components
```
app/dosen/isi-ami/ViewValidIsian.tsx    - View-only component
app/dosen/isi-ami/page.tsx              - Main page dengan conditional
```

### API Routes
```
app/api/isians/route.ts                 - CRUD isian (with validation)
app/api/isians/[id]/review/route.ts     - Review & auto-supersede
app/api/isians/by-unsur/route.ts        - Status per unsur
```

### Database
```
prisma/schema.prisma                    - Schema (constraint per-dosen)
prisma/seed.ts                          - Realistic seeder
```

### Docs
```
FINAL_SUMMARY.md                        - Complete summary
TEST_GUIDE_VIEW_ONLY.md                 - Testing guide
SEEDER_DOCUMENTATION.md                 - Seeder guide
```

---

## 💡 Pro Tips

### 1. Reset Database dengan Data Baru
```bash
npx prisma migrate reset --force
# Otomatis run seeder
```

### 2. Check Database di Browser
```bash
npx prisma studio
# Buka di browser untuk explore data
```

### 3. Debug Console Log
```javascript
// Check di browser console (F12)
🔍 DEBUG: item.status = valid
✅ Valid isian detected, setting viewValidData
```

### 4. Access dari Device Lain (LAN)
```bash
# 1. Cari IP: ipconfig (Windows) atau ifconfig (Mac/Linux)
# 2. Access: http://[YOUR-IP]:3000
# 3. Pastikan firewall allow port 3000
```

### 5. Clear Next.js Cache
```bash
# Jika ada issue aneh
rm -rf .next
npm run dev
```

---

## 📞 Support

### Documentation
- `FINAL_SUMMARY.md` - Overview lengkap
- `VIEW_ONLY_VALID_ISIAN.md` - View-only details
- `FIRST_VALID_WINS.md` - First valid wins
- `FLOW_REVISI_ISIAN.md` - Revision flow

### Troubleshooting
- `QUICK_FIX_SUPERSEDED.md` - Emergency fixes
- `SEEDER_DOCUMENTATION.md` - Seeder issues

---

## ✅ Status

| Feature | Status |
|---------|--------|
| View-Only Valid Isian | ✅ Complete |
| Per-Dosen History | ✅ Complete |
| First Valid Wins | ✅ Complete |
| Revision Flow | ✅ Complete |
| Uppercase Kriteria | ✅ Complete |
| Network Access | ✅ Complete |
| Realistic Seeder | ✅ Complete |
| Documentation | ✅ Complete |
| **PRODUCTION READY** | ✅ **YES** |

---

**Version**: 1.0  
**Last Updated**: 2026-06-19  
**Status**: Production Ready 🚀
