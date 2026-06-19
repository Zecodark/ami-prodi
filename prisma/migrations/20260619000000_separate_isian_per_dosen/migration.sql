-- AlterTable: Change unique constraint from prodi_id to dosen_id
-- This allows each dosen to have separate isian history for the same unsur

-- Step 1: Drop the old unique constraint
ALTER TABLE `isian_ami` DROP INDEX `isian_ami_pemeriksaan_unsur_id_periode_id_prodi_id_key`;

-- Step 2: Add new unique constraint with dosen_id instead of prodi_id
ALTER TABLE `isian_ami` ADD UNIQUE KEY `isian_ami_pemeriksaan_unsur_id_periode_id_dosen_id_key` (`pemeriksaan_unsur_id`, `periode_id`, `dosen_id`);
