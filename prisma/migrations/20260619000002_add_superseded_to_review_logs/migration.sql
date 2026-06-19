-- Add 'superseded' value to status enums in isian_review_logs table
-- This allows review logs to track when an isian is superseded by another valid isian

-- Update status_sebelum enum
ALTER TABLE `isian_review_logs` 
MODIFY `status_sebelum` ENUM('draft', 'proses', 'valid', 'revisi', 'superseded') NULL;

-- Update status_sesudah enum  
ALTER TABLE `isian_review_logs` 
MODIFY `status_sesudah` ENUM('draft', 'proses', 'valid', 'revisi', 'superseded') NOT NULL;
