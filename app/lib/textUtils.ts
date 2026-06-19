/**
 * Text Utility Functions
 * Helper functions untuk formatting text
 */

/**
 * Convert text to Title Case (Capitalize First Letter of Each Word)
 * Examples:
 * - "IDHAWATI HESTININGSIH" -> "Idhawati Hestiningsih"
 * - "idhawati hestiningsih" -> "Idhawati Hestiningsih"
 * - "IdHaWaTi HeStInInGsIh" -> "Idhawati Hestiningsih"
 * 
 * Special handling for abbreviations (S.KOM., M.KOM., etc.)
 */
export function toTitleCase(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Special handling untuk gelar/abbreviation dengan titik
      if (word.includes('.')) {
        return word.toUpperCase();
      }
      
      // Capitalize first letter of regular words
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Format nama lengkap dosen dengan Title Case
 * Khusus untuk nama dosen yang sering mengandung gelar
 */
export function formatNamaDosen(nama: string | null | undefined): string {
  if (!nama) return '';
  
  return toTitleCase(nama);
}

/**
 * Format nama untuk display singkat (tanpa gelar)
 * Example: "IDHAWATI HESTININGSIH, S.KOM., M.KOM." -> "Idhawati Hestiningsih"
 */
export function formatNamaShort(nama: string | null | undefined): string {
  if (!nama) return '';
  
  // Remove gelar (text after comma)
  const namaTanpaGelar = nama.split(',')[0].trim();
  return toTitleCase(namaTanpaGelar);
}

/**
 * Format nama dengan gelar terpisah
 * Returns: { nama: "Idhawati Hestiningsih", gelar: "S.Kom., M.Kom." }
 */
export function splitNamaGelar(namaLengkap: string | null | undefined): {
  nama: string;
  gelar: string;
} {
  if (!namaLengkap) return { nama: '', gelar: '' };
  
  const parts = namaLengkap.split(',').map(p => p.trim());
  const nama = toTitleCase(parts[0]);
  const gelar = parts.slice(1).join(', ').toUpperCase();
  
  return { nama, gelar };
}
