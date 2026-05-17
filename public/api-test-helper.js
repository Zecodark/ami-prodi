/**
 * API Testing Helper untuk Isi AMI
 * Buka browser console dan jalankan fungsi-fungsi di bawah untuk test
 */

// ========================================
// 1. Helper untuk ambil token
// ========================================
window.getToken = () => localStorage.getItem('ami_token');
window.getUser = () => JSON.parse(localStorage.getItem('ami_user') || '{}');

// ========================================
// 2. Test Instrumen
// ========================================
window.testInstrumen = async () => {
  const token = window.getToken();
  try {
    const res = await fetch('/api/instrumens?is_active=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('✅ Instrumen:', data);
    return data;
  } catch (e) {
    console.error('❌ Error:', e);
  }
};

// ========================================
// 3. Test Kriteria + Tree
// ========================================
window.testKriteria = async (instrumenId) => {
  const token = window.getToken();
  if (!instrumenId) {
    console.warn('⚠️ Masukkan instrumenId. Contoh: testKriteria("1")');
    return;
  }
  try {
    const res = await fetch(`/api/kriteria?instrumen_id=${instrumenId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('✅ Kriteria + Tree:', data);
    
    // Analisis struktur
    if (data.data && data.data.length > 0) {
      const k = data.data[0];
      console.log(`
📊 ANALISIS STRUKTUR:
- Jumlah Kriteria: ${data.data.length}
- Kriteria 1: [${k.kode_kriteria}] ${k.nama_kriteria}
- Jumlah Kode AMI di Kriteria 1: ${k.kode_amis?.length || 0}
      `);
      
      if (k.kode_amis && k.kode_amis[0]) {
        const ami = k.kode_amis[0];
        console.log(`
- Kode AMI 1: ${ami.kode_ami}
- Jumlah Deskripsi Area: ${ami.deskripsi_areas?.length || 0}
        `);
        
        if (ami.deskripsi_areas && ami.deskripsi_areas[0]) {
          const area = ami.deskripsi_areas[0];
          console.log(`
- Deskripsi Area 1: ${area.deskripsi_area_audit}
- Jumlah Unsur: ${area.pemeriksaan_unsurs?.length || 0}
          `);
        }
      }
    }
    return data;
  } catch (e) {
    console.error('❌ Error:', e);
  }
};

// ========================================
// 4. Test Periode Aktif
// ========================================
window.testPeriode = async () => {
  const token = window.getToken();
  try {
    const res = await fetch('/api/periodes?is_active=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('✅ Periode Aktif:', data);
    return data;
  } catch (e) {
    console.error('❌ Error:', e);
  }
};

// ========================================
// 5. Test Riwayat Isian
// ========================================
window.testRiwayat = async () => {
  const token = window.getToken();
  try {
    const res = await fetch('/api/isians', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('✅ Riwayat Isian:', data);
    
    if (data.data) {
      console.log(`
📊 SUMMARY:
- Total Isian: ${data.data.length}
- Valid: ${data.data.filter((i: any) => i.status === 'valid').length}
- Proses: ${data.data.filter((i: any) => i.status === 'proses').length}
- Revisi: ${data.data.filter((i: any) => i.status === 'revisi').length}
      `);
    }
    return data;
  } catch (e) {
    console.error('❌ Error:', e);
  }
};

// ========================================
// 6. Test Submit Isian (tanpa file)
// ========================================
window.testSubmitIsan = async (pemeriksaanUnsurId, periodeId) => {
  const token = window.getToken();
  if (!pemeriksaanUnsurId || !periodeId) {
    console.warn('⚠️ Masukkan pemeriksaanUnsurId dan periodeId');
    console.warn('Contoh: testSubmitIsan("1", "1")');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('pemeriksaan_unsur_id', pemeriksaanUnsurId);
    formData.append('periode_id', periodeId);
    formData.append('judul_dokumen', 'Test dari Console');
    formData.append('ketersediaan_standar', 'ada');
    formData.append('dokumen', 'ada');
    formData.append('pencapaian_standar_spt_pt', 'true');
    formData.append('pencapaian_standar_sn_dikti', 'true');
    formData.append('daya_saing_lokal', 'true');
    formData.append('daya_saing_nasional', 'false');
    formData.append('daya_saing_internasional', 'false');
    formData.append('bukti_link', 'https://example.com/bukti');
    formData.append('tahun_pelaksanaan', new Date().getFullYear().toString());
    formData.append('capaian', 'Capaian test dari console');
    formData.append('keterangan', 'Test submission');

    const res = await fetch('/api/isians', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      console.log('✅ BERHASIL Submit Isian!', data);
    } else {
      console.log('❌ GAGAL:', data);
    }
    return data;
  } catch (e) {
    console.error('❌ Error:', e);
  }
};

// ========================================
// 7. Full Diagnostic
// ========================================
window.diagnose = async () => {
  console.log('🔍 DIAGNOSTIC CHECK...\n');

  const token = window.getToken();
  const user = window.getUser();

  console.log('1️⃣ TOKEN & USER:');
  console.log(`   Token exists: ${!!token}`);
  console.log(`   User role: ${user.role}`);
  console.log(`   Dosen: ${user.dosen?.nama_lengkap}`);

  console.log('\n2️⃣ TESTING ENDPOINTS:');

  // Test Instrumen
  try {
    const res1 = await fetch('/api/instrumens?is_active=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data1 = await res1.json();
    console.log(`   ✅ Instrumen: ${data1.data?.length || 0} ditemukan`);
  } catch (e) {
    console.log(`   ❌ Instrumen: ${e.message}`);
  }

  // Test Periode
  try {
    const res2 = await fetch('/api/periodes?is_active=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data2 = await res2.json();
    console.log(`   ✅ Periode: ${data2.data?.length || 0} ditemukan`);
  } catch (e) {
    console.log(`   ❌ Periode: ${e.message}`);
  }

  // Test Kriteria
  try {
    const res3 = await fetch('/api/kriteria?instrumen_id=1', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data3 = await res3.json();
    console.log(`   ✅ Kriteria: ${data3.data?.length || 0} ditemukan`);
  } catch (e) {
    console.log(`   ❌ Kriteria: ${e.message}`);
  }

  // Test Riwayat
  try {
    const res4 = await fetch('/api/isians', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data4 = await res4.json();
    console.log(`   ✅ Riwayat: ${data4.data?.length || 0} isian ditemukan`);
  } catch (e) {
    console.log(`   ❌ Riwayat: ${e.message}`);
  }

  console.log('\n✨ DIAGNOSTIC SELESAI\n');
  console.log('💡 Gunakan fungsi berikut untuk test lebih detail:');
  console.log('   - testInstrumen()');
  console.log('   - testKriteria("1")  ← ganti ID instrumen');
  console.log('   - testPeriode()');
  console.log('   - testRiwayat()');
  console.log('   - testSubmitIsan("1", "1")  ← ganti ID unsur & periode');
};

// ========================================
// Auto-run diagnostic saat load
// ========================================
console.log(`
╔════════════════════════════════════════╗
║  API Testing Helper untuk Isi AMI      ║
╚════════════════════════════════════════╝

📋 Fungsi-fungsi yang tersedia:
   1. diagnose()           - Full diagnostic
   2. testInstrumen()      - Test instrumen aktif
   3. testKriteria(id)     - Test struktur instrumen
   4. testPeriode()        - Test periode aktif
   5. testRiwayat()        - Test riwayat isian
   6. testSubmitIsan(u,p)  - Test submit (tanpa file)
   
🎯 Quick Start:
   > diagnose()
   > testInstrumen()
   > testKriteria("1")
   > testSubmitIsan("1", "1")

`);

// Expose helper functions
window.APIHelper = {
  diagnose: window.diagnose,
  testInstrumen: window.testInstrumen,
  testKriteria: window.testKriteria,
  testPeriode: window.testPeriode,
  testRiwayat: window.testRiwayat,
  testSubmitIsan: window.testSubmitIsan,
  getToken: window.getToken,
  getUser: window.getUser
};

console.log('✅ APIHelper ready! Type: diagnose() to start\n');
