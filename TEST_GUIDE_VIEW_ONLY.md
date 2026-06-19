# Testing Guide: View-Only Isian Valid

## 🎯 Quick Start Testing

### Prerequisites
1. Server harus running: `npm run dev`
2. Database harus ada isian dengan status "valid"
3. Login sebagai dosen

---

## 📝 Test Scenario 1: View Valid Isian (Happy Path)

### Steps:
1. **Login** sebagai dosen di browser
   - URL: `http://localhost:3000` atau `http://[IP-LAN]:3000`
   - Username/password dosen yang punya isian valid

2. **Navigate** ke halaman Isi AMI
   - Klik menu "Isi AMI" di sidebar

3. **Identify** unsur yang sudah valid
   - Cari unsur dengan badge hijau "Valid"
   - Atau cari di status map yang menunjukkan ✓ dengan dot hijau

4. **Click** pada unsur valid tersebut
   - Klik baris unsur di tree

5. **Verify** tampilan view-only muncul:

#### ✅ Checklist Visual
```
□ Header gradient emerald/teal dengan icon shield muncul
□ Badge "TERVALIDASI" di header
□ Judul dokumen ditampilkan dengan besar
□ Subtitle "Isian ini telah divalidasi..." muncul

□ Info Grid (3 kolom):
   □ Kartu "Pengisi" (biru) - nama dosen + NIP
   □ Kartu "Tanggal Submit" (amber) - tanggal & waktu
   □ Kartu "Divalidasi" (emerald) - tanggal & waktu validasi

□ Box "Informasi Unsur AMI" (abu-abu gradient):
   □ Kode AMI
   □ Kriteria
   □ Deskripsi Area Audit
   □ Pemeriksaan Unsur

□ Main Content (2 kolom):
   Left Column:
   □ Detail Dokumen - ketersediaan standar & dokumen
   □ Tahun pelaksanaan (jika ada)
   □ Pencapaian Standar - checklist SPT PT & SN Dikti
   □ Daya Saing - badges lokal/nasional/internasional

   Right Column:
   □ Capaian (jika ada)
   □ Keterangan Tambahan (jika ada)
   □ Catatan Kaprodi (gradient emerald, jika ada)
   □ Tautan Bukti Eksternal (clickable card, jika ada)
   □ Dokumen Bukti - list files dengan download button

□ Footer Info Box emerald - notifikasi isian terproteksi
□ Tombol "Tutup" di bawah
□ Submit buttons ("Simpan Draft" & "Kirim untuk Review") TIDAK tampil
```

6. **Test Interactions**:
   - [ ] Klik link bukti eksternal → harus buka di tab baru
   - [ ] Klik download pada file → harus download file
   - [ ] Klik tombol "Tutup" → harus kembali ke tree

7. **Verify Back to Tree**:
   - [ ] Setelah klik "Tutup", UI kembali ke tree struktur instrumen
   - [ ] Tidak ada unsur yang terpilih

---

## 📝 Test Scenario 2: Edit Non-Valid Isian

### Steps:
1. Di halaman yang sama (Isi AMI)

2. **Click** unsur dengan status BUKAN "Valid":
   - Status "Menunggu Review" (amber/kuning)
   - Status "Perlu Revisi" (rose/merah)
   - Status "Belum Diisi" (abu-abu)

3. **Verify** form editable muncul:

#### ✅ Checklist Form Editable
```
□ Form header "Formulir Isian AMI" muncul
□ Badge status (bukan "Valid") ditampilkan
□ Catatan revisi kaprodi (jika status = revisi) ditampilkan

□ All input fields enabled dan editable:
   □ Judul Isian - text input
   □ Tahun Pelaksanaan - number input
   □ Ketersediaan Standar - dropdown
   □ Dokumen - dropdown
   □ Pencapaian Standar - checkboxes (clickable)
   □ Daya Saing - checkboxes (clickable)
   □ Link Bukti - URL input
   □ Upload Dokumen - file upload dengan metadata
   □ Capaian - textarea
   □ Keterangan - textarea

□ Submit buttons tampil di bawah:
   □ "Simpan Draft Semua" (slate)
   □ "Kirim untuk Review" (indigo)
```

4. **Test Editing**:
   - [ ] Ubah beberapa field
   - [ ] Check/uncheck beberapa checkbox
   - [ ] Klik "Simpan Draft" atau "Kirim untuk Review"
   - [ ] Verify berhasil disimpan (success message muncul)

---

## 📝 Test Scenario 3: Security - Prevent Edit Valid Isian

### Frontend Protection Test:

1. Login sebagai dosen

2. Klik unsur valid → ViewValidIsian muncul

3. **Verify** tidak ada cara untuk edit:
   - [ ] Tidak ada input field yang editable
   - [ ] Submit buttons tidak tampil
   - [ ] Semua display read-only

4. Klik "Tutup"

### Backend Protection Test:

1. Buka Developer Console (F12)

2. Copy ID isian valid dari response (bisa lihat di Network tab)

3. Try to send POST request manually (via console atau Postman):
   ```javascript
   fetch('/api/isians', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('ami_token'),
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       pemeriksaan_unsur_id: [ID_UNSUR_VALID],
       periode_id: [PERIODE_ID],
       is_draft: false,
       // ... other fields
     })
   })
   ```

4. **Expected Response**:
   ```json
   {
     "success": false,
     "message": "Dokumen isian ini sudah divalidasi dan tidak dapat diubah."
   }
   ```

---

## 📝 Test Scenario 4: Edge Cases

### A. Valid Isian Tanpa File Bukti
1. Klik unsur valid yang tidak punya file bukti
2. **Verify**: Section "Dokumen Bukti" tetap tampil dengan message kosong

### B. Valid Isian Tanpa Catatan Kaprodi
1. Klik unsur valid yang tidak punya catatan kaprodi
2. **Verify**: Section "Catatan Kaprodi" tidak tampil (conditional)

### C. Valid Isian Tanpa Link Bukti
1. Klik unsur valid yang tidak punya link eksternal
2. **Verify**: Section "Tautan Bukti Eksternal" tidak tampil (conditional)

### D. File Nama Sangat Panjang
1. Klik unsur valid dengan file nama panjang
2. **Verify**: Nama file di-truncate dengan ellipsis (...)
3. **Verify**: Masih bisa download

### E. Mobile/Responsive View
1. Resize browser ke ukuran mobile (atau buka di HP)
2. Klik unsur valid
3. **Verify**: Layout stack (bukan grid)
4. **Verify**: Semua content masih readable dan accessible

---

## 🐛 Common Issues & Solutions

### Issue 1: ViewValidIsian Tidak Muncul
**Symptom**: Klik unsur valid tapi yang muncul form editable

**Check**:
1. Apakah `viewValidData` state ter-set?
   - Buka React DevTools → Components → IsiAmiPage → hooks
   - Cek state `viewValidData`
2. Apakah status di database benar-benar "valid"?
   - Query: `SELECT status FROM isian_ami WHERE id = [ID];`
3. Apakah conditional rendering benar?
   - Cek line ~945 di `page.tsx`

**Solution**: 
- Ensure `item.status === 'valid'` di API response
- Clear browser cache dan reload

### Issue 2: Submit Buttons Masih Tampil
**Symptom**: Submit buttons tampil saat viewing valid isian

**Check**:
1. Conditional di line ~1310: `{!viewValidData && isianForm && ( ... )}`

**Solution**: 
- Verify conditional logic
- Restart dev server

### Issue 3: Error "Cannot read property 'unsurInfo'"
**Symptom**: Crash saat render ViewValidIsian

**Check**:
1. Apakah `viewValidData.unsurInfo` ter-populate di `handleNodeClick`?

**Solution**:
- Verify API response contains `pemeriksaan_unsur` nested data
- Check line ~395 di `handleNodeClick` where `unsurInfo` is populated

### Issue 4: Download File Tidak Berfungsi
**Symptom**: Klik download button tapi file tidak download

**Check**:
1. Apakah `file.file_path` benar?
2. Apakah file exist di `public/uploads/bukti/`?

**Solution**:
- Verify file path di database
- Check file permissions
- Try access URL directly: `http://localhost:3000/uploads/bukti/[filename]`

---

## 📊 Testing Data Setup

### Create Test Data: Valid Isian

Jika belum ada isian valid, create via:

1. **As Dosen**: Create isian baru dan submit
   ```
   1. Login dosen
   2. Isi AMI → klik unsur kosong
   3. Fill form
   4. Klik "Kirim untuk Review"
   ```

2. **As Kaprodi**: Validasi isian tersebut
   ```
   1. Logout dosen, login kaprodi
   2. Review AMI → klik isian "Menunggu Review"
   3. Klik "Validasi"
   4. Isian status jadi "valid"
   ```

3. **Back as Dosen**: View valid isian
   ```
   1. Logout kaprodi, login dosen
   2. Isi AMI → klik unsur yang tadi divalidasi
   3. Should see ViewValidIsian component
   ```

---

## ✅ Final Checklist

### Before Testing
- [ ] Dev server running
- [ ] Database has valid isian data
- [ ] Logged in as dosen

### During Testing
- [ ] Test Scenario 1: View Valid Isian ✓
- [ ] Test Scenario 2: Edit Non-Valid Isian ✓
- [ ] Test Scenario 3: Security Test ✓
- [ ] Test Scenario 4: Edge Cases ✓

### After Testing
- [ ] All features working as expected
- [ ] No console errors
- [ ] UI responsive on mobile
- [ ] Performance good (no lag)

---

## 📸 Expected Screenshots

### Before (Old Behavior)
```
Dosen klik unsur valid → Form editable muncul → Bisa edit (WRONG!)
```

### After (New Behavior)
```
Dosen klik unsur valid → ViewValidIsian muncul → Read-only, professional display ✓
Dosen klik unsur non-valid → Form editable muncul → Bisa edit ✓
```

---

**Happy Testing! 🎉**

If you find any bugs, please document:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Console errors (if any)
5. Screenshots
