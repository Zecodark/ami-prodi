-- CreateTable
CREATE TABLE `roles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nama_role` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `role_id` BIGINT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jurusans` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nama_jurusan` VARCHAR(150) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prodis` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `jurusan_id` BIGINT NULL,
    `nama_prodi` VARCHAR(150) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dosens` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NULL,
    `prodi_id` BIGINT NULL,
    `nip` VARCHAR(30) NOT NULL,
    `nama_lengkap` VARCHAR(150) NOT NULL,
    `status_kepegawaian` VARCHAR(50) NOT NULL,
    `no_hp` VARCHAR(20) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `dosens_user_id_key`(`user_id`),
    UNIQUE INDEX `dosens_nip_key`(`nip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periode_amis` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tahun` VARCHAR(10) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instrumens` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `periode_id` BIGINT NULL,
    `nama_instrumen` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `butir_instrumens` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `instrumen_id` BIGINT NULL,
    `kode_butir` VARCHAR(20) NOT NULL,
    `deskripsi_area_audit` TEXT NOT NULL,
    `target_standar` TEXT NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `isians` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `butir_id` BIGINT NOT NULL,
    `dosen_id` BIGINT NOT NULL,
    `periode_id` BIGINT NOT NULL,
    `judul_dokumen` VARCHAR(255) NOT NULL,
    `attempt` INTEGER NOT NULL DEFAULT 1,
    `status_attempt` VARCHAR(50) NOT NULL DEFAULT 'submitted',
    `ketersediaan_standar` ENUM('ada', 'tidak_ada') NOT NULL DEFAULT 'tidak_ada',
    `dokumen` ENUM('ada', 'tidak_ada') NOT NULL DEFAULT 'tidak_ada',
    `pencapaian_standar_spt_pt` BOOLEAN NOT NULL DEFAULT false,
    `pencapaian_standar_sn_dikti` BOOLEAN NOT NULL DEFAULT false,
    `lokal` BOOLEAN NOT NULL DEFAULT false,
    `nasional` BOOLEAN NOT NULL DEFAULT false,
    `internasional` BOOLEAN NOT NULL DEFAULT false,
    `bukti_dokumen` VARCHAR(255) NULL,
    `bukti_link` VARCHAR(500) NULL,
    `tahun_pelaksanaan` VARCHAR(4) NOT NULL,
    `capaian` TEXT NULL,
    `keterangan` TEXT NULL,
    `status` ENUM('proses', 'valid', 'revisi') NOT NULL DEFAULT 'proses',
    `catatan_kaprodi` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prodis` ADD CONSTRAINT `prodis_jurusan_id_fkey` FOREIGN KEY (`jurusan_id`) REFERENCES `jurusans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosens` ADD CONSTRAINT `dosens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosens` ADD CONSTRAINT `dosens_prodi_id_fkey` FOREIGN KEY (`prodi_id`) REFERENCES `prodis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instrumens` ADD CONSTRAINT `instrumens_periode_id_fkey` FOREIGN KEY (`periode_id`) REFERENCES `periode_amis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `butir_instrumens` ADD CONSTRAINT `butir_instrumens_instrumen_id_fkey` FOREIGN KEY (`instrumen_id`) REFERENCES `instrumens`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isians` ADD CONSTRAINT `isians_butir_id_fkey` FOREIGN KEY (`butir_id`) REFERENCES `butir_instrumens`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isians` ADD CONSTRAINT `isians_dosen_id_fkey` FOREIGN KEY (`dosen_id`) REFERENCES `dosens`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `isians` ADD CONSTRAINT `isians_periode_id_fkey` FOREIGN KEY (`periode_id`) REFERENCES `periode_amis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
