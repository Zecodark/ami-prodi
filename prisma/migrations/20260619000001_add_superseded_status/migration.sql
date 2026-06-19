-- Add 'superseded' value to IsianStatus enum
-- This status is used when another isian for the same unsur is validated (First Valid Wins)

ALTER TABLE `isian_ami` MODIFY `status` ENUM('draft', 'proses', 'valid', 'revisi', 'superseded') NOT NULL DEFAULT 'proses';
