const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app/dosen/isi-ami/page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Replace FormData with IsianForm
code = code.replace(/interface FormData {[\s\S]*?}/, `interface IsianForm {
  id?: number;
  urutan_isian: number;
  status: UnsurStatus;
  pemeriksaan_unsur_id: string;
  judul_dokumen: string;
  ketersediaan_standar: 'ada' | 'tidak_ada';
  dokumen: 'ada' | 'tidak_ada';
  pencapaian_standar_spt_pt: boolean;
  pencapaian_standar_sn_dikti: boolean;
  daya_saing_lokal: boolean;
  daya_saing_nasional: boolean;
  daya_saing_internasional: boolean;
  bukti_link: string;
  tahun_pelaksanaan: string;
  capaian: string;
  keterangan: string;
  catatan_kaprodi?: string;
  bukti_files: (File | null)[];
  existing_files?: Array<{ id: string; file_name: string; original_name: string; file_path: string }>;
}`);

// Replace state
code = code.replace(/const \[formData, setFormData\] = useState<FormData>\([\s\S]*?\);/, `const [isianList, setIsianList] = useState<IsianForm[]>([]);`);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Update script partially done');
