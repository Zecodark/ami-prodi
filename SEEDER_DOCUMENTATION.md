# Dokumentasi Seeder AMI Prodi

## 📋 Overview

Seeder ini membuat data sample realistic untuk sistem AMI Prodi dengan mempertimbangkan:
- **Constraint per-dosen**: `@@unique([pemeriksaan_unsur_id, periode_id, dosen_id])`
- **First Valid Wins**: Hanya 1 isian valid per unsur per prodi
- **Multiple competing isian**: Beberapa dosen bisa mengisi unsur yang sama
- **Status superseded**: Isian yang "kalah" otomatis jadi superseded

## 🎯 Data yang Di-generate

### 1. Master Data
- **4 Roles**: admin, kaprodi, dosen
- **1 Jurusan**: Teknik Elektro
- **2 Prodi**: 
  - D3 Teknik Informatika
  - D4 Teknologi Rekayasa Komputer
- **7 Users**:
  - 1 Admin
  - 2 Kaprodi (satu per prodi)
  - 4 Dosen (3 di TI, 1 di TRK)
- **3 Jenjang Standar**: S2/Magister Terapan, Sarjana Terapan, D3

### 2. Instrumen AMI
- **1 Periode**: 2025/2026 (aktif)
- **1 Instrumen**: "Instrumen AMI Program Studi 2025/2026"
- **34 Area Audit** (dari Excel seed data)
- **~100+ Pemeriksaan Unsur** (setiap nomor di kolom "Pemeriksaan Pada Unsur" = 1 unsur terpisah)

### 3. Isian AMI dengan Skenario Realistic

#### 📊 Statistik Target:
**Prodi TI (D3 Teknik Informatika):**
- Total isian: ~60 dari ~100 unsur
- Valid: 40 (40%)
- Menunggu Review: 10
- Perlu Revisi: 8
- Superseded: 5 (dari competing scenario)
- Kosong: ~40 unsur (belum ada isian dari dosen manapun)

**Prodi TRK (D4 Teknologi Rekayasa Komputer):**
- Total isian: ~23 dari ~100 unsur
- Valid: 15 (15%)
- Menunggu Review: 5
- Perlu Revisi: 3
- Kosong: ~77 unsur

## 🎭 Skenario Khusus yang Di-test

### Skenario 1: Multiple Dosen Competing - First Valid Wins

**Unsur 1.1 (Renstra Polines):**
```
├─ Dosen 1 (IDHAWATI): Status VALID ✅ (WINNER)
├─ Dosen 2 (MUTTABIK): Status SUPERSEDED ❌ (Kalah, isian digantikan)
└─ Dosen 3 (SUKAMTO): Status SUPERSEDED ❌ (Kalah, isian digantikan)
```

**Unsur 1.2 (Dokumen Mekanisme VMTS):**
```
├─ Dosen 2 (MUTTABIK): Status VALID ✅ (WINNER)
└─ Dosen 1 (IDHAWATI): Status SUPERSEDED ❌ (Kalah, isian digantikan)
```

**Flow:**
1. Ketiga dosen mengisi unsur 1.1 (masing-masing punya riwayat terpisah)
2. Kaprodi review → Dosen 1 divalidasi duluan
3. Sistem auto-supersede isian Dosen 2 & 3
4. UI untuk Dosen 2 & 3 menampilkan "Digantikan" untuk unsur 1.1

### Skenario 2: View-Only untuk Valid Isian

**Test Case:**
1. Login sebagai Dosen 1
2. Buka "Isi AMI"
3. Klik unsur 1.1 (status valid)
4. **Expected**: Tampil `ViewValidIsian` component (read-only, profesional)
5. **Expected**: Submit buttons TIDAK tampil

### Skenario 3: Editable Form untuk Non-Valid

**Test Case:**
1. Login sebagai Dosen 1
2. Buka "Isi AMI"
3. Klik unsur dengan status "Perlu Revisi"
4. **Expected**: Tampil form editable
5. **Expected**: Catatan revisi dari kaprodi tampil
6. **Expected**: Submit buttons enabled

### Skenario 4: Riwayat Per-Dosen Terpisah

**Test Case:**
1. Login sebagai Dosen 1
2. Buka "Riwayat Saya"
3. **Expected**: Hanya tampil isian milik Dosen 1
4. Logout, login sebagai Dosen 2
5. Buka "Riwayat Saya"
6. **Expected**: Hanya tampil isian milik Dosen 2 (berbeda dengan Dosen 1)

## 🔐 Akun Login

### Admin
- **Email**: `admin@polines.ac.id`
- **Password**: `password123`
- **Role**: Administrator sistem
- **Akses**: Semua menu management

### Kaprodi TI
- **Email**: `kaprodi.ti@polines.ac.id`
- **Password**: `password123`
- **Prodi**: D3 Teknik Informatika
- **Akses**: Review AMI prodi TI

### Kaprodi TRK
- **Email**: `kaprodi.trk@polines.ac.id`
- **Password**: `password123`
- **Prodi**: D4 Teknologi Rekayasa Komputer
- **Akses**: Review AMI prodi TRK

### Dosen 1 (TI)
- **Email**: `idhawati.hestiningsih@polines.ac.id`
- **Password**: `password123`
- **Nama**: IDHAWATI HESTININGSIH, S.KOM., M.KOM.
- **NIP**: 196910071995122001
- **Prodi**: D3 Teknik Informatika

### Dosen 2 (TI)
- **Email**: `muttabik.fathul@polines.ac.id`
- **Password**: `password123`
- **Nama**: MUTTABIK FATHUL LATHIEF, S.KOM., M.ENG.
- **NIP**: 199001012019031002
- **Prodi**: D3 Teknik Informatika

### Dosen 3 (TI)
- **Email**: `sukamto@polines.ac.id`
- **Password**: `password123`
- **Nama**: SUKAMTO, S.KOM., M.T.
- **NIP**: 197105052000031003
- **Prodi**: D3 Teknik Informatika

### Dosen 4 (TRK)
- **Email**: `wiktasari@polines.ac.id`
- **Password**: `password123`
- **Nama**: WIKTASARI, S.T., M.KOM.
- **NIP**: 197506012003122004
- **Prodi**: D4 Teknologi Rekayasa Komputer

## 🚀 Cara Menjalankan Seeder

### 1. Reset Database & Run Seeder
```bash
# Windows (CMD)
npx prisma migrate reset --force

# Atau manual:
npx prisma db push --force-reset
npx prisma db seed
```

### 2. Verify Data
```bash
# Check jumlah isian
npx prisma studio
# Buka table isian_ami, filter by status
```

### 3. Test di Browser
```bash
npm run dev
# Buka http://localhost:3000
# Login dengan salah satu akun di atas
```

## 📊 Expected Results per Role

### Login sebagai Admin
- Dashboard: Overview semua prodi
- Menu Management: Full access (User, Dosen, Prodi, Jurusan, Instrumen, Periode)

### Login sebagai Kaprodi
- Dashboard: Progress prodi sendiri
- Review AMI: List isian dengan status "Menunggu Review" dari prodi sendiri
- Bisa validasi atau revisi isian
- Tidak bisa edit isian (hanya review)

### Login sebagai Dosen
- Dashboard: Progress pengisian pribadi
- Isi AMI: Tree struktur instrumen dengan status indicator
  - Klik unsur valid → View-only component
  - Klik unsur non-valid → Form editable
- Riwayat Saya: Hanya isian pribadi (terpisah dari dosen lain)
- Tidak bisa review isian dosen lain

## 🐛 Troubleshooting

### Issue: Seeder gagal dengan error "Unique constraint failed"
**Cause**: Database belum direset dengan benar
**Solution**:
```bash
npx prisma migrate reset --force
```

### Issue: Data isian tidak muncul di UI
**Cause**: Filter API salah atau session dosen tidak terhubung ke prodi
**Solution**: 
1. Check `dosen.prodi_id` di database
2. Check API `/api/isians?pemeriksaan_unsur_id=X` return data
3. Clear browser cache dan reload

### Issue: Multiple isian untuk unsur sama di prodi sama
**Cause**: Constraint berubah dari `[unsur,periode,prodi]` ke `[unsur,periode,dosen]`
**Solution**: This is expected! Setiap dosen punya isian sendiri.

### Issue: ViewValidIsian tidak muncul untuk isian valid
**Cause**: Logic detection di `handleNodeClick` salah
**Solution**: 
1. Buka Console (F12)
2. Check log: `🔍 DEBUG: item.status = ...`
3. Verify `viewValidData` ter-set di React DevTools

## 📚 Related Docs

- `FIRST_VALID_WINS.md` - Explain first valid wins strategy
- `FLOW_REVISI_ISIAN.md` - Explain revision flow
- `PANDUAN_RIWAYAT_DOSEN.md` - Explain per-dosen history
- `VIEW_ONLY_VALID_ISIAN.md` - Explain view-only feature
- `TEST_GUIDE_VIEW_ONLY.md` - Testing guide

---

**Last Updated**: 2026-06-19  
**Seeder Version**: 2.0 (With per-dosen constraint)
