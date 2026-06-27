import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { guard } from '@/app/lib/auth';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { PdfExportDocument, ExportProdi, ExportKriteria, ExportKodeAmi, ExportArea, ExportUnsur } from '@/app/components/PdfExportDocument';

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

    const isianMap = new Map<string, any[]>();
    for (const is of isians) {
      const key = `${is.pemeriksaan_unsur_id}::${is.prodi_id}`;
      if (!isianMap.has(key)) isianMap.set(key, []);
      isianMap.get(key)!.push(is);
    }

    // 4. Generate data hierarki untuk PDF
    const pdfData: ExportProdi[] = [];
    const baseUrl = request.nextUrl.origin;
    
    for (const prodi of targetProdis) {
      const prodiExport: ExportProdi = { prodiName: prodi.nama_prodi, kriterias: [] };
      
      const kriteriaMap = new Map<number, ExportKriteria>();
      const kodeAmiMap = new Map<number, ExportKodeAmi>();
      const areaMap = new Map<number, ExportArea>();

      for (const unsur of unsurs) {
        const area = unsur.deskripsi_area;
        const kodeAmi = area.kode_ami;
        const kriteria = kodeAmi.kriteria;
        
        if (!kriteriaMap.has(kriteria.id)) {
          const newKriteria: ExportKriteria = { kriteriaKode: kriteria.kode_kriteria, kriteriaNama: kriteria.nama_kriteria, amis: [] };
          kriteriaMap.set(kriteria.id, newKriteria);
          prodiExport.kriterias.push(newKriteria);
        }
        const currentKriteria = kriteriaMap.get(kriteria.id)!;

        if (!kodeAmiMap.has(kodeAmi.id)) {
          const newKodeAmi: ExportKodeAmi = { kodeAmi: kodeAmi.kode_ami, areas: [] };
          kodeAmiMap.set(kodeAmi.id, newKodeAmi);
          currentKriteria.amis.push(newKodeAmi);
        }
        const currentKodeAmi = kodeAmiMap.get(kodeAmi.id)!;

        if (!areaMap.has(area.id)) {
          const newArea: ExportArea = { deskripsi: area.deskripsi_area_audit, unsurs: [] };
          areaMap.set(area.id, newArea);
          currentKodeAmi.areas.push(newArea);
        }
        const currentArea = areaMap.get(area.id)!;

        const key = `${unsur.id}::${prodi.id}`;
        const matchedIsians = isianMap.get(key) || [];

        if (matchedIsians.length > 0) {
          for (const isian of matchedIsians) {
            const listBukti = (isian.bukti_files || []).map((b: any) => `${baseUrl}${b.file_path}`).join('\n');
            currentArea.unsurs.push({
              isiUnsur: unsur.isi_unsur,
              status: isian.status === 'valid' ? 'Valid' : isian.status,
              ketersediaanStandar: isian.ketersediaan_standar === 'ada' ? 'Ada' : 'Tidak Ada',
              ketersediaanDokumen: isian.dokumen === 'ada' ? 'Ada' : 'Tidak Ada',
              pencapaianSptPt: isian.pencapaian_standar_spt_pt || false,
              pencapaianSnDikti: isian.pencapaian_standar_sn_dikti || false,
              dayaSaingLokal: isian.daya_saing_lokal || false,
              dayaSaingNasional: isian.daya_saing_nasional || false,
              dayaSaingInternasional: isian.daya_saing_internasional || false,
              keterangan: isian.keterangan || '-',
              buktiLink: isian.bukti_link || listBukti || '-'
            });
          }
        } else {
          currentArea.unsurs.push({
            isiUnsur: unsur.isi_unsur,
            status: 'Belum Terisi',
            ketersediaanStandar: '-',
            ketersediaanDokumen: '-',
            pencapaianSptPt: false,
            pencapaianSnDikti: false,
            dayaSaingLokal: false,
            dayaSaingNasional: false,
            dayaSaingInternasional: false,
            keterangan: '-',
            buktiLink: '-'
          });
        }
      }
      pdfData.push(prodiExport);
    }

    const periodeObj = await prisma.periode.findUnique({ where: { id: periodeId } });
    const periodeLabel = periodeObj?.tahun || 'Tidak Diketahui';

    // 5. Render to PDF stream
    const stream = await renderToStream(
      React.createElement(PdfExportDocument, { data: pdfData, periodeLabel })
    );

    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rekap_AMI_${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (e: any) {
    console.error('[Export Error]', e);
    return NextResponse.json({ success: false, message: 'Gagal melakukan export data' }, { status: 500 });
  }
}
