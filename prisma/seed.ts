import { prisma } from '../app/lib/prisma';
import bcrypt from 'bcryptjs';

type InstrumenSeedItem = {
  no: number;
  excelRow: number;
  excelNo: string | null;
  criterionNo: string;
  s2: string | null;
  str: string | null;
  d3: string | null;
  criterionName: string | null;
  kodeAmiLabel: string;
  area: string;
  unsurList: string[];
};

// Catatan penting:
// - Kolom "Pemeriksaan Pada Unsur" pada Excel TIDAK disimpan sebagai satu teks panjang.
// - Setiap nomor pada kolom tersebut disimpan menjadi 1 row sendiri di tabel pemeriksaan_unsurs.
// - Jadi 1 deskripsi area audit bisa punya banyak pemeriksaan_unsurs.
const instrumenItems: InstrumenSeedItem[] = [
  {
    "no": 1,
    "excelRow": 6,
    "excelNo": "1",
    "criterionNo": "1",
    "s2": "1.1",
    "str": "1.1",
    "d3": "1.1",
    "criterionName": "CRITERIA 1: Visi, Misi, Tujuan dan Strategi",
    "kodeAmiLabel": "AMI 1.1",
    "area": "Kesesuaian Visi, Misi, Tujuan dan Strategi (VMTS) Unit Pengelola Program Studi (UPPS) terhadap VMTS Perguruan tinggi (PT) dan Visi keilmuan Program Studi (PS) yang dikelolanya.",
    "unsurList": [
      "Renstra Polines",
      "Renstra Jurusan/Prodi",
      "Renop Jurusan /prodi",
      "Dokumen Visi Keilmuan (Keunikan Prodi)",
      "Dokumen Implemenntasi"
    ]
  },
  {
    "no": 2,
    "excelRow": 7,
    "excelNo": "2",
    "criterionNo": "1",
    "s2": "1.2",
    "str": "1.2.",
    "d3": "1.2",
    "criterionName": "CRITERIA 1: Visi, Misi, Tujuan dan Strategi",
    "kodeAmiLabel": "AMI 1.2",
    "area": "Mekanisme dan keterlibatan pemangku kepentingan dalam penyusunan VMTS UPPS",
    "unsurList": [
      "Dokumen Mekanisme VTMS",
      "Dokumen DukunganVTMS dari Pihak Pemangku Kepentingan"
    ]
  },
  {
    "no": 3,
    "excelRow": 8,
    "excelNo": "3",
    "criterionNo": "1",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "CRITERIA 1: Visi, Misi, Tujuan dan Strategi",
    "kodeAmiLabel": "AMI 1.3",
    "area": "Strategi pencapaian tujuan disusun berdasarkan analisis yang sistematis, serta pada pelaksanaannya dilakukan pemantauan dan evaluasi yang ditindaklanjuti",
    "unsurList": [
      "Dokumen Strategi",
      "Dokumen DukunganVTMS dari Pihak Pemangku Kepentingan",
      "Dokumentasi Implementasi Strategi"
    ]
  },
  {
    "no": 4,
    "excelRow": 9,
    "excelNo": "4",
    "criterionNo": "2",
    "s2": "2.1",
    "str": null,
    "d3": null,
    "criterionName": "Criteria 2: Tata Pamong, Tata Kelola dan Kerjasama",
    "kodeAmiLabel": "Tata Pamong",
    "area": "Unit Pengelola Program Studi mendeskripsikan proses, struktur dan tradisi dalam menjalankan tugas dan menggunakan wewenangnya untuk mengemban misi,mewujudkan visi, dan mencapai tujuan, serta sasaran strategisnya yang didukung perilaku etis dan berintegritas para pengelola, tenaga kependidikan, mahasiswa, dan mitra Unit Pengelola Program Studi.",
    "unsurList": [
      "Keberadaan Statuta Polines dan dokumennya",
      "Dokumen Susunan Organisasi dan Tata Kerja (SOTK)",
      "Adanya dokumen Tupoksi untuk setiap jabatan di semua unit di Polines",
      "Adanya pedoman ataupun kode etik karyawan ( dosen, tendik, administrasi, mahasiswa )"
    ]
  },
  {
    "no": 5,
    "excelRow": 10,
    "excelNo": "5",
    "criterionNo": "2",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "Criteria 2: Tata Pamong, Tata Kelola dan Kerjasama",
    "kodeAmiLabel": "Tata Pamong",
    "area": "Unit Pengelola Program Studi mendeskripsikan peran, tanggung jawab, wewenang dan proses pengambilan keputusan untuk pencapaian efektivitas organisasi berdasarkan visi, misi, tujuan, dan strategi serta menggunakan lima pilar sistem tata pamong, yangmencakup: kredibel, transparan, akuntabel, bertanggung jawab, dan adil.",
    "unsurList": [
      "Dokumen SK pengangkatan pimpinan jurusan/prodi",
      "Adanya dokumen Tupoksi untuk setiap jabatan di semua unit di Polines",
      "Adanya pedoman ataupun kode etik karyawan ( dosen, tendik, administrasi, mahasiswa )"
    ]
  },
  {
    "no": 6,
    "excelRow": 11,
    "excelNo": "6",
    "criterionNo": "2",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "Criteria 2: Tata Pamong, Tata Kelola dan Kerjasama",
    "kodeAmiLabel": "Tata Kelola dan Sistem Penjaminan Mutu",
    "area": "Unit Pengelola Program Studi mendeskripsikan perencanaan, pengorganisasian, pengarahan, dan pengendalian sumber daya agar program studi dapat menjalankan tugas dan kewajibannya secara efektif dan efisien serta akuntabel, bertanggung jawab, transparan, adil, dan terhindar dari konflik kepentingan yang ditunjukkan dengan hasil, evaluasi kepuasan para pemangku kepentingan terhadap keterlaksanaan dan efektivitas tata kelola.",
    "unsurList": [
      "Dokumen SOP Pelaksanaan Kegiatan",
      "SOP Kegiatan",
      "Dok. Laporan Kegiatan",
      "Adanya Dokumen",
      "Adanya pedoman proposal dan pelaporan kegiatan"
    ]
  },
  {
    "no": 7,
    "excelRow": 12,
    "excelNo": "7",
    "criterionNo": "2",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "Criteria 2: Tata Pamong, Tata Kelola dan Kerjasama",
    "kodeAmiLabel": "Tata Kelola dan Sistem Penjaminan Mutu",
    "area": "Unit Pengelola Program Studi mendeskripsikan sistem manajemen mutu internal yang diimplementasikan secara konsisten, efektif, dan efisien serta dilaporkan secara berkala untuk tindak lanjut peningkatan mutu pendidikan tinggi.",
    "unsurList": [
      "Adanya Dokumen Penjaminan Mutu Pendidikan",
      "Dokumen Sistem Penjamin Mutu Internal",
      "Dokunen Hasil Audit Mutu Internal",
      "DokumenTindak lanjut perbaikan mutu"
    ]
  },
  {
    "no": 8,
    "excelRow": 13,
    "excelNo": "8",
    "criterionNo": "2",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "Criteria 2: Tata Pamong, Tata Kelola dan Kerjasama",
    "kodeAmiLabel": "Kerjasama",
    "area": "Unit Pengelola Program Studi menjelaskan kegiatan dengan para mitranya dan hasil dari kegiatan tersebut. 2) Unit Pengelola Program Studi menjelaskan keselarasan dan konsistensi antara kerja sama, visi, misi, tujuan, dan aspirasi para pemangku kepentingan dengan memperhatikan isu ekonomi dan bisnis yang berkembang untuk memberi dampak positif kepada para pemangku kepentingan dan masyarakat luas.",
    "unsurList": [
      "Adanya dokumen kerjasama Polines dengan pihak eksternal",
      "Dokumen Jumlah Kerjasama Internasional",
      "Dokumen pelaksanaan kerjasama MOA",
      "Bukti kerjasam bidang pendidikan, Penelitian dan PKM"
    ]
  },
  {
    "no": 9,
    "excelRow": 14,
    "excelNo": null,
    "criterionNo": "2",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "Criteria 2: Tata Pamong, Tata Kelola dan Kerjasama",
    "kodeAmiLabel": "Kerjasama",
    "area": "3) Unit Pengelola Program Studi menjelaskan cakupan kerja sama bidang Ilmu EMBA dan dampaknya. Kegiatan kerja sama program studi dapat mencakup bidang pendidikan, Kriteria dan Prosedur – Instrumen Akreditasi Program Studi (LAMEMBA) penelitian, dan/atau pengabdian kepada masyarakat dengan memperhatikan isu ekonomi dan bisnis yang berkembang di tingkat lokal, nasional, dan/atau internasional. 4) Unit Pengelola Program Studi melakukan evaluasi kerjasama secara berkala dan tindak lanjut dengan mempertimbangkan dampak internal dan eksternal kerjasam",
    "unsurList": [
      "Data Hasil Kersama dan tindak lanjutnya",
      "Dokumen kerjasama berkelanjutan yang telah dilaksanakan serta hasil evaluasi dan manfaatnya."
    ]
  },
  {
    "no": 10,
    "excelRow": 15,
    "excelNo": "9",
    "criterionNo": "3",
    "s2": "3.1",
    "str": "3.1",
    "d3": "3.1",
    "criterionName": "CRITERIA 3- MAHASISWA",
    "kodeAmiLabel": "Mahasiswa",
    "area": "Penilaian kriteria ini difokuskan pada: 1) Konsistensi pelaksanaan dan keefektifan sistem penerimaan mahasiswa baru yang adil dan objektif. 2) Keseimbangan rasio mahasiswa dengan dosen dan tenaga kependidikan yang menunjang pelaksanaan pembelajaran yang efektif dan efisien. 3) Program, keterlibatan dan prestasi mahasiswa dalam pembinaan minat, bakat, dan keprofesian. 4) Efektifitas sistem layanan bagi mahasiswa dalam menunjang proses pembelajaran yang efektif dan efisien.",
    "unsurList": [
      "Sistem Penerimaan\na.Sistem Rekruitmen\nb. Mutu, Alses kecukupan layanan mahasiswa\nc. Upaya Peningkatan animo calon mahasiswa di level lokal, Nasional, Internasional",
      "Dokumen profil mahasiswa.",
      "Dokumen SOP pengajuan beasiswa dan magang.",
      "Dokumen terkait layanan dan fasilitas kemahasiswaan.",
      "Dokumen konsultasi bimbingan akademik dan tugas akhir.",
      "Dokumen kebijakan dan prosedur penerimaan mahasiswa.",
      "Dokumen pengembangan kompetensi mahasiswa.",
      "Dokumen pedoman non-akademik mahasiswa.",
      "Dokumen Evaluasi Mahasiswa dan kepuasan mahasiswa terhadp layanan akademik",
      "Dokumen Tindak lanjut dan implementasi hasil evaluasi ketercapaian standar."
    ]
  },
  {
    "no": 11,
    "excelRow": 26,
    "excelNo": "10",
    "criterionNo": "4",
    "s2": "4.1",
    "str": "4.1",
    "d3": "4.1",
    "criterionName": "CRITERIA 4 - Sumber Daya Manusia",
    "kodeAmiLabel": "Dose dan Tenaga Kepndidikan",
    "area": "Ketersediaan Profil Dosen Tetap pragram Studi (kecukupan jumlah, jabfung, kualifikasi, keahlian, beban kerja EWMP, keanggotaan dalam organisasi, sertifikasi profesi, dan sertifikat\nkompetensi).",
    "unsurList": [
      "Data profil dosen tetap dan tenaga kependidikan.",
      "Data profil dosen tidak tetap",
      ") Kebijakan Pengembangan Dosen Tetap dan tenaga Kependidiknan",
      "Kebijakan doen industri\nKebijakan pengakukan/rekognisi/ prestasi/kenerja di level Nasional/Internasional"
    ]
  },
  {
    "no": 12,
    "excelRow": 27,
    "excelNo": "11",
    "criterionNo": "4",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "CRITERIA 4 - Sumber Daya Manusia",
    "kodeAmiLabel": "Pelaksanaan",
    "area": "Keterlaksanaan atas Kebijakan, standar SNDikti dan SPT PT berkaitan dengan Sumber daya Manusia",
    "unsurList": [
      "Dokumen EWMP",
      "Bukti kegiatan dosen insdustri",
      "Bukti Pengakuan/rekoqnisi/kepakaran/ prestasi/ienerja dosen"
    ]
  },
  {
    "no": 13,
    "excelRow": 30,
    "excelNo": "12",
    "criterionNo": "4",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "CRITERIA 4 - Sumber Daya Manusia",
    "kodeAmiLabel": "Pengembangan",
    "area": "Pengembangan Dosen dan tenaga kependidikan dengan efektif",
    "unsurList": [
      "Dokumen people planning and development dosen dan tenaga kependidikan",
      "Bukti sahih pengembangan dosen dan tenaga kependidkan"
    ]
  },
  {
    "no": 14,
    "excelRow": 31,
    "excelNo": "13",
    "criterionNo": "4",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "CRITERIA 4 - Sumber Daya Manusia",
    "kodeAmiLabel": "Monitoring, Evaluasi dan Tindak Lanjut",
    "area": "Keterlaksanaan evaluasi secara berkala mengenai kebijakan dan\nketercapaian standar (IKU dan IKT) sehingga menemu-kenali praktik baik, praktik buruk\ndan praktik yang baru yang berkaitan dengan sumber daya manusia,",
    "unsurList": [
      "Bukti Evaluasi Tingkat Kepuasan dosen oleh mahasiswa/pengguna",
      "Bukti Evaluasi Tingkat Kepuasan Tenaga Kependidikan oleh mahasiswa/pengguna",
      "Dokumen Tindak Lanjut dan Implementasi terhadap hasil evaluasi ketercapaian standar SDM"
    ]
  },
  {
    "no": 15,
    "excelRow": 34,
    "excelNo": "14",
    "criterionNo": "5",
    "s2": "5.1.",
    "str": "5.1.",
    "d3": "5.1.",
    "criterionName": "CRITERIA 5 Keuangan, Sarana, dan Prasarana",
    "kodeAmiLabel": "Standar Pembiayaan",
    "area": "Standar pembiayaan difokuskan pada kecukupan, keefektifan, efisiensi, dan akuntabilitas, serta keberlanjutan pembiayaan untuk menunjang penyelenggaraan pendidikan, penelitian, dan pengabdian kepada masyarakat.",
    "unsurList": [
      "Dokumen Rencana kerja dan anggaran tahunan.",
      "Dokumen Laporan realisasi keuangan tahunan.",
      "Ketersediaan Pembiayaan Pembelajaran sesuai SN-Dikti",
      "Ketersediaan Pendanaan dan Pembiayaan Penelitian, sesuai SN-Dikti",
      "Ketersediaan Standar Pendanaan dan Pembiayaan PkM, sesuai SN-Dikti"
    ]
  },
  {
    "no": 16,
    "excelRow": 35,
    "excelNo": "15",
    "criterionNo": "5",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "CRITERIA 5 Keuangan, Sarana, dan Prasarana",
    "kodeAmiLabel": "Standar Pembiayaan",
    "area": "Penilaian sarana dan prasarana difokuskan pada pemenuhan ketersediaan (availability) sarana prasarana, akses civitasakademika terhadap sarana prasarana (accessibility), kegunaan atau pemanfaatan (utility) sarana prasarana oleh sivitas akademika, serta keamanan, keselamatan, kesehatan dan lingkungan dalam menunjang pelaksanaan tridarma perguruan tinggi.",
    "unsurList": [
      "Dokumentasi jumlah dan kondisi sarana dan prasarana baik fisik maupun virtual .",
      "Ketersediaan Sarpras untuk Pembelajaran, sesuai SN-Dikti",
      "Ketersediaan Sarpras untuk Penelitian, sesuai SN-Dikti",
      "Ketersediaan Sarpras untuk PkM. sesuai, SN-Dikti",
      "Ketersedian Sistem Informasi dan Komunikasi dan Aplikasi pembelajaran",
      "Ketersediaan sarana/prasarana ibadah, olahraga, balai pengobatan",
      "Ketersediaan sarana/prasarana bagi penyandang disabilitas"
    ]
  },
  {
    "no": 17,
    "excelRow": 36,
    "excelNo": "16",
    "criterionNo": "5",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "CRITERIA 5 Keuangan, Sarana, dan Prasarana",
    "kodeAmiLabel": "Standar Pembiayaan",
    "area": "Keterlaksanaan evaluasi mengenai kebijakan dan ketercapaian standar (IKU dan IKT) sehingga menemu-kenali praktik baik, praktik buruk dan praktik yang baru yang berkaitan dengan keuangan, sarana, dan prasarana, termasuk evaluasi kepuasan dosen, tenaga kependidikan dan mahasiswa terhadap ketersediaan dan keteraksesan sarana prasarana",
    "unsurList": [
      "Dokumen evaluasi kepuasan dosen, tenaga kependidikan dan mahasiswa terhadap ketersediaan dan keteraksesan sarana prasarana",
      "dokumen tindak lanjut dan implementasi terhadap hasil evaluasi ketercapaian standar (IKU dan IKT) yang berkaitan dengan keuangan, sarana, dan prasarana."
    ]
  },
  {
    "no": 18,
    "excelRow": 37,
    "excelNo": "17",
    "criterionNo": "6",
    "s2": "6.1",
    "str": "6.1",
    "d3": "6.1",
    "criterionName": "CRITERIA 6 Pendidikan",
    "kodeAmiLabel": "Pendidikan -\nKurikulum\nAM",
    "area": "A. Ketersediaan kebijakan, standar, IKU, dan IKT yang berkaitan dengan pendidikan/pembelajaran yang mencakup: A. Profil Lulusan, Capaian Pembelajaran Lulusan (CPL) sesauai dengan Profil Lulusan dan jenjang KKNI/SKKNI.",
    "unsurList": [
      "a). Profil lulusan, capaian pembelajaran lulusan (CPL) sesuai dengan profil Lulusan dan\njenjang KKNI/SKKNI.\nb). Ketersediaan Struktur Kurikulum berbasis KKNI/OBE/SKKNI sesuai dengan Profil Lulusan,\nc) RPS, Struktur Mata Kuliah dan Asesmen Pembelajaran.\nd). Ketersediaan Kebijakan terkait penciptaan suasana akademik"
    ]
  },
  {
    "no": 19,
    "excelRow": 38,
    "excelNo": "18",
    "criterionNo": "6",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "CRITERIA 6 Pendidikan",
    "kodeAmiLabel": "Pendidikan -\nKurikulum\nAM",
    "area": "Kurikulum Program studi yang mutakhir dan relevan dengan kebutuhan keimuan Teknokmemilii perpektif global, sesuai dengan VMTS dan Capaian pembelajaran",
    "unsurList": [
      "Dokumen terkait capaian pembelajaran."
    ]
  },
  {
    "no": 20,
    "excelRow": 39,
    "excelNo": "19",
    "criterionNo": "6",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "CRITERIA 6 Pendidikan",
    "kodeAmiLabel": "Pendidikan -\nKurikulum\nAM",
    "area": "C. Ketepatan struktur kurikulum\ndalam pembentukan capaian\npembelajaran, digambarkan dalam\npeta kompetensi / Peta jalan CPL.",
    "unsurList": [
      "Dokumen kurikulum."
    ]
  },
  {
    "no": 21,
    "excelRow": 40,
    "excelNo": "20",
    "criterionNo": "6",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "CRITERIA 6 Pendidikan",
    "kodeAmiLabel": "Pendidikan -\nKurikulum\nAM",
    "area": "Struktur Kurikulum berbasis KKNI/OBE/SKKNI sesuai dengan Profil Lulusan, Capaian Pembelajaran Lulusan (CPL), Capaian Pembelajaran Mata Kuliah (CPMK), RPS, Struktur Mata Kuliah dan Asesmen Penilaian yang sangat lengkap",
    "unsurList": [
      "Dokumen pedoman akademik mahasiswa."
    ]
  },
  {
    "no": 22,
    "excelRow": 41,
    "excelNo": "21",
    "criterionNo": "6",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "CRITERIA 6 Pendidikan",
    "kodeAmiLabel": "Pendidikan -\nKurikulum\nAM",
    "area": "kebijakan terkait penciptaan suasana akademik, melalui kegiatan ilmiah yang terjadwal, disertai bukti yang sahih dan sangat lengkap",
    "unsurList": [
      "Dokumen hasil pembahasan kurikulum dengan semua pemangku kepentingan (pimpinan UPPS, dosen PS, mahasiswa, alumni, industri)."
    ]
  },
  {
    "no": 23,
    "excelRow": 42,
    "excelNo": "22",
    "criterionNo": "6",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "CRITERIA 6 Pendidikan",
    "kodeAmiLabel": "Pendidikan -\nKurikulum\nAM",
    "area": "Mekanisme integrasi topik penelitian dan kegiatan PkM ke dalam proses pembelajaran.",
    "unsurList": [
      "Dokumen hasil pengembangan, implementasi, dan evaluasi kurikulum.",
      "Dokumen jaminan pembelajaran.",
      "Dokumen hasil pengukuran capaian pembelajaran.",
      "Dokumen tracer study dan survei pemangku kepentingan."
    ]
  },
  {
    "no": 24,
    "excelRow": 46,
    "excelNo": "23",
    "criterionNo": "7",
    "s2": "7.1",
    "str": "7.1",
    "d3": "7.1",
    "criterionName": "KRITERIA 7 PENELITIAN",
    "kodeAmiLabel": "AMI 7.24",
    "area": "Unit Pengelola Program Studi mendeskripsikan pedoman pelaksanaan dan roadmap penelitian yang sesuai dengan visi dan misi serta isu-isu yang berkembang baik di tingkat lokal, nasional, maupun internasional. (Sesuai bidangkeilmuan program studi yang diakreditasi.)",
    "unsurList": [
      "Dokumen Pengelolaan Penelitian yang lengkap (Roadmap, Renstra Penelitian, RIP Penelitian)",
      "Dokumen Pedoman/Panduan Penelitian"
    ]
  },
  {
    "no": 25,
    "excelRow": 50,
    "excelNo": "24",
    "criterionNo": "7",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "KRITERIA 7 PENELITIAN",
    "kodeAmiLabel": "AMI 7.25",
    "area": "Unit Pengelola Program Studi dan program studi mendeskripsikan sumber pendanaan yang bersal dariinternal, pemerintah, industri atau Lembaga Lain dengan daya saing nasional/Internasional",
    "unsurList": [
      "Dokumen sumber pendanaan Penelitian",
      "Sumber Pendanaan Nasional",
      "Sumber Pendanaan Internasional"
    ]
  },
  {
    "no": 26,
    "excelRow": 51,
    "excelNo": "25",
    "criterionNo": "7",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "KRITERIA 7 PENELITIAN",
    "kodeAmiLabel": "AMI 7.26",
    "area": "Unit Pengelola Program Studi mendeskripsikan penelitian dosen dan/atau dosen dengan mahasiswa yang sesuai dengan roadmap penelitian dan/atau bermitra dengan pihak eksternal pada tahun berjalan serta didesiminasikan dalam publikasi dan/atau pertemuan ilmiah tingkat lokal, nasional, atau internasional dan mendukung VTMS",
    "unsurList": [
      "Dokumen keterlibatan dosen pada penelitian sesuai bidang ilmu.",
      "Dokumen keterlibatan dosen pada penelitian dengan industri.",
      "SK keterlibatan mahasiswa dalam penelitian.",
      "Bukti hasil penelitian digunakan untuk mendukung proses belajar mengajar."
    ]
  },
  {
    "no": 27,
    "excelRow": 52,
    "excelNo": "26",
    "criterionNo": "7",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "KRITERIA 7 PENELITIAN",
    "kodeAmiLabel": "AMI 7.27",
    "area": "Pelaksanaan monitoring kesesuaian penelitian DTPR dengan Rencana Induk Penelitian, dan penggunaan hasil evaluasi untuk perbaikan relevansi penelitian dan pengembangan keilmuan program studi.",
    "unsurList": [
      "Dokumen lengkap mulai dari call for\nproposal hingga laporan akhir.",
      "Monitoring dan Evaluasi kesesuaian penelitian dengan kebijakan dan standar yang ditetapkan",
      "Jumlah Sitasi Per dosen pertahun pada Jurnal Nasional terindeks Sinta 1 dan Sinta 2 serta Jurnal Intenasional bereputas atu terindeks scopus"
    ]
  },
  {
    "no": 28,
    "excelRow": 53,
    "excelNo": "27",
    "criterionNo": "8",
    "s2": "8.1",
    "str": "8.1",
    "d3": "8.1",
    "criterionName": "Kriteria 8. Pengabdian Kepada Masyarakat",
    "kodeAmiLabel": "AMI 8.28",
    "area": "Unit Pengelola Program Studi memberikan arah pengembangan pengabdian kepada\nmasyarakat, komitmen untuk mengembangkan pengabdian kepada masyarakat yang\nbermutu dan unggul, memiliki dampak terhadap pengembangan ekonomi lokal, nasional,\ndan global, sesuai dengan visi, misi, dan roadmap pengabdian kepada masyarakat",
    "unsurList": [
      "Dokumen Pengelolaan Pengabdian Kepada Masyarakat yang lengkap (Roadmap, Renstra PKM, RIP PKM)",
      "Dokumen Pedoman/Panduan Penelitian"
    ]
  },
  {
    "no": 29,
    "excelRow": 54,
    "excelNo": "28",
    "criterionNo": "8",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "Kriteria 8. Pengabdian Kepada Masyarakat",
    "kodeAmiLabel": "AMI 8.29",
    "area": "Unit Pengelola Program Studi dan program studi mendeskripsikan sumber pendanaan pengabdian kepada masyarakat sesuai dengan visi dan misi serta isu-isu ekonomi dan bisnis yang berkembang baik di tingkat lokal, nasional, maupun internasional.",
    "unsurList": [
      "Dokumen sumber pendanaan Pengabdian Kepada Masyarakat",
      "Sumber Pendanaan Nasional",
      "Sumber Pendanaan Internasional"
    ]
  },
  {
    "no": 30,
    "excelRow": 55,
    "excelNo": "29",
    "criterionNo": "8",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "Kriteria 8. Pengabdian Kepada Masyarakat",
    "kodeAmiLabel": "AMI 8.30",
    "area": "Pengabdian kepada masyarakat dosen dan/atau dosen dengan mahasiswa yang sesuai dengan roadmap PKM dan/atau bermitra dengan pihak eksternal pada tahun berjalan didesiminasikan dalam publikasi dan/atau pertemuan ilmiah tingkat lokal, nasional, ainternasional dan mendukung visi, misi, tujuan, dan strategi.",
    "unsurList": [
      "Dokumen keterlibatan dosen pada PKM sesuai bidang ilmu.",
      "Dokumen keterlibatan dosen pada PKM dengan industri.",
      "SK keterlibatan mahasiswa dalam PKM .",
      "Bukti hasil penelitian digunakan untuk mendukung proses belajar mengajar."
    ]
  },
  {
    "no": 31,
    "excelRow": 56,
    "excelNo": "30",
    "criterionNo": "8",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "Kriteria 8. Pengabdian Kepada Masyarakat",
    "kodeAmiLabel": "AMI 8.31",
    "area": "Unit Pengelola Program Studi dan program studi mendeskripsikan kontribusi hasil pengabdian kepada masyarakat pada pengembangan pengajaran, ilmu pengetahuan, dan praktik di bidang sesuai dengan keilmuan.",
    "unsurList": [
      "Dokumen lengkap mulai dari call for\nproposal hingga laporan akhir.",
      "Monitoring dan Evaluasi kesesuaian PKM dengan kebijakan dan standar yang ditetapkan"
    ]
  },
  {
    "no": 32,
    "excelRow": 58,
    "excelNo": "31",
    "criterionNo": "9",
    "s2": "9.1",
    "str": "9.1",
    "d3": "9.1",
    "criterionName": "Kriteria 9. Luaran dan Capaian Tridarma",
    "kodeAmiLabel": "Pendidikan dan Pengajaran",
    "area": "Penilaian difokuskan pada pencapaian kualifikasi dan kompetensi lulusan berupa gambaran\nyang jelas tentang profil dan capaian pembelajaran lulusan dari program studi, penelusuran\nlulusan, umpan balik dari pengguna lulusan, dan persepsi publik terhadap lulusan sesuai\ndengan capaian pembelajaran lulusan/kompetensi yang ditetapkan oleh program studi dan\nperguruan tinggi dengan mengacu pada KKNI, jumlah dan keungggulan publikasi ilmiah.",
    "unsurList": [
      "Ketersediaan Bukti:\nCapaian dan Pendidikan\na.Capaian pembelajaran lulusan.\nb. IPK lulusan.\nc. Prestasi akademik dan non-akademik mahasiswa.\nd. Masa studi, kelulusan tepat waktu, dan keberhasilan studi\ne. Pelaksanaan tracer study yang mencakup 5 aspek.\nf. Waktu tunggu, kesesuaian bidang kerja, tingkat dan ukuran tempat kerja, serta tingkat kepuasan pengguna lulusan.\ng.Publikasi ilmiah mahasiswa.\nh. Produk dan jasa karya mahasiswa.\ni. Luaran penelitian dan PkM mahasiswa",
      "Dokumen hasil pengembangan, implementasi, dan evaluasi kurikulum. Untuk pemenuhan capaian Pembelajaran dari internal dan eksternal",
      "Dokumen rekognisi hasil pendidikan dan pengajaran.",
      "Dokumen tracer study."
    ]
  },
  {
    "no": 33,
    "excelRow": 62,
    "excelNo": "32",
    "criterionNo": "9",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "Kriteria 9. Luaran dan Capaian Tridarma",
    "kodeAmiLabel": "Penelitian",
    "area": "Jumlah dan keungggulan publikasi ilmiah, jumlah sitasi, jumlah hak kekayaan intelektual, dan kemanfaatan/dampak hasil penelitian terhadap pewujudan visi dan penyelenggaraan misi, serta kontribusi pengabdian kepadamasyarakat pada pengembangan dan pemberdayaan sosial, ekonomi, dan kesejahteraan masyarakat.",
    "unsurList": [
      "Dokumen rekognisi hasil dari penelitian dan PkM.\na) Publikasi Jurnal Terakreditasi Nasional\na) Publikasi Jurnal Terakreditasi Internasional\nc) Sitasi"
    ]
  },
  {
    "no": 34,
    "excelRow": 63,
    "excelNo": "33",
    "criterionNo": "9",
    "s2": null,
    "str": null,
    "d3": null,
    "criterionName": "Kriteria 9. Luaran dan Capaian Tridarma",
    "kodeAmiLabel": "Pengabdian Kepada Masyarakat",
    "area": "Deskripsi area audit belum tertulis pada file sumber untuk Pengabdian Kepada Masyarakat.",
    "unsurList": [
      "Dokumen penelitian dan PkM yang menghasilkan output dan outcome.\na )jumlah penelitian bidang infokom?teknik Emba yang mendapat pengakuan HKI (Paten, Paten\nSederhana, Hak Cipta, Desain Produk Industri).\nb )jumlah kegiatanPenelitian/ PkM yang relevan dengan bidang infokom yang diadopsi olehmasyarakat.",
      "Dokumen pemanfaatan intelektual hasil dari penelitian dan PkM."
    ]
  }
];

function normalizeText(value: string | null | undefined) {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned : null;
}

async function main() {
  console.log('🌱 Starting seed AMI Prodi...');

  // =========================================================
  // 0. Bersihkan semua data (urutan terbalik dari FK)
  // =========================================================
  await prisma.isianReviewLog.deleteMany();
  await prisma.isianBuktiFile.deleteMany();
  await prisma.isianAmi.deleteMany();
  await prisma.pemeriksaanUnsur.deleteMany();
  await prisma.deskripsiArea.deleteMany();
  await prisma.kodeAmiButirStandar.deleteMany();
  await prisma.kodeAmi.deleteMany();
  await prisma.kriteriaStandar.deleteMany();
  await prisma.instrumen.deleteMany();
  await prisma.periode.deleteMany();
  await prisma.dosen.deleteMany();
  await prisma.user.deleteMany();
  await prisma.prodi.deleteMany();
  await prisma.jurusan.deleteMany();
  await prisma.role.deleteMany();
  await prisma.jenjangStandar.deleteMany();

  console.log('✅ Data lama dihapus');

  // =========================================================
  // 1. Roles
  // =========================================================
  const roleAdmin = await prisma.role.create({
    data: { nama_role: 'admin', deskripsi: 'Administrator sistem AMI' },
  });

  const roleKaprodi = await prisma.role.create({
    data: { nama_role: 'kaprodi', deskripsi: 'Kepala Program Studi / reviewer AMI' },
  });

  const roleDosen = await prisma.role.create({
    data: { nama_role: 'dosen', deskripsi: 'Dosen pengisi AMI' },
  });

  console.log('✅ Roles seeded');

  // =========================================================
  // 2. Jurusan & Prodi
  // =========================================================
  const jurusanTE = await prisma.jurusan.create({
    data: { nama_jurusan: 'Teknik Elektro' },
  });

  const prodiD3TI = await prisma.prodi.create({
    data: {
      jurusan_id: jurusanTE.id,
      nama_prodi: 'Teknik Informatika',
      jenjang: 'D3',
    },
  });

  const prodiD4TRK = await prisma.prodi.create({
    data: {
      jurusan_id: jurusanTE.id,
      nama_prodi: 'Teknologi Rekayasa Komputer',
      jenjang: 'D4',
    },
  });

  console.log('✅ Jurusan & Prodi seeded');

  // =========================================================
  // 3. Users
  // =========================================================
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@polines.ac.id',
      password: hashedPassword,
      role_id: roleAdmin.id,
      is_active: true,
    },
  });

  const kaprodiUser = await prisma.user.create({
    data: {
      email: 'kaprodi.ti@polines.ac.id',
      password: hashedPassword,
      role_id: roleKaprodi.id,
      prodi_id: prodiD3TI.id,
      is_active: true,
    },
  });

  const kaprodiUser2 = await prisma.user.create({
    data: {
      email: 'kaprodi.trk@polines.ac.id',
      password: hashedPassword,
      role_id: roleKaprodi.id,
      prodi_id: prodiD4TRK.id,
      is_active: true,
    },
  });

  const dosenUser1 = await prisma.user.create({
    data: {
      email: 'idhawati.hestiningsih@polines.ac.id',
      password: hashedPassword,
      role_id: roleDosen.id,
      is_active: true,
    },
  });

  const dosenUser2 = await prisma.user.create({
    data: {
      email: 'muttabik.fathul@polines.ac.id',
      password: hashedPassword,
      role_id: roleDosen.id,
      is_active: true,
    },
  });

  const dosenUser3 = await prisma.user.create({
    data: {
      email: 'sukamto@polines.ac.id',
      password: hashedPassword,
      role_id: roleDosen.id,
      is_active: true,
    },
  });

  const dosenUser4 = await prisma.user.create({
    data: {
      email: 'wiktasari@polines.ac.id',
      password: hashedPassword,
      role_id: roleDosen.id,
      is_active: true,
    },
  });

  console.log('✅ Users seeded');

  // =========================================================
  // 4. Dosen Profiles
  // Catatan: User Admin TIDAK terhubung ke profil Dosen.
  // Kaprodi punya profil Dosen untuk linkage prodi (tapi tidak mengisi AMI).
  // =========================================================
  const dosen1 = await prisma.dosen.create({
    data: {
      user_id: dosenUser1.id,
      prodi_id: prodiD3TI.id,
      nip: '196910071995122001',
      nama_lengkap: 'IDHAWATI HESTININGSIH, S.KOM., M.KOM.',
      status_kepegawaian: 'Dosen Tetap',
      no_hp: '081234567001',
      alamat: 'Semarang',
      is_active: true,
    },
  });

  const dosen2 = await prisma.dosen.create({
    data: {
      user_id: dosenUser2.id,
      prodi_id: prodiD3TI.id,
      nip: '199001012019031002',
      nama_lengkap: 'MUTTABIK FATHUL LATHIEF, S.KOM., M.ENG.',
      status_kepegawaian: 'Dosen Tetap',
      no_hp: '081234567002',
      alamat: 'Semarang',
      is_active: true,
    },
  });

  const dosen3 = await prisma.dosen.create({
    data: {
      user_id: dosenUser3.id,
      prodi_id: prodiD3TI.id,
      nip: '197105052000031003',
      nama_lengkap: 'SUKAMTO, S.KOM., M.T.',
      status_kepegawaian: 'Dosen Tetap',
      no_hp: '081234567003',
      alamat: 'Semarang',
      is_active: true,
    },
  });

  const dosen4 = await prisma.dosen.create({
    data: {
      user_id: dosenUser4.id,
      prodi_id: prodiD4TRK.id,
      nip: '197506012003122004',
      nama_lengkap: 'WIKTASARI, S.T., M.KOM.',
      status_kepegawaian: 'Dosen Tetap',
      no_hp: '081234567004',
      alamat: 'Semarang',
      is_active: true,
    },
  });

  console.log('✅ Dosen seeded');

  // =========================================================
  // 5. Jenjang Standar
  // =========================================================
  const jenjangS2 = await prisma.jenjangStandar.create({
    data: { kode_jenjang: 'S2_MGTR', nama_jenjang: 'S2 / Magister Terapan', urutan: 1 },
  });

  const jenjangSTr = await prisma.jenjangStandar.create({
    data: { kode_jenjang: 'STR', nama_jenjang: 'Sarjana Terapan', urutan: 2 },
  });

  const jenjangD3 = await prisma.jenjangStandar.create({
    data: { kode_jenjang: 'D3', nama_jenjang: 'Diploma 3', urutan: 3 },
  });

  const jenjangByCode = {
    S2_MGTR: jenjangS2,
    STR: jenjangSTr,
    D3: jenjangD3,
  };

  console.log('✅ Jenjang Standar seeded');

  // =========================================================
  // 6. Periode & Instrumen
  // =========================================================
  const periode = await prisma.periode.create({
    data: {
      tahun: '2025/2026',
      is_active: true,
      tanggal_mulai: new Date('2025-09-01'),
      tanggal_selesai: new Date('2026-06-30'),
    },
  });

  const instrumen = await prisma.instrumen.create({
    data: {
      periode_id: periode.id,
      nama_instrumen: 'Instrumen AMI Program Studi 2025/2026',
      deskripsi: 'Area / Lingkup Audit: Pendidikan untuk Program Magister / Sarjana Terapan / Diploma 3',
      is_active: true,
      created_by: adminUser.id,
    },
  });

  console.log('✅ Periode & Instrumen seeded');

  // =========================================================
  // 7. Struktur Instrumen AMI sesuai Excel
  // =========================================================
  const kriteriaMap = new Map<string, any>();
  const kodeAmiMap = new Map<string, any>();

  // Key format: areaNo.unsurUrutan
  // Contoh: "1.1" berarti area audit nomor 1, pemeriksaan unsur nomor 1.
  const unsurByKey = new Map<string, any>();
  const firstUnsurByAreaNo = new Map<number, any>();

  for (const item of instrumenItems) {
    const cleanCriterionNo = item.criterionNo.replace(/\D/g, '') || String(item.no);
    const kriteriaKey = `K${cleanCriterionNo}`;

    let kriteria = kriteriaMap.get(kriteriaKey);
    if (!kriteria) {
      kriteria = await prisma.kriteriaStandar.create({
        data: {
          instrumen_id: instrumen.id,
          kode_kriteria: kriteriaKey,
          nama_kriteria: item.criterionName ?? `Kriteria ${cleanCriterionNo}`,
          deskripsi: item.criterionName ?? null,
          urutan: Number(cleanCriterionNo) || item.no,
        },
      });
      kriteriaMap.set(kriteriaKey, kriteria);
    }

    // Dibuat unik per baris area audit agar tidak bentrok dengan unique(kriteria_id, kode_ami).
    const kodeLabel = normalizeText(item.kodeAmiLabel) ?? `AMI ${cleanCriterionNo}.${item.no}`;
    const kodeAmiValue = `${cleanCriterionNo}.${item.no} - ${kodeLabel}`;
    const kodeAmiKey = `${kriteria.id}::${kodeAmiValue}`;

    let kodeAmi = kodeAmiMap.get(kodeAmiKey);
    if (!kodeAmi) {
      kodeAmi = await prisma.kodeAmi.create({
        data: {
          kriteria_id: kriteria.id,
          kode_ami: kodeAmiValue,
          urutan: item.no,
        },
      });
      kodeAmiMap.set(kodeAmiKey, kodeAmi);

      const butirData: Array<{ kode_ami_id: any; jenjang_id: any; no_butir: string }> = [];

      if (item.s2) {
        butirData.push({ kode_ami_id: kodeAmi.id, jenjang_id: jenjangByCode.S2_MGTR.id, no_butir: item.s2 });
      }

      if (item.str) {
        butirData.push({ kode_ami_id: kodeAmi.id, jenjang_id: jenjangByCode.STR.id, no_butir: item.str });
      }

      if (item.d3) {
        butirData.push({ kode_ami_id: kodeAmi.id, jenjang_id: jenjangByCode.D3.id, no_butir: item.d3 });
      }

      if (butirData.length > 0) {
        await prisma.kodeAmiButirStandar.createMany({ data: butirData });
      }
    }

    const deskripsiArea = await prisma.deskripsiArea.create({
      data: {
        kode_ami_id: kodeAmi.id,
        deskripsi_area_audit: item.area,
        target_standar: null,
        urutan: item.no,
      },
    });

    // INI BAGIAN YANG DIPERBAIKI:
    // Dulu semua nomor di kolom "Pemeriksaan Pada Unsur" masuk menjadi satu isi_unsur.
    // Sekarang setiap nomor dibuat menjadi row sendiri.
    for (const [index, isiUnsur] of item.unsurList.entries()) {
      const pemeriksaanUnsur = await prisma.pemeriksaanUnsur.create({
        data: {
          deskripsi_area_id: deskripsiArea.id,
          isi_unsur: isiUnsur,
          urutan: index + 1,
        },
      });

      const key = `${item.no}.${index + 1}`;
      unsurByKey.set(key, pemeriksaanUnsur);

      if (index === 0) {
        firstUnsurByAreaNo.set(item.no, pemeriksaanUnsur);
      }
    }
  }

  const totalUnsur = instrumenItems.reduce((total, item) => total + item.unsurList.length, 0);
  console.log(`✅ Struktur instrumen AMI seeded: ${instrumenItems.length} area audit, ${totalUnsur} pemeriksaan unsur terpisah, ${kriteriaMap.size} kriteria`);

  // =========================================================
  // 8. Contoh Isian AMI dengan Skenario Realistic
  // =========================================================
  // CATATAN PENTING:
  // - Constraint: @@unique([pemeriksaan_unsur_id, periode_id, dosen_id])
  // - Setiap dosen punya riwayat isian sendiri untuk setiap unsur
  // - Bisa ada multiple isian untuk 1 unsur dari dosen berbeda
  // - First Valid Wins: Hanya 1 isian valid per unsur per prodi
  
  const allKeys = Array.from(unsurByKey.keys());
  const sampleIsian: any[] = [];
  const tiDosen = [dosen1, dosen2, dosen3];

  // =========================================================
  // SKENARIO 1: Area AMI 1 (5 unsur) - Multiple dosen compete, Dosen 1 wins
  // =========================================================
  // Unsur 1.1: Dosen1 valid (winner), Dosen2 proses, Dosen3 revisi
  sampleIsian.push({
    key: '1.1', dosen: dosen1, prodi: prodiD3TI, kaprodi: kaprodiUser,
    judul: 'Renstra Polines 2025-2029', status: 'valid' as const, 
    ada: true, spt: true, sn: true, lokal: true, nasional: true, internasional: false, 
    catatan: 'Dokumen lengkap dan sesuai standar SPMI.'
  });
  sampleIsian.push({
    key: '1.1', dosen: dosen2, prodi: prodiD3TI, kaprodi: kaprodiUser,
    judul: 'Renstra Polines (Draft)', status: 'superseded' as const,
    ada: true, spt: true, sn: true, lokal: true, nasional: false, internasional: false,
    catatan: 'Isian ini telah digantikan oleh isian valid dari IDHAWATI HESTININGSIH.'
  });
  sampleIsian.push({
    key: '1.1', dosen: dosen3, prodi: prodiD3TI, kaprodi: kaprodiUser,
    judul: 'Renstra Polines (Versi Lama)', status: 'superseded' as const,
    ada: true, spt: false, sn: true, lokal: false, nasional: false, internasional: false,
    catatan: 'Isian ini telah digantikan oleh isian valid dari IDHAWATI HESTININGSIH.'
  });

  // Unsur 1.2: Dosen2 valid (winner), Dosen1 revisi
  sampleIsian.push({
    key: '1.2', dosen: dosen2, prodi: prodiD3TI, kaprodi: kaprodiUser,
    judul: 'Dokumen Mekanisme VMTS Jurusan TE', status: 'valid' as const,
    ada: true, spt: true, sn: true, lokal: true, nasional: true, internasional: false,
    catatan: 'Lengkap dengan bukti rapat penyusunan VMTS.'
  });
  sampleIsian.push({
    key: '1.2', dosen: dosen1, prodi: prodiD3TI, kaprodi: kaprodiUser,
    judul: 'Mekanisme VMTS (Draft)', status: 'superseded' as const,
    ada: true, spt: true, sn: false, lokal: true, nasional: false, internasional: false,
    catatan: 'Isian ini telah digantikan oleh isian valid dari MUTTABIK FATHUL LATHIEF.'
  });

  // Unsur 1.3-1.5: Dosen3 valid
  for (let i = 3; i <= 5; i++) {
    sampleIsian.push({
      key: `1.${i}`, dosen: dosen3, prodi: prodiD3TI, kaprodi: kaprodiUser,
      judul: `Dokumen AMI 1.${i} - Valid`, status: 'valid' as const,
      ada: true, spt: true, sn: true, lokal: true, nasional: true, internasional: false,
      catatan: 'Sesuai standar dan lengkap.'
    });
  }

  // =========================================================
  // SKENARIO 2: Distribusi normal untuk TI (target 40 valid total)
  // Sudah ada 5 valid di atas, butuh 35 lagi
  // =========================================================
  const remainingKeysTI = allKeys.filter(k => !['1.1','1.2','1.3','1.4','1.5'].includes(k));
  
  // 35 valid dari berbagai dosen
  for (let i = 0; i < 35 && remainingKeysTI.length > 0; i++) {
    const k = remainingKeysTI.shift()!;
    const selectedDosen = tiDosen[i % 3];
    sampleIsian.push({
      key: k, dosen: selectedDosen, prodi: prodiD3TI, kaprodi: kaprodiUser,
      judul: `Dokumen Valid TI - ${k}`, status: 'valid' as const,
      ada: true, spt: true, sn: true, lokal: true, nasional: i % 2 === 0, internasional: false,
      catatan: 'Sesuai standar.'
    });
  }

  // 10 menunggu review (proses)
  for (let i = 0; i < 10 && remainingKeysTI.length > 0; i++) {
    const k = remainingKeysTI.shift()!;
    const selectedDosen = tiDosen[i % 3];
    sampleIsian.push({
      key: k, dosen: selectedDosen, prodi: prodiD3TI, kaprodi: kaprodiUser,
      judul: `Dokumen Proses TI - ${k}`, status: 'proses' as const,
      ada: true, spt: true, sn: true, lokal: false, nasional: false, internasional: false,
      catatan: null
    });
  }

  // 8 perlu revisi
  for (let i = 0; i < 8 && remainingKeysTI.length > 0; i++) {
    const k = remainingKeysTI.shift()!;
    const selectedDosen = tiDosen[i % 3];
    sampleIsian.push({
      key: k, dosen: selectedDosen, prodi: prodiD3TI, kaprodi: kaprodiUser,
      judul: `Dokumen Revisi TI - ${k}`, status: 'revisi' as const,
      ada: true, spt: false, sn: true, lokal: false, nasional: false, internasional: false,
      catatan: 'Mohon lengkapi dengan dokumen pendukung yang lebih detail dan update tahun pelaksanaan.'
    });
  }

  // Sisanya kosong (tidak ada isian dari dosen manapun)

  // =========================================================
  // SKENARIO 3: TRK (Dosen 4) - Target 15 valid
  // =========================================================
  const keysForTRK = Array.from(unsurByKey.keys());
  
  for (let i = 0; i < 15 && keysForTRK.length > 0; i++) {
    const k = keysForTRK.shift()!;
    sampleIsian.push({
      key: k, dosen: dosen4, prodi: prodiD4TRK, kaprodi: kaprodiUser2,
      judul: `Dokumen Valid TRK - ${k}`, status: 'valid' as const,
      ada: true, spt: true, sn: true, lokal: true, nasional: i % 3 === 0, internasional: false,
      catatan: 'Valid dan lengkap.'
    });
  }

  // 5 menunggu review
  for (let i = 0; i < 5 && keysForTRK.length > 0; i++) {
    const k = keysForTRK.shift()!;
    sampleIsian.push({
      key: k, dosen: dosen4, prodi: prodiD4TRK, kaprodi: kaprodiUser2,
      judul: `Dokumen Proses TRK - ${k}`, status: 'proses' as const,
      ada: true, spt: true, sn: true, lokal: false, nasional: false, internasional: false,
      catatan: null
    });
  }

  // 3 perlu revisi
  for (let i = 0; i < 3 && keysForTRK.length > 0; i++) {
    const k = keysForTRK.shift()!;
    sampleIsian.push({
      key: k, dosen: dosen4, prodi: prodiD4TRK, kaprodi: kaprodiUser2,
      judul: `Dokumen Revisi TRK - ${k}`, status: 'revisi' as const,
      ada: true, spt: false, sn: true, lokal: false, nasional: false, internasional: false,
      catatan: 'Harap melampirkan laporan akhir kegiatan dan notulensi rapat.'
    });
  }

  // =========================================================
  // Create isian dengan review logs yang lengkap
  // =========================================================
  for (const [index, item] of sampleIsian.entries()) {
    const pemeriksaanUnsur = unsurByKey.get(item.key);
    if (!pemeriksaanUnsur) {
      console.warn(`⚠️ Pemeriksaan unsur dengan key ${item.key} tidak ditemukan, dilewati.`);
      continue;
    }

    const isian = await prisma.isianAmi.create({
      data: {
        pemeriksaan_unsur_id: pemeriksaanUnsur.id,
        periode_id: periode.id,
        dosen_id: item.dosen.id,
        prodi_id: item.prodi.id,
        judul_dokumen: item.judul,
        ketersediaan_standar: item.ada ? 'ada' : 'tidak_ada',
        dokumen: item.ada ? 'ada' : 'tidak_ada',
        pencapaian_standar_spt_pt: item.spt,
        pencapaian_standar_sn_dikti: item.sn,
        daya_saing_lokal: item.lokal,
        daya_saing_nasional: item.nasional,
        daya_saing_internasional: item.internasional,
        bukti_link: `https://drive.google.com/file/dummy-ami-${item.dosen.nip}-${item.key.replace('.', '-')}`,
        tahun_pelaksanaan: '2025',
        capaian: `Capaian untuk ${item.judul}: Implementasi telah dilakukan sesuai standar yang ditetapkan oleh institusi dengan melibatkan seluruh pemangku kepentingan.`,
        keterangan: item.catatan ?? `Data isian AMI untuk unsur ${item.key} oleh ${item.dosen.nama_lengkap}.`,
        status: item.status,
        catatan_kaprodi: (item.status === 'revisi' || item.status === 'valid' || item.status === 'superseded') ? item.catatan : null,
        reviewed_by: (item.status === 'revisi' || item.status === 'valid' || item.status === 'superseded') ? item.kaprodi.id : null,
        reviewed_at: (item.status === 'revisi' || item.status === 'valid' || item.status === 'superseded') ? new Date() : null,
        attempt: 1,
        submitted_at: item.status !== 'draft' ? new Date() : null,
      },
    });

    // Create bukti file
    await prisma.isianBuktiFile.create({
      data: {
        isian_id: isian.id,
        original_name: `${item.judul.substring(0, 50)}.pdf`,
        file_name: `bukti-${item.dosen.nip}-${item.key.replace('.', '-')}-${Date.now()}.pdf`,
        file_path: `/uploads/ami/bukti-${item.dosen.nip}-${item.key.replace('.', '-')}.pdf`,
        mime_type: 'application/pdf',
        file_size: 1024 * (100 + index),
        judul_dokumen: item.judul,
        keterangan_dokumen: `Dokumen bukti pelengkap untuk isian AMI unsur ${item.key}.`,
        tahun_dokumen: '2025',
        uploaded_by: item.dosen.user_id,
      },
    });

    // Create review log untuk yang sudah direview
    if (item.status === 'valid' || item.status === 'revisi' || item.status === 'superseded') {
      await prisma.isianReviewLog.create({
        data: {
          isian_id: isian.id,
          reviewer_id: item.kaprodi.id,
          status_sebelum: 'proses',
          status_sesudah: item.status,
          catatan: item.catatan ?? `Review ${item.status} oleh kaprodi.`,
        },
      });
    }
  }

  console.log(`✅ ${sampleIsian.length} contoh isian AMI seeded dengan distribusi:`);
  console.log(`   - Valid: ${sampleIsian.filter(i => i.status === 'valid').length}`);
  console.log(`   - Proses: ${sampleIsian.filter(i => i.status === 'proses').length}`);
  console.log(`   - Revisi: ${sampleIsian.filter(i => i.status === 'revisi').length}`);
  console.log(`   - Superseded: ${sampleIsian.filter(i => i.status === 'superseded').length}`);

  console.log('\n🎉 Seed selesai!');
  console.log('===========================================');
  console.log('📊 STATISTIK DATA:');
  console.log(`   Instrumen AMI    : ${instrumenItems.length} area audit`);
  console.log(`   Total Unsur      : ${totalUnsur} pemeriksaan unsur`);
  console.log(`   Total Isian      : ${sampleIsian.length} isian`);
  console.log('');
  console.log('🔐 AKUN LOGIN:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  👤 Admin:');
  console.log('     Email    : admin@polines.ac.id');
  console.log('     Password : password123');
  console.log('');
  console.log('  👔 Kaprodi Teknik Informatika:');
  console.log('     Email    : kaprodi.ti@polines.ac.id');
  console.log('     Password : password123');
  console.log('     Prodi    : D3 Teknik Informatika');
  console.log('');
  console.log('  👔 Kaprodi Teknologi Rekayasa Komputer:');
  console.log('     Email    : kaprodi.trk@polines.ac.id');
  console.log('     Password : password123');
  console.log('     Prodi    : D4 Teknologi Rekayasa Komputer');
  console.log('');
  console.log('  👨‍🏫 Dosen 1 (TI):');
  console.log('     Email    : idhawati.hestiningsih@polines.ac.id');
  console.log('     Password : password123');
  console.log('     Nama     : IDHAWATI HESTININGSIH, S.KOM., M.KOM.');
  console.log('     NIP      : 196910071995122001');
  console.log('');
  console.log('  👨‍🏫 Dosen 2 (TI):');
  console.log('     Email    : muttabik.fathul@polines.ac.id');
  console.log('     Password : password123');
  console.log('     Nama     : MUTTABIK FATHUL LATHIEF, S.KOM., M.ENG.');
  console.log('     NIP      : 199001012019031002');
  console.log('');
  console.log('  👨‍🏫 Dosen 3 (TI):');
  console.log('     Email    : sukamto@polines.ac.id');
  console.log('     Password : password123');
  console.log('     Nama     : SUKAMTO, S.KOM., M.T.');
  console.log('     NIP      : 197105052000031003');
  console.log('');
  console.log('  👨‍🏫 Dosen 4 (TRK):');
  console.log('     Email    : wiktasari@polines.ac.id');
  console.log('     Password : password123');
  console.log('     Nama     : WIKTASARI, S.T., M.KOM.');
  console.log('     NIP      : 197506012003122004');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('💡 FITUR YANG DAPAT DITEST:');
  console.log('   ✅ Login multi-role (admin, kaprodi, dosen)');
  console.log('   ✅ Riwayat isian per-dosen (terpisah)');
  console.log('   ✅ First Valid Wins strategy');
  console.log('   ✅ View-only untuk isian valid');
  console.log('   ✅ Multiple dosen competing (unsur 1.1 & 1.2)');
  console.log('   ✅ Status superseded untuk isian kalah');
  console.log('   ✅ Review workflow (proses → valid/revisi)');
  console.log('===========================================');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
