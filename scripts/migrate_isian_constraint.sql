-- Migration Script: Separate Isian Per Dosen
-- Date: 2026-06-19
-- Purpose: Change unique constraint from prodi_id to dosen_id

USE ami_prodi;

-- Step 1: Check current constraint
SHOW INDEX FROM isian_ami WHERE Key_name = 'isian_ami_pemeriksaan_unsur_id_periode_id_prodi_id_key';

-- Step 2: Drop the old unique constraint
ALTER TABLE `isian_ami` DROP INDEX `isian_ami_pemeriksaan_unsur_id_periode_id_prodi_id_key`;

-- Step 3: Add new unique constraint with dosen_id instead of prodi_id
ALTER TABLE `isian_ami` ADD UNIQUE KEY `isian_ami_pemeriksaan_unsur_id_periode_id_dosen_id_key` (`pemeriksaan_unsur_id`, `periode_id`, `dosen_id`);

-- Step 4: Verify new constraint
SHOW INDEX FROM isian_ami WHERE Key_name = 'isian_ami_pemeriksaan_unsur_id_periode_id_dosen_id_key';

SELECT 'Migration completed successfully!' AS status;
