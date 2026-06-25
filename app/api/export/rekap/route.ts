import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import * as xlsx from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = guard(request, 'admin', 'kaprodi');
    if (error) return error;

    const { searchParams } = request.nextUrl;
    
    const periodeParam = searchParams.get('periode_id');
    const prodiParam = searchParams.get('prodi_id');
    const instrumenParam = searchParams.get('instrumen_id');

    if (!periodeParam || !instrumenParam) {
      return NextResponse.json({ success: false, message: 'periode_id dan instrumen_id wajib diisi' }, { status: 400 });
    }

    const periodeId = Number(periodeParam);
    const instrumenId = Number(instrumenParam);
    
    let prodiId: number | null = null;
    
    if (user.roleName.toLowerCase() === 'kaprodi') {
      const kaprodiUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { prodi_id: true, dosen: { select: { prodi_id: true } } },
      });
      if (kaprodiUser?.prodi_id) {
        prodiId = kaprodiUser.prodi_id;
      } else if (kaprodiUser?.dosen?.prodi_id) {
        prodiId = kaprodiUser.dosen.prodi_id;
      }
      
      if (!prodiId) {
         return NextResponse.json({ success: false, message: 'Profil kaprodi tidak terhubung ke prodi manapun' }, { status: 400 });
      }
    } else {
      // Admin
      if (prodiParam && prodiParam !== 'all') {
        prodiId = Number(prodiParam);
      }
    }

    // 1. Ambil semua unsur di instrumen aktif
    const unsurs = await prisma.pemeriksaanUnsur.findMany({
      where: {
        deskripsi_area: {
          kode_ami: {
            kriteria: {
              instrumen_id: instrumenId
            }
          }
        }
      },
      include: {
        deskripsi_area: {
          include: {
            kode_ami: {
              include: { kriteria: true }
            }
          }
        }
      },
      orderBy: [
        { deskripsi_area: { kode_ami: { kriteria: { id: 'asc' } } } },
        { deskripsi_area: { kode_ami: { id: 'asc' } } },
        { deskripsi_area: { id: 'asc' } },
        { id: 'asc' }
      ]
    });

    // 2. Tentukan daftar prodi yang diexport
    let targetProdis: any[] = [];
    if (prodiId) {
      const p = await prisma.prodi.findUnique({ where: { id: prodiId } });
      if (p) targetProdis.push(p);
    } else {
      targetProdis = await prisma.prodi.findMany({ where: { is_active: true }, orderBy: { id: 'asc' } });
    }

    // 3. Ambil isian valid
    const isians = await prisma.isianAmi.findMany({
      where: {
        status: 'valid',
        periode_id: periodeId,
        prodi_id: prodiId ? prodiId : undefined,
        pemeriksaan_unsur: {
          deskripsi_area: { kode_ami: { kriteria: { instrumen_id: instrumenId } } }
        }
      },
      include: { dosen: true, bukti_files: true }
    });

    // Buat map isian berdasarkan unsur_id dan prodi_id
    // Catatan: Jika ada lebih dari satu dosen mengisi unsur yang sama di prodi yang sama (meski jarang), 
    // kita akan gabungkan atau ambil yang terakhir
    const isianMap = new Map<string, any[]>();
    for (const is of isians) {
      const key = `${is.pemeriksaan_unsur_id}::${is.prodi_id}`;
      if (!isianMap.has(key)) isianMap.set(key, []);
      isianMap.get(key)!.push(is);
    }

    // 4. Generate excel data (Cross join Prodi x Unsur)
    const excelData: any[] = [];
    const baseUrl = request.nextUrl.origin;
    
    for (const prodi of targetProdis) {
      for (const unsur of unsurs) {
        const area = unsur.deskripsi_area;
        const kodeAmi = area.kode_ami;
        const kriteria = kodeAmi.kriteria;
        
        const key = `${unsur.id}::${prodi.id}`;
        const matchedIsians = isianMap.get(key) || [];

        if (matchedIsians.length > 0) {
          for (const isian of matchedIsians) {
            const listBukti = (isian.bukti_files || []).map((b: any) => `${baseUrl}${b.file_path}`).join('\n');
            excelData.push({
              'Program Studi': prodi.nama_prodi,
              'Kriteria Standar': `[${kriteria.kode_kriteria}] ${kriteria.nama_kriteria}`,
              'Kode AMI': kodeAmi.kode_ami,
              'Deskripsi Area': area.deskripsi_area_audit,
              'Isi Unsur': unsur.isi_unsur,
              'Status': 'Valid',
              'Dosen Pengisi': isian.dosen.nama_lengkap,
              'Judul Dokumen': isian.judul_dokumen || '-',
              'Ketersediaan Standar': isian.ketersediaan_standar === 'ada' ? 'Ada' : 'Tidak Ada',
              'Ketersediaan Dokumen': isian.dokumen === 'ada' ? 'Ada' : 'Tidak Ada',
              'Pencapaian SPT PT': isian.pencapaian_standar_spt_pt ? 'Ya' : 'Tidak',
              'Pencapaian SN DIKTI': isian.pencapaian_standar_sn_dikti ? 'Ya' : 'Tidak',
              'Daya Saing Lokal': isian.daya_saing_lokal ? 'Ya' : 'Tidak',
              'Daya Saing Nasional': isian.daya_saing_nasional ? 'Ya' : 'Tidak',
              'Daya Saing Internasional': isian.daya_saing_internasional ? 'Ya' : 'Tidak',
              'Link Bukti Fisik': isian.bukti_link || '-',
              'Daftar File Bukti': listBukti || '-',
              'Tahun Pelaksanaan': isian.tahun_pelaksanaan || '-',
              'Capaian': isian.capaian || '-',
              'Keterangan': isian.keterangan || '-',
            });
          }
        } else {
          excelData.push({
            'Program Studi': prodi.nama_prodi,
            'Kriteria Standar': `[${kriteria.kode_kriteria}] ${kriteria.nama_kriteria}`,
            'Kode AMI': kodeAmi.kode_ami,
            'Deskripsi Area': area.deskripsi_area_audit,
            'Isi Unsur': unsur.isi_unsur,
            'Status': 'Belum Terisi / Proses',
            'Dosen Pengisi': '-',
            'Judul Dokumen': '-',
            'Ketersediaan Standar': '-',
            'Ketersediaan Dokumen': '-',
            'Pencapaian SPT PT': '-',
            'Pencapaian SN DIKTI': '-',
            'Daya Saing Lokal': '-',
            'Daya Saing Nasional': '-',
            'Daya Saing Internasional': '-',
            'Link Bukti Fisik': '-',
            'Daftar File Bukti': '-',
            'Tahun Pelaksanaan': '-',
            'Capaian': '-',
            'Keterangan': '-',
          });
        }
      }
    }

    if (excelData.length === 0) {
       excelData.push({ 'Informasi': 'Tidak ada struktur instrumen ditemukan.' });
    }

    // Create workbook and worksheet
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Rekap Isian Valid');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Rekap_AMI_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (e: any) {
    console.error('[Export Error]', e);
    return NextResponse.json({ success: false, message: 'Gagal melakukan export data' }, { status: 500 });
  }
}
