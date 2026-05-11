-- =========================================================
-- DATABASE FRESH CREATE-ONLY - SISTEM AMI PRODI
-- MySQL 8+ / MariaDB
-- =========================================================

CREATE DATABASE IF NOT EXISTS ami_prodi
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ami_prodi;

-- Script fresh create-only. Tidak memakai DROP TABLE dan tidak mematikan FOREIGN_KEY_CHECKS.
-- Jalankan pada database kosong / fresh.

-- =========================================================
-- 1. ROLES
-- =========================================================

CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nama_role VARCHAR(10) NOT NULL UNIQUE,
    deskripsi VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- 2. USERS
-- =========================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(20) NOT NULL,
    role_id BIGINT UNSIGNED NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_users_role_id ON users(role_id);

-- =========================================================
-- 3. JURUSANS
-- =========================================================

CREATE TABLE jurusans (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nama_jurusan VARCHAR(30) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- 4. PRODIS
-- =========================================================

CREATE TABLE prodis (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    jurusan_id BIGINT UNSIGNED NULL,
    nama_prodi VARCHAR(50) NOT NULL,
    jenjang VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_prodis_jurusan
        FOREIGN KEY (jurusan_id)
        REFERENCES jurusans(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_prodis_nama_jurusan
        UNIQUE (nama_prodi, jurusan_id)
) ENGINE=InnoDB;

CREATE INDEX idx_prodis_jurusan_id ON prodis(jurusan_id);

-- =========================================================
-- 5. DOSENS
-- =========================================================

CREATE TABLE dosens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    prodi_id BIGINT UNSIGNED NULL,
    nip VARCHAR(20) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(50) NOT NULL,
    status_kepegawaian VARCHAR(50) NOT NULL,
    no_hp VARCHAR(20) NULL,
    alamat TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_dosens_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_dosens_prodi
        FOREIGN KEY (prodi_id)
        REFERENCES prodis(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_dosens_user_id
        UNIQUE (user_id)
) ENGINE=InnoDB;

CREATE INDEX idx_dosens_prodi_id ON dosens(prodi_id);

-- =========================================================
-- 6. PERIODES
-- =========================================================

CREATE TABLE periodes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tahun VARCHAR(10) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    tanggal_mulai DATE NULL,
    tanggal_selesai DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_periode_tanggal
        CHECK (
            tanggal_mulai IS NULL
            OR tanggal_selesai IS NULL
            OR tanggal_mulai <= tanggal_selesai
        )
) ENGINE=InnoDB;

CREATE INDEX idx_periodes_is_active ON periodes(is_active);

-- =========================================================
-- 7. INSTRUMENS
-- Admin membuat nama instrumen utama.
-- =========================================================

CREATE TABLE instrumens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    periode_id BIGINT UNSIGNED NULL,
    nama_instrumen VARCHAR(50) NOT NULL,
    deskripsi TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_instrumens_periode
        FOREIGN KEY (periode_id)
        REFERENCES periodes(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_instrumens_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_instrumens_periode_id ON instrumens(periode_id);
CREATE INDEX idx_instrumens_is_active ON instrumens(is_active);
CREATE INDEX idx_instrumens_created_by ON instrumens(created_by);

-- =========================================================
-- 8. KRITERIA / STANDAR
-- Contoh:
-- KRITERIA 1: Visi, Misi, Tujuan dan Strategi
-- =========================================================

CREATE TABLE kriteria_standars (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    instrumen_id BIGINT UNSIGNED NOT NULL,
    kode_kriteria VARCHAR(50) NOT NULL,
    nama_kriteria VARCHAR(50) NOT NULL,
    deskripsi TEXT NULL,
    urutan INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_kriteria_instrumen
        FOREIGN KEY (instrumen_id)
        REFERENCES instrumens(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT uq_kriteria_instrumen_kode
        UNIQUE (instrumen_id, kode_kriteria)
) ENGINE=InnoDB;

CREATE INDEX idx_kriteria_instrumen_id ON kriteria_standars(instrumen_id);
CREATE INDEX idx_kriteria_urutan ON kriteria_standars(urutan);

-- =========================================================
-- 9. KODE AMI
-- Satu kriteria bisa punya banyak kode AMI.
-- =========================================================

CREATE TABLE kode_amis (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kriteria_id BIGINT UNSIGNED NOT NULL,
    kode_ami VARCHAR(50) NOT NULL,
    urutan INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_kode_amis_kriteria
        FOREIGN KEY (kriteria_id)
        REFERENCES kriteria_standars(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT uq_kode_ami_per_kriteria
        UNIQUE (kriteria_id, kode_ami)
) ENGINE=InnoDB;

CREATE INDEX idx_kode_amis_kriteria_id ON kode_amis(kriteria_id);
CREATE INDEX idx_kode_amis_urutan ON kode_amis(urutan);

-- =========================================================
-- 10. JENJANG STANDAR
-- Untuk No. Butir Standar:
-- S2/Mgtr, STr, D3, dan bisa ditambah jenjang lain.
-- =========================================================

CREATE TABLE jenjang_standars (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kode_jenjang VARCHAR(10) NOT NULL UNIQUE,
    nama_jenjang VARCHAR(50) NOT NULL,
    urutan INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- 11. KODE AMI - BUTIR STANDAR
-- Relasi antara kode AMI dan nomor butir standar per jenjang.
--
-- Contoh:
-- kode_ami_id = 1
-- S2_MGTR = 1.1
-- STR     = 1.1
-- D3      = 1.1
-- =========================================================

CREATE TABLE kode_ami_butir_standars (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kode_ami_id BIGINT UNSIGNED NOT NULL,
    jenjang_id BIGINT UNSIGNED NOT NULL,
    no_butir VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_butir_standar_kode_ami
        FOREIGN KEY (kode_ami_id)
        REFERENCES kode_amis(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_butir_standar_jenjang
        FOREIGN KEY (jenjang_id)
        REFERENCES jenjang_standars(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_butir_standar_kode_jenjang
        UNIQUE (kode_ami_id, jenjang_id)
) ENGINE=InnoDB;

CREATE INDEX idx_butir_standar_kode_ami_id ON kode_ami_butir_standars(kode_ami_id);
CREATE INDEX idx_butir_standar_jenjang_id ON kode_ami_butir_standars(jenjang_id);

-- =========================================================
-- 12. DESKRIPSI AREA AUDIT
-- Satu kode AMI bisa punya banyak deskripsi area audit.
-- =========================================================

CREATE TABLE deskripsi_areas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kode_ami_id BIGINT UNSIGNED NOT NULL,
    deskripsi_area_audit TEXT NOT NULL,
    target_standar TEXT NULL,
    urutan INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_deskripsi_area_kode_ami
        FOREIGN KEY (kode_ami_id)
        REFERENCES kode_amis(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_deskripsi_area_kode_ami_id ON deskripsi_areas(kode_ami_id);
CREATE INDEX idx_deskripsi_area_urutan ON deskripsi_areas(urutan);

-- =========================================================
-- 13. PEMERIKSAAN PADA UNSUR
-- Satu deskripsi area bisa punya banyak row pemeriksaan.
-- Ini adalah level paling detail pada struktur instrumen.
-- =========================================================

CREATE TABLE pemeriksaan_unsurs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    deskripsi_area_id BIGINT UNSIGNED NOT NULL,
    isi_unsur TEXT NOT NULL,
    urutan INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_pemeriksaan_unsur_deskripsi_area
        FOREIGN KEY (deskripsi_area_id)
        REFERENCES deskripsi_areas(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_pemeriksaan_unsur_deskripsi_area_id ON pemeriksaan_unsurs(deskripsi_area_id);
CREATE INDEX idx_pemeriksaan_unsur_urutan ON pemeriksaan_unsurs(urutan);

-- =========================================================
-- 14. ISIAN AMI
-- Dosen mengisi berdasarkan pemeriksaan_unsur_id.
-- Bukan lagi berdasarkan butir_id lama.
-- =========================================================

CREATE TABLE isian_ami (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    pemeriksaan_unsur_id BIGINT UNSIGNED NOT NULL,
    periode_id BIGINT UNSIGNED NOT NULL,
    dosen_id BIGINT UNSIGNED NOT NULL,
    prodi_id BIGINT UNSIGNED NULL,

    judul_dokumen VARCHAR(100) NULL,

    ketersediaan_standar ENUM('ada', 'tidak_ada') NOT NULL DEFAULT 'tidak_ada',
    dokumen ENUM('ada', 'tidak_ada') NOT NULL DEFAULT 'tidak_ada',

    pencapaian_standar_spt_pt BOOLEAN NOT NULL DEFAULT FALSE,
    pencapaian_standar_sn_dikti BOOLEAN NOT NULL DEFAULT FALSE,

    daya_saing_lokal BOOLEAN NOT NULL DEFAULT FALSE,
    daya_saing_nasional BOOLEAN NOT NULL DEFAULT FALSE,
    daya_saing_internasional BOOLEAN NOT NULL DEFAULT FALSE,

    bukti_link VARCHAR(255) NULL,
    tahun_pelaksanaan CHAR(4) NULL,
    capaian TEXT NULL,
    keterangan TEXT NULL,

    status ENUM('proses', 'valid', 'revisi') NOT NULL DEFAULT 'proses',
    catatan_kaprodi TEXT NULL,

    reviewed_by BIGINT UNSIGNED NULL,
    reviewed_at TIMESTAMP NULL,

    attempt INT UNSIGNED NOT NULL DEFAULT 1,

    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_isian_pemeriksaan_unsur
        FOREIGN KEY (pemeriksaan_unsur_id)
        REFERENCES pemeriksaan_unsurs(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_isian_periode
        FOREIGN KEY (periode_id)
        REFERENCES periodes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_isian_dosen
        FOREIGN KEY (dosen_id)
        REFERENCES dosens(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_isian_prodi
        FOREIGN KEY (prodi_id)
        REFERENCES prodis(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_isian_reviewed_by
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_isian_attempt
        UNIQUE (pemeriksaan_unsur_id, periode_id, dosen_id, attempt),

    CONSTRAINT chk_tahun_pelaksanaan
        CHECK (
            tahun_pelaksanaan IS NULL
            OR tahun_pelaksanaan REGEXP '^[0-9]{4}$'
        )
) ENGINE=InnoDB;

CREATE INDEX idx_isian_pemeriksaan_unsur_id ON isian_ami(pemeriksaan_unsur_id);
CREATE INDEX idx_isian_periode_id ON isian_ami(periode_id);
CREATE INDEX idx_isian_dosen_id ON isian_ami(dosen_id);
CREATE INDEX idx_isian_prodi_id ON isian_ami(prodi_id);
CREATE INDEX idx_isian_status ON isian_ami(status);
CREATE INDEX idx_isian_reviewed_by ON isian_ami(reviewed_by);
CREATE INDEX idx_isian_submitted_at ON isian_ami(submitted_at);

-- =========================================================
-- 15. FILE BUKTI ISIAN
-- Dipisah supaya satu isian bisa punya banyak file.
-- Kalau hanya butuh satu file, tetap bisa simpan satu row.
-- =========================================================

CREATE TABLE isian_bukti_files (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    isian_id BIGINT UNSIGNED NOT NULL,

    original_name VARCHAR(50) NOT NULL,
    file_name VARCHAR(50) NOT NULL,
    file_path VARCHAR(100) NOT NULL,
    mime_type VARCHAR(50) NULL,
    file_size BIGINT UNSIGNED NULL,

    uploaded_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bukti_file_isian
        FOREIGN KEY (isian_id)
        REFERENCES isian_ami(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_bukti_file_uploaded_by
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_bukti_file_isian_id ON isian_bukti_files(isian_id);
CREATE INDEX idx_bukti_file_uploaded_by ON isian_bukti_files(uploaded_by);

-- =========================================================
-- 16. LOG REVIEW ISIAN
-- Menyimpan histori review kaprodi.
-- =========================================================

CREATE TABLE isian_review_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    isian_id BIGINT UNSIGNED NOT NULL,
    reviewer_id BIGINT UNSIGNED NULL,

    status_sebelum ENUM('proses', 'valid', 'revisi') NULL,
    status_sesudah ENUM('proses', 'valid', 'revisi') NOT NULL,

    catatan TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_log_isian
        FOREIGN KEY (isian_id)
        REFERENCES isian_ami(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_review_log_reviewer
        FOREIGN KEY (reviewer_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_review_log_isian_id ON isian_review_logs(isian_id);
CREATE INDEX idx_review_log_reviewer_id ON isian_review_logs(reviewer_id);
CREATE INDEX idx_review_log_status_sesudah ON isian_review_logs(status_sesudah);

-- =========================================================
-- 17. VIEW STRUKTUR INSTRUMEN FLAT
-- Untuk menampilkan bentuk seperti Excel.
-- =========================================================

CREATE OR REPLACE VIEW v_instrumen_structure_flat AS
SELECT
    i.id AS instrumen_id,
    i.nama_instrumen,
    i.deskripsi AS deskripsi_instrumen,
    i.is_active AS instrumen_is_active,

    p.id AS periode_id,
    p.tahun AS periode_tahun,

    ks.id AS kriteria_id,
    ks.kode_kriteria,
    ks.nama_kriteria,
    ks.deskripsi AS deskripsi_kriteria,
    ks.urutan AS urutan_kriteria,

    ka.id AS kode_ami_id,
    ka.kode_ami,
    ka.urutan AS urutan_kode_ami,

    MAX(CASE WHEN js.kode_jenjang = 'S2_MGTR' THEN kabs.no_butir END) AS no_butir_s2_mgtr,
    MAX(CASE WHEN js.kode_jenjang = 'STR' THEN kabs.no_butir END) AS no_butir_str,
    MAX(CASE WHEN js.kode_jenjang = 'D3' THEN kabs.no_butir END) AS no_butir_d3,

    da.id AS deskripsi_area_id,
    da.deskripsi_area_audit,
    da.target_standar,
    da.urutan AS urutan_deskripsi_area,

    pu.id AS pemeriksaan_unsur_id,
    pu.isi_unsur,
    pu.urutan AS urutan_pemeriksaan_unsur

FROM instrumens i
LEFT JOIN periodes p
    ON p.id = i.periode_id
LEFT JOIN kriteria_standars ks
    ON ks.instrumen_id = i.id
LEFT JOIN kode_amis ka
    ON ka.kriteria_id = ks.id
LEFT JOIN kode_ami_butir_standars kabs
    ON kabs.kode_ami_id = ka.id
LEFT JOIN jenjang_standars js
    ON js.id = kabs.jenjang_id
LEFT JOIN deskripsi_areas da
    ON da.kode_ami_id = ka.id
LEFT JOIN pemeriksaan_unsurs pu
    ON pu.deskripsi_area_id = da.id

GROUP BY
    i.id,
    i.nama_instrumen,
    i.deskripsi,
    i.is_active,
    p.id,
    p.tahun,
    ks.id,
    ks.kode_kriteria,
    ks.nama_kriteria,
    ks.deskripsi,
    ks.urutan,
    ka.id,
    ka.kode_ami,
    ka.urutan,
    da.id,
    da.deskripsi_area_audit,
    da.target_standar,
    da.urutan,
    pu.id,
    pu.isi_unsur,
    pu.urutan;

-- =========================================================
-- 18. VIEW DETAIL ISIAN AMI
-- Untuk kebutuhan kaprodi, dosen, dashboard, dan filter.
-- =========================================================

CREATE OR REPLACE VIEW v_isian_ami_detail AS
SELECT
    ia.id AS isian_id,
    ia.judul_dokumen,
    ia.status,
    ia.attempt,

    ia.ketersediaan_standar,
    ia.dokumen,
    ia.pencapaian_standar_spt_pt,
    ia.pencapaian_standar_sn_dikti,
    ia.daya_saing_lokal,
    ia.daya_saing_nasional,
    ia.daya_saing_internasional,

    ia.bukti_link,
    ia.tahun_pelaksanaan,
    ia.capaian,
    ia.keterangan,
    ia.catatan_kaprodi,
    ia.submitted_at,
    ia.reviewed_at,
    ia.created_at,
    ia.updated_at,

    d.id AS dosen_id,
    d.nip,
    d.nama_lengkap AS nama_dosen,

    pr.id AS prodi_id,
    pr.nama_prodi,
    pr.jenjang AS jenjang_prodi,

    pe.id AS periode_id,
    pe.tahun AS periode_tahun,

    pu.id AS pemeriksaan_unsur_id,
    pu.isi_unsur,
    pu.urutan AS urutan_pemeriksaan_unsur,

    da.id AS deskripsi_area_id,
    da.deskripsi_area_audit,
    da.target_standar,
    da.urutan AS urutan_deskripsi_area,

    ka.id AS kode_ami_id,
    ka.kode_ami,
    ka.urutan AS urutan_kode_ami,

    ks.id AS kriteria_id,
    ks.kode_kriteria,
    ks.nama_kriteria,
    ks.urutan AS urutan_kriteria,

    i.id AS instrumen_id,
    i.nama_instrumen

FROM isian_ami ia
JOIN dosens d
    ON d.id = ia.dosen_id
LEFT JOIN prodis pr
    ON pr.id = ia.prodi_id
JOIN periodes pe
    ON pe.id = ia.periode_id
JOIN pemeriksaan_unsurs pu
    ON pu.id = ia.pemeriksaan_unsur_id
JOIN deskripsi_areas da
    ON da.id = pu.deskripsi_area_id
JOIN kode_amis ka
    ON ka.id = da.kode_ami_id
JOIN kriteria_standars ks
    ON ks.id = ka.kriteria_id
JOIN instrumens i
    ON i.id = ks.instrumen_id;

-- =========================================================
-- 19. VIEW SUMMARY ISIAN PER PERIODE / PRODI / INSTRUMEN
-- =========================================================

CREATE OR REPLACE VIEW v_isian_ami_summary AS
SELECT
    ia.periode_id,
    pe.tahun AS periode_tahun,

    ia.prodi_id,
    pr.nama_prodi,

    i.id AS instrumen_id,
    i.nama_instrumen,

    COUNT(*) AS total_isian,

    SUM(CASE WHEN ia.status = 'proses' THEN 1 ELSE 0 END) AS total_proses,
    SUM(CASE WHEN ia.status = 'valid' THEN 1 ELSE 0 END) AS total_valid,
    SUM(CASE WHEN ia.status = 'revisi' THEN 1 ELSE 0 END) AS total_revisi,

    COUNT(DISTINCT ia.dosen_id) AS total_dosen

FROM isian_ami ia
JOIN periodes pe
    ON pe.id = ia.periode_id
LEFT JOIN prodis pr
    ON pr.id = ia.prodi_id
JOIN pemeriksaan_unsurs pu
    ON pu.id = ia.pemeriksaan_unsur_id
JOIN deskripsi_areas da
    ON da.id = pu.deskripsi_area_id
JOIN kode_amis ka
    ON ka.id = da.kode_ami_id
JOIN kriteria_standars ks
    ON ks.id = ka.kriteria_id
JOIN instrumens i
    ON i.id = ks.instrumen_id

GROUP BY
    ia.periode_id,
    pe.tahun,
    ia.prodi_id,
    pr.nama_prodi,
    i.id,
    i.nama_instrumen;

-- =========================================================
-- 20. TRIGGER OPSIONAL:
-- Jika satu periode diaktifkan, periode lain otomatis nonaktif.
-- =========================================================

DELIMITER $$

CREATE TRIGGER trg_periodes_only_one_active_insert
BEFORE INSERT ON periodes
FOR EACH ROW
BEGIN
    IF NEW.is_active = TRUE THEN
        UPDATE periodes SET is_active = FALSE;
    END IF;
END$$

CREATE TRIGGER trg_periodes_only_one_active_update
BEFORE UPDATE ON periodes
FOR EACH ROW
BEGIN
    IF NEW.is_active = TRUE THEN
        UPDATE periodes
        SET is_active = FALSE
        WHERE id <> OLD.id;
    END IF;
END$$

DELIMITER ;