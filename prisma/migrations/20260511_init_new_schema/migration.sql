
CREATE TABLE `roles` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `nama_role` VARCHAR(10) NOT NULL,
    `deskripsi` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `roles_nama_role_key`(`nama_role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `users` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role_id` INT(10) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_id_idx`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `jurusans` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `nama_jurusan` VARCHAR(30) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `jurusans_nama_jurusan_key`(`nama_jurusan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `prodis` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `jurusan_id` INT(10) NULL,
    `nama_prodi` VARCHAR(50) NOT NULL,
    `jenjang` VARCHAR(20) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `prodis_jurusan_id_idx`(`jurusan_id`),
    UNIQUE INDEX `prodis_nama_prodi_jurusan_id_key`(`nama_prodi`, `jurusan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `dosens` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `user_id` INT(10) NULL,
    `prodi_id` INT(10) NULL,
    `nip` VARCHAR(20) NOT NULL,
    `nama_lengkap` VARCHAR(50) NOT NULL,
    `status_kepegawaian` VARCHAR(50) NOT NULL,
    `no_hp` VARCHAR(20) NULL,
    `alamat` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `dosens_user_id_key`(`user_id`),
    UNIQUE INDEX `dosens_nip_key`(`nip`),
    INDEX `dosens_prodi_id_idx`(`prodi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `periodes` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `tahun` VARCHAR(10) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `tanggal_mulai` DATE NULL,
    `tanggal_selesai` DATE NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `periodes_tahun_key`(`tahun`),
    INDEX `periodes_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `instrumens` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `periode_id` INT(10) NULL,
    `nama_instrumen` VARCHAR(50) NOT NULL,
    `deskripsi` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` INT(10) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `instrumens_periode_id_idx`(`periode_id`),
    INDEX `instrumens_is_active_idx`(`is_active`),
    INDEX `instrumens_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `kriteria_standars` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `instrumen_id` INT(10) NOT NULL,
    `kode_kriteria` VARCHAR(50) NOT NULL,
    `nama_kriteria` VARCHAR(50) NOT NULL,
    `deskripsi` TEXT NULL,
    `urutan` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `kriteria_standars_instrumen_id_idx`(`instrumen_id`),
    INDEX `kriteria_standars_urutan_idx`(`urutan`),
    UNIQUE INDEX `kriteria_standars_instrumen_id_kode_kriteria_key`(`instrumen_id`, `kode_kriteria`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `kode_amis` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `kriteria_id` INT(10) NOT NULL,
    `kode_ami` VARCHAR(50) NOT NULL,
    `urutan` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `kode_amis_kriteria_id_idx`(`kriteria_id`),
    INDEX `kode_amis_urutan_idx`(`urutan`),
    UNIQUE INDEX `kode_amis_kriteria_id_kode_ami_key`(`kriteria_id`, `kode_ami`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `jenjang_standars` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `kode_jenjang` VARCHAR(10) NOT NULL,
    `nama_jenjang` VARCHAR(50) NOT NULL,
    `urutan` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `jenjang_standars_kode_jenjang_key`(`kode_jenjang`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `kode_ami_butir_standars` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `kode_ami_id` INT(10) NOT NULL,
    `jenjang_id` INT(10) NOT NULL,
    `no_butir` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `kode_ami_butir_standars_kode_ami_id_idx`(`kode_ami_id`),
    INDEX `kode_ami_butir_standars_jenjang_id_idx`(`jenjang_id`),
    UNIQUE INDEX `kode_ami_butir_standars_kode_ami_id_jenjang_id_key`(`kode_ami_id`, `jenjang_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `deskripsi_areas` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `kode_ami_id` INT(10) NOT NULL,
    `deskripsi_area_audit` TEXT NOT NULL,
    `target_standar` TEXT NULL,
    `urutan` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `deskripsi_areas_kode_ami_id_idx`(`kode_ami_id`),
    INDEX `deskripsi_areas_urutan_idx`(`urutan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `pemeriksaan_unsurs` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `deskripsi_area_id` INT(10) NOT NULL,
    `isi_unsur` TEXT NOT NULL,
    `urutan` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `pemeriksaan_unsurs_deskripsi_area_id_idx`(`deskripsi_area_id`),
    INDEX `pemeriksaan_unsurs_urutan_idx`(`urutan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `isian_ami` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `pemeriksaan_unsur_id` INT(10) NOT NULL,
    `periode_id` INT(10) NOT NULL,
    `dosen_id` INT(10) NOT NULL,
    `prodi_id` INT(10) NULL,
    `judul_dokumen` VARCHAR(100) NULL,
    `ketersediaan_standar` ENUM('ada', 'tidak_ada') NOT NULL DEFAULT 'tidak_ada',
    `dokumen` ENUM('ada', 'tidak_ada') NOT NULL DEFAULT 'tidak_ada',
    `pencapaian_standar_spt_pt` BOOLEAN NOT NULL DEFAULT false,
    `pencapaian_standar_sn_dikti` BOOLEAN NOT NULL DEFAULT false,
    `daya_saing_lokal` BOOLEAN NOT NULL DEFAULT false,
    `daya_saing_nasional` BOOLEAN NOT NULL DEFAULT false,
    `daya_saing_internasional` BOOLEAN NOT NULL DEFAULT false,
    `bukti_link` VARCHAR(255) NULL,
    `tahun_pelaksanaan` CHAR(4) NULL,
    `capaian` TEXT NULL,
    `keterangan` TEXT NULL,
    `status` ENUM('draft', 'proses', 'valid', 'revisi') NOT NULL DEFAULT 'proses',
    `catatan_kaprodi` TEXT NULL,
    `reviewed_by` INT(10) NULL,
    `reviewed_at` TIMESTAMP(0) NULL,
    `attempt` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `submitted_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `isian_ami_pemeriksaan_unsur_id_idx`(`pemeriksaan_unsur_id`),
    INDEX `isian_ami_periode_id_idx`(`periode_id`),
    INDEX `isian_ami_dosen_id_idx`(`dosen_id`),
    INDEX `isian_ami_prodi_id_idx`(`prodi_id`),
    INDEX `isian_ami_status_idx`(`status`),
    INDEX `isian_ami_reviewed_by_idx`(`reviewed_by`),
    INDEX `isian_ami_submitted_at_idx`(`submitted_at`),
    UNIQUE INDEX `isian_ami_pemeriksaan_unsur_id_periode_id_dosen_id_attempt_key`(`pemeriksaan_unsur_id`, `periode_id`, `dosen_id`, `attempt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `isian_bukti_files` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `isian_id` INT(10) NOT NULL,
    `original_name` VARCHAR(50) NOT NULL,
    `file_name` VARCHAR(50) NOT NULL,
    `file_path` VARCHAR(100) NOT NULL,
    `mime_type` VARCHAR(50) NULL,
    `file_size` INT(10) NULL,
    `uploaded_by` INT(10) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `isian_bukti_files_isian_id_idx`(`isian_id`),
    INDEX `isian_bukti_files_uploaded_by_idx`(`uploaded_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `isian_review_logs` (
    `id` INT(10) NOT NULL AUTO_INCREMENT,
    `isian_id` INT(10) NOT NULL,
    `reviewer_id` INT(10) NULL,
    `status_sebelum` ENUM('draft', 'proses', 'valid', 'revisi') NULL,
    `status_sesudah` ENUM('draft', 'proses', 'valid', 'revisi') NOT NULL,
    `catatan` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `isian_review_logs_isian_id_idx`(`isian_id`),
    INDEX `isian_review_logs_reviewer_id_idx`(`reviewer_id`),
    INDEX `isian_review_logs_status_sesudah_idx`(`status_sesudah`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prodis` ADD CONSTRAINT `prodis_jurusan_id_fkey` FOREIGN KEY (`jurusan_id`) REFERENCES `jurusans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosens` ADD CONSTRAINT `dosens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosens` ADD CONSTRAINT `dosens_prodi_id_fkey` FOREIGN KEY (`prodi_id`) REFERENCES `prodis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instrumens` ADD CONSTRAINT `instrumens_periode_id_fkey` FOREIGN KEY (`periode_id`) REFERENCES `periodes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instrumens` ADD CONSTRAINT `instrumens_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kriteria_standars` ADD CONSTRAINT `kriteria_standars_instrumen_id_fkey` FOREIGN KEY (`instrumen_id`) REFERENCES `instrumens`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kode_amis` ADD CONSTRAINT `kode_amis_kriteria_id_fkey` FOREIGN KEY (`kriteria_id`) REFERENCES `kriteria_standars`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kode_ami_butir_standars` ADD CONSTRAINT `kode_ami_butir_standars_kode_ami_id_fkey` FOREIGN KEY (`kode_ami_id`) REFERENCES `kode_amis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kode_ami_butir_standars` ADD CONSTRAINT `kode_ami_butir_standars_jenjang_id_fkey` FOREIGN KEY (`jenjang_id`) REFERENCES `jenjang_standars`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deskripsi_areas` ADD CONSTRAINT `deskripsi_areas_kode_ami_id_fkey` FOREIGN KEY (`kode_ami_id`) REFERENCES `kode_amis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pemeriksaan_unsurs` ADD CONSTRAINT `pemeriksaan_unsurs_deskripsi_area_id_fkey` FOREIGN KEY (`deskripsi_area_id`) REFERENCES `deskripsi_areas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isian_ami` ADD CONSTRAINT `isian_ami_pemeriksaan_unsur_id_fkey` FOREIGN KEY (`pemeriksaan_unsur_id`) REFERENCES `pemeriksaan_unsurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isian_ami` ADD CONSTRAINT `isian_ami_periode_id_fkey` FOREIGN KEY (`periode_id`) REFERENCES `periodes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isian_ami` ADD CONSTRAINT `isian_ami_dosen_id_fkey` FOREIGN KEY (`dosen_id`) REFERENCES `dosens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isian_ami` ADD CONSTRAINT `isian_ami_prodi_id_fkey` FOREIGN KEY (`prodi_id`) REFERENCES `prodis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isian_ami` ADD CONSTRAINT `isian_ami_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isian_bukti_files` ADD CONSTRAINT `isian_bukti_files_isian_id_fkey` FOREIGN KEY (`isian_id`) REFERENCES `isian_ami`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isian_bukti_files` ADD CONSTRAINT `isian_bukti_files_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isian_review_logs` ADD CONSTRAINT `isian_review_logs_isian_id_fkey` FOREIGN KEY (`isian_id`) REFERENCES `isian_ami`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isian_review_logs` ADD CONSTRAINT `isian_review_logs_reviewer_id_fkey` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


