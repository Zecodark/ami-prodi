import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 7, // Smaller font to fit more text
    flexDirection: 'column',
  },
  headerText: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subHeaderText: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 15,
  },
  prodiTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#f0f0f0',
    padding: 5,
    marginTop: 10,
    border: '1pt solid #000',
    borderBottom: 'none',
  },
  table: {
    width: '100%',
    border: '1pt solid #000',
    borderBottom: 'none',
    borderRight: 'none',
  },
  row: {
    flexDirection: 'row',
  },
  colHeaderMain: {
    backgroundColor: '#4f46e5', // Indigo-600
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    borderRight: '1pt solid #000',
    borderBottom: '1pt solid #000',
  },
  colHeaderGrey: {
    backgroundColor: '#d3d3d3', // Grey for Keterangan
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    borderRight: '1pt solid #000',
    borderBottom: '1pt solid #000',
  },
  colTextCenter: {
    padding: 4,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  colTextLeft: {
    padding: 4,
    textAlign: 'left',
    justifyContent: 'center',
    display: 'flex',
  },
  borderRight: { borderRight: '1pt solid #000' },
  borderBottom: { borderBottom: '1pt solid #000' },
  
  // LEVEL WIDTHS (Based on 100% total)
  // L1: No(3), S2(3), STr(3), D3(3), Standar(13) = Total 25%. Rest 75%
  wL1_No: { width: '12%' }, // 3/25
  wL1_S2: { width: '12%' },
  wL1_STr: { width: '12%' },
  wL1_D3: { width: '12%' },
  wL1_Standar: { width: '52%' }, // 13/25
  wL1_Container: { width: '25%', flexDirection: 'row' },
  wL1_Rest: { width: '75%', flexDirection: 'column' },

  // L2: Kode AMI (10) out of 75 = 13.333%. Rest 65/75 = 86.667%
  wL2_Kode: { width: '13.333%' },
  wL2_Rest: { width: '86.667%', flexDirection: 'column' },

  // L3: Diskripsi (15) out of 65 = 23.077%. Rest 50/65 = 76.923%
  wL3_Diskripsi: { width: '23.077%' },
  wL3_Rest: { width: '76.923%', flexDirection: 'column' },

  // L4: Rest 50% distributed inside 100% of L3_Rest
  wL4_Pemeriksaan: { width: '40%' }, // 20/50
  wL4_Ketersediaan: { width: '12%' }, // 6/50
  wL4_SPTPT: { width: '8%' }, // 4/50
  wL4_SNDIKTI: { width: '8%' }, // 4/50
  wL4_Lokal: { width: '6%' }, // 3/50
  wL4_Nasional: { width: '6%' }, // 3/50
  wL4_Internasional: { width: '6%' }, // 3/50
  wL4_Keterangan: { width: '14%' }, // 7/50

  // Absolute widths for headers
  wAbs3: { width: '3%' },
  wAbs9: { width: '9%', flexDirection: 'column' },
  wAbs13: { width: '13%' },
  wAbs10: { width: '10%' },
  wAbs15: { width: '15%' },
  wAbs20: { width: '20%' },
  wAbs6: { width: '6%', flexDirection: 'column' },
  wAbs8: { width: '8%', flexDirection: 'column' },
  wAbs9_DS: { width: '9%', flexDirection: 'column' }, // 9% for DS
  wAbs7_Ket: { width: '7%' },
  
  bold: { fontFamily: 'Helvetica-Bold' },
  link: { color: 'blue', textDecoration: 'underline' }
});

export type ExportUnsur = {
  isiUnsur: string;
  status: string;
  ketersediaanStandar: string;
  ketersediaanDokumen: string;
  pencapaianSptPt: boolean;
  pencapaianSnDikti: boolean;
  dayaSaingLokal: boolean;
  dayaSaingNasional: boolean;
  dayaSaingInternasional: boolean;
  keterangan: string;
  buktiLink: string;
};

export type ExportArea = {
  deskripsi: string;
  unsurs: ExportUnsur[];
};

export type ExportKodeAmi = {
  kodeAmi: string;
  areas: ExportArea[];
};

export type ExportKriteria = {
  kriteriaKode: string;
  kriteriaNama: string;
  amis: ExportKodeAmi[];
};

export type ExportProdi = {
  prodiName: string;
  kriterias: ExportKriteria[];
};

interface PdfExportDocumentProps {
  data: ExportProdi[];
  periodeLabel: string;
}

export const PdfExportDocument: React.FC<PdfExportDocumentProps> = ({ data, periodeLabel }) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.headerText}>REKAPITULASI AUDIT MUTU INTERNAL (AMI)</Text>
          <Text style={styles.subHeaderText}>Periode: {periodeLabel} | Area / Lingkup Audit: Pendidikan untuk Program Magister / Sarjana Terapan / Diploma 3</Text>
        </View>

        {data.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>Tidak ada data instrumen yang ditemukan.</Text>
        ) : (
          data.map((prodi, pIdx) => (
            <View key={pIdx} style={{ marginBottom: 20 }}>
              <Text style={styles.prodiTitle}>Program Studi: {prodi.prodiName}</Text>
              
              <View style={styles.table}>
                {/* -------------------- HEADER -------------------- */}
                <View style={styles.row}>
                  {/* No */}
                  <View style={[styles.wAbs3, styles.colHeaderMain]}><Text>No</Text></View>
                  
                  {/* No. Butir Standar */}
                  <View style={[styles.wAbs9, styles.colHeaderMain, { padding: 0 }]}>
                    <View style={[{ flex: 1, width: '100%', borderBottom: '1pt solid #000' }, styles.colTextCenter]}>
                      <Text>No. Butir Standar</Text>
                    </View>
                    <View style={{ flex: 1, width: '100%', flexDirection: 'row' }}>
                      <View style={[{ width: '33.33%', borderRight: '1pt solid #000' }, styles.colTextCenter]}><Text>S2 /Mgtr</Text></View>
                      <View style={[{ width: '33.33%', borderRight: '1pt solid #000' }, styles.colTextCenter]}><Text>STr.</Text></View>
                      <View style={[{ width: '33.34%' }, styles.colTextCenter]}><Text>D3</Text></View>
                    </View>
                  </View>

                  {/* Standar */}
                  <View style={[styles.wAbs13, styles.colHeaderMain]}><Text>Standar</Text></View>
                  
                  {/* Kode AMI */}
                  <View style={[styles.wAbs10, styles.colHeaderMain]}><Text>No. Kode AMI</Text></View>
                  
                  {/* Deskripsi Area */}
                  <View style={[styles.wAbs15, styles.colHeaderMain]}><Text>Diskripsi Area Audit-Sub Butir Standar</Text></View>
                  
                  {/* Pemeriksaan Unsur */}
                  <View style={[styles.wAbs20, styles.colHeaderMain]}><Text>Pemeriksaan Pada Unsur</Text></View>
                  
                  {/* Ketersediaan */}
                  <View style={[styles.wAbs6, styles.colHeaderMain, { padding: 0 }]}>
                    <View style={[{ flex: 1, width: '100%', borderBottom: '1pt solid #000' }, styles.colTextCenter]}>
                      <Text>Ketersedian Standar dan Dokumen</Text>
                    </View>
                    <View style={[{ flex: 1, width: '100%' }, styles.colTextCenter]}>
                      <Text>Ada / Tidak ada (ditulis)</Text>
                    </View>
                  </View>

                  {/* Pencapaian Standar */}
                  <View style={[styles.wAbs8, styles.colHeaderMain, { padding: 0 }]}>
                    <View style={[{ flex: 1, width: '100%', borderBottom: '1pt solid #000' }, styles.colTextCenter]}>
                      <Text>Pencapaian standar (beri tanda v)</Text>
                    </View>
                    <View style={{ flex: 1, width: '100%', flexDirection: 'row' }}>
                      <View style={[{ width: '50%', borderRight: '1pt solid #000' }, styles.colTextCenter]}><Text>SPT PT *)</Text></View>
                      <View style={[{ width: '50%' }, styles.colTextCenter]}><Text>SN DIKTI</Text></View>
                    </View>
                  </View>

                  {/* Daya Saing */}
                  <View style={[styles.wAbs9_DS, styles.colHeaderMain, { padding: 0 }]}>
                    <View style={[{ flex: 1, width: '100%', borderBottom: '1pt solid #000' }, styles.colTextCenter]}>
                      <Text>Daya Saing (beri tanda v)</Text>
                    </View>
                    <View style={{ flex: 1, width: '100%', flexDirection: 'row' }}>
                      <View style={[{ width: '33.33%', borderRight: '1pt solid #000' }, styles.colTextCenter]}><Text>Lokal</Text></View>
                      <View style={[{ width: '33.33%', borderRight: '1pt solid #000' }, styles.colTextCenter]}><Text>Nasional</Text></View>
                      <View style={[{ width: '33.34%' }, styles.colTextCenter]}><Text>Interna-sional</Text></View>
                    </View>
                  </View>

                  {/* Keterangan */}
                  <View style={[styles.wAbs7_Ket, styles.colHeaderGrey]}><Text>Keterangan</Text></View>
                </View>

                {/* -------------------- BODY -------------------- */}
                {prodi.kriterias.map((kriteria, kIdx) => (
                  <View key={kIdx} style={[styles.row, styles.borderBottom]}>
                    
                    {/* LEVEL 1 INFO (No, Butir S2, Butir STr, Butir D3, Standar) */}
                    <View style={styles.wL1_Container}>
                      <View style={[styles.wL1_No, styles.borderRight, styles.colTextCenter]}><Text>{kIdx + 1}</Text></View>
                      <View style={[styles.wL1_S2, styles.borderRight, styles.colTextCenter]}><Text></Text></View>
                      <View style={[styles.wL1_STr, styles.borderRight, styles.colTextCenter]}><Text></Text></View>
                      <View style={[styles.wL1_D3, styles.borderRight, styles.colTextCenter]}><Text>{kriteria.kriteriaKode}</Text></View>
                      <View style={[styles.wL1_Standar, styles.borderRight, styles.colTextCenter]}><Text>{kriteria.kriteriaNama}</Text></View>
                    </View>

                    {/* LEVEL 1 REST */}
                    <View style={styles.wL1_Rest}>
                      {kriteria.amis.map((ami, amiIdx) => (
                        <View key={amiIdx} style={[styles.row, amiIdx < kriteria.amis.length - 1 ? styles.borderBottom : {}]}>
                          
                          {/* LEVEL 2 INFO (Kode AMI) */}
                          <View style={[styles.wL2_Kode, styles.borderRight, styles.colTextCenter]}>
                            <Text>{ami.kodeAmi}</Text>
                          </View>

                          {/* LEVEL 2 REST */}
                          <View style={styles.wL2_Rest}>
                            {ami.areas.map((area, aIdx) => (
                              <View key={aIdx} style={[styles.row, aIdx < ami.areas.length - 1 ? styles.borderBottom : {}]}>
                                
                                {/* LEVEL 3 INFO (Diskripsi Area) */}
                                <View style={[styles.wL3_Diskripsi, styles.borderRight, styles.colTextLeft]}>
                                  <Text>{area.deskripsi}</Text>
                                </View>

                                {/* LEVEL 3 REST */}
                                <View style={styles.wL3_Rest}>
                                  {area.unsurs.map((unsur, uIdx) => (
                                    <View key={uIdx} style={[styles.row, uIdx < area.unsurs.length - 1 ? styles.borderBottom : {}]}>
                                      
                                      {/* Pemeriksaan Unsur */}
                                      <View style={[styles.wL4_Pemeriksaan, styles.borderRight, styles.colTextLeft]}>
                                        <Text>{uIdx + 1}. {unsur.isiUnsur}</Text>
                                      </View>

                                      {/* Ketersediaan */}
                                      <View style={[styles.wL4_Ketersediaan, styles.borderRight, styles.colTextCenter]}>
                                        <Text>{unsur.ketersediaanDokumen}</Text>
                                      </View>

                                      {/* SPT PT */}
                                      <View style={[styles.wL4_SPTPT, styles.borderRight, styles.colTextCenter]}>
                                        <Text>{unsur.pencapaianSptPt ? 'V' : ''}</Text>
                                      </View>

                                      {/* SN DIKTI */}
                                      <View style={[styles.wL4_SNDIKTI, styles.borderRight, styles.colTextCenter]}>
                                        <Text>{unsur.pencapaianSnDikti ? 'V' : ''}</Text>
                                      </View>

                                      {/* Lokal */}
                                      <View style={[styles.wL4_Lokal, styles.borderRight, styles.colTextCenter]}>
                                        <Text>{unsur.dayaSaingLokal ? 'V' : ''}</Text>
                                      </View>

                                      {/* Nasional */}
                                      <View style={[styles.wL4_Nasional, styles.borderRight, styles.colTextCenter]}>
                                        <Text>{unsur.dayaSaingNasional ? 'V' : ''}</Text>
                                      </View>

                                      {/* Internasional */}
                                      <View style={[styles.wL4_Internasional, styles.borderRight, styles.colTextCenter]}>
                                        <Text>{unsur.dayaSaingInternasional ? 'V' : ''}</Text>
                                      </View>

                                      {/* Keterangan */}
                                      <View style={[styles.wL4_Keterangan, styles.colTextLeft, { borderRight: '1pt solid #000' }]}>
                                        <Text style={{ marginBottom: 2 }}>{unsur.keterangan}</Text>
                                        {unsur.buktiLink && unsur.buktiLink !== '-' && (
                                          <Text style={styles.link}>[Link Bukti]</Text>
                                        )}
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </Page>
    </Document>
  );
};
