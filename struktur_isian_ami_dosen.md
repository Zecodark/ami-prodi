# Dokumentasi Struktur dan Cara Kerja "Isi AMI" (Dosen)

Dokumen ini menjelaskan bagaimana halaman **Isi AMI** untuk peran Dosen beroperasi, mulai dari struktur pohon (tree) instrumen, agregasi status kolektif, hingga alur kerja pengisian formulir.

---

## 1. Konsep Kolektif per Prodi

Pengisian AMI bersifat **kolektif per program studi (Prodi)**.
Artinya, setiap *Pemeriksaan Unsur* dalam suatu instrumen tidak berdiri sendiri untuk masing-masing dosen, melainkan dibagikan untuk semua dosen dalam satu prodi.

- **Dosen saling melengkapi:** Jika Dosen A sudah mengisi Unsur X dan menyimpannya sebagai *Draft* atau mengirimkannya untuk direview, Dosen B dari prodi yang sama dapat melihat status bahwa unsur tersebut sedang diisi/diproses.
- Jika sebuah isian divalidasi oleh Kaprodi, isian tersebut akan terkunci untuk seluruh dosen di prodi tersebut dan beralih ke mode *read-only*.

## 2. Struktur Pohon Instrumen (Tree Structure)

Halaman "Isi AMI" membangun antarmuka hierarkis (pohon) berdasarkan data instrumen. Terdapat empat level utama:

1. **Kriteria** (Contoh: `[K1] CRITERIA 1: Visi, Misi...`)
2. **Kode AMI** (Contoh: `1.1 - AMI 1.1`)
3. **Deskripsi Area Audit** (Contoh: `Kesesuaian Visi, Misi...`)
4. **Unsur Pemeriksaan** (Titik akhir/leaf node tempat dosen mengisi data).

> [!NOTE]
> Interaksi formulir pengisian data HANYA terjadi di level ke-4 (Unsur). Level 1 hingga 3 murni bertindak sebagai pengelompok (parent) dan hanya memberikan agregasi status dari unsur-unsur di bawahnya.

## 3. Sistem Status Unsur (Unsur Status)

Setiap *Unsur* (node terendah) dievaluasi statusnya dengan mencocokkan isian dari _database_ untuk prodi saat ini. Sistem memiliki 4 status utama:

- 🟢 **Valid:** Dokumen sudah divalidasi oleh Kaprodi. Tidak bisa diubah (dikunci).
- 🟡 **Menunggu Review (Proses):** Isian sudah dikirimkan oleh dosen dan menunggu persetujuan Kaprodi.
- 🔴 **Perlu Revisi:** Kaprodi menolak/memberi catatan revisi pada isian tersebut.
- ⚪ **Belum Diisi (Kosong):** Belum ada isian apa pun dari prodi untuk unsur tersebut.

### Agregasi Status pada Parent (Level 1-3)
Agar dosen mengetahui *overall progress* tanpa harus membuka seluruh pohon, setiap *parent node* mengakumulasikan status dari *child node*-nya:
1. Jika ada unsur di bawahnya yang statusnya **Perlu Revisi**, maka parent akan berstatus **Perlu Revisi** (skala prioritas tertinggi).
2. Jika tidak ada revisi, namun ada **Menunggu Review**, parent berstatus **Menunggu Review**.
3. Jika tidak ada revisi maupun proses, namun ada **Belum Diisi**, parent berstatus **Belum Diisi**.
4. Jika semua unsur di bawahnya **Valid**, barulah parent ikut berstatus **Valid**.

Di sebelah setiap *parent node*, terdapat **Stat Chips** yang merangkum perhitungan (misal: 10 unsur, 7 valid, 3 kosong).

## 4. Alur Kerja (Workflow) Form Pengisian

Ketika Dosen mengklik sebuah baris **Unsur**, sistem menjalankan beberapa logika pemeriksaan:

1. **Pengecekan Status saat ini (`isUnsurValid`)**
   Sistem mengecek apakah unsur ini sudah Valid.
2. **Pengambilan Data (Data Fetching)**
   - Jika **Valid**: API dipanggil dengan query parameter `status=valid`. Formulir akan dimuat dengan seluruh data valid, dirender sebagai elemen *disabled* (abu-abu, tanpa garis tepi), serta memunculkan daftar file yang pernah diunggah untuk dilihat (*read-only*).
   - Jika **Belum Valid**: API dipanggil dengan query parameter `status=draft`. Apabila Dosen bersangkutan sudah punya *draft* yang tertunda, form akan otomatis terisi dengan data *draft* tersebut agar bisa dilanjutkan.
3. **Aksi Formulir (Buttons)**
   - **Simpan Draft:** Menyimpan data secara parsial (status di database menjadi `draft`).
   - **Kirim untuk Review:** Menyelesaikan pengisian dan merubah status di database menjadi `proses`. Dosen lain tidak disarankan menimpa data ini, dan Kaprodi sekarang dapat melihat isian ini.

> [!IMPORTANT]
> Saat unsur sudah Valid, tombol "Simpan Draft", "Kirim untuk Review", dan kotak drag-and-drop "Upload File Bukti" disembunyikan seluruhnya untuk menjamin integritas data instrumen prodi.

## 5. Ringkasan Keseluruhan (Overall Stats)

Di bagian atas halaman, terdapat *progress bar* yang menghitung persentase dari total seluruh unsur instrumen. 
Perhitungan ini: `(Total Unsur Valid / Total Seluruh Unsur) * 100%`.
Selain itu, ditampilkan juga matriks indikator (Valid, Menunggu Review, Perlu Revisi, Belum Diisi) yang menggambarkan kondisi kesehatan seluruh pengisian AMI prodi tersebut.
