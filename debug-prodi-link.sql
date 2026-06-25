-- Debug: Check prodi links for instrumen
-- Run this in MySQL/MariaDB console to debug

-- 1. Check all prodi
SELECT id, nama_prodi, jenjang, is_active 
FROM prodi 
ORDER BY id;

-- 2. Check instrumen and periode
SELECT i.id, i.nama_instrumen, i.is_active as instr_active, 
       p.tahun, p.is_active as periode_active
FROM instrumen i
LEFT JOIN periode p ON i.periode_id = p.id
ORDER BY i.created_at DESC;

-- 3. Check prodi_instrumen_link for specific instrumen
-- Replace instrumen_id with actual ID from query above
SELECT 
    pil.id,
    pil.instrumen_id,
    pil.prodi_id,
    pil.is_active as link_active,
    p.nama_prodi,
    p.jenjang,
    i.nama_instrumen
FROM prodi_instrumen_link pil
JOIN prodi p ON pil.prodi_id = p.id
JOIN instrumen i ON pil.instrumen_id = i.id
WHERE pil.instrumen_id = (
    SELECT id FROM instrumen 
    WHERE nama_instrumen LIKE '%Uji Export%' 
    LIMIT 1
)
ORDER BY p.nama_prodi;

-- 4. Check dosen TRK
SELECT 
    d.id as dosen_id,
    d.nama_lengkap,
    d.nip,
    d.prodi_id,
    p.nama_prodi,
    p.jenjang,
    u.email,
    u.is_active as user_active
FROM dosen d
JOIN prodi p ON d.prodi_id = p.id
JOIN user u ON d.user_id = u.id
WHERE p.nama_prodi LIKE '%Rekayasa%'
   OR p.nama_prodi LIKE '%TRK%'
ORDER BY d.nama_lengkap;

-- 5. Check if query works with actual data
-- This simulates what the API does
SET @prodi_id = (SELECT prodi_id FROM dosen WHERE nip = 'NIP_DOSEN_TRK' LIMIT 1);
SET @periode_id = (SELECT id FROM periode WHERE is_active = 1 LIMIT 1);

SELECT 
    i.id,
    i.nama_instrumen,
    i.is_active,
    COUNT(pil.id) as link_count
FROM instrumen i
LEFT JOIN prodi_instrumen_link pil ON i.id = pil.instrumen_id 
    AND pil.prodi_id = @prodi_id 
    AND pil.is_active = 1
WHERE i.periode_id = @periode_id 
  AND i.is_active = 1
GROUP BY i.id, i.nama_instrumen, i.is_active;
