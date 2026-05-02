CREATE TABLE `roles` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `nama_role` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `users` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `role_id` BIGINT,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `jurusans` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `nama_jurusan` VARCHAR(150) NOT NULL,
  `created_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `prodis` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `jurusan_id` BIGINT,
  `nama_prodi` VARCHAR(150) NOT NULL,
  `created_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `dosens` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT,
  `prodi_id` BIGINT,
  `nip` VARCHAR(30) UNIQUE NOT NULL,
  `nama_lengkap` VARCHAR(150) NOT NULL,
  `created_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `periode_amis` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `tahun` VARCHAR(10) NOT NULL,
  `is_active` BOOLEAN DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `instrumens` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `periode_id` BIGINT,
  `nama_instrumen` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `butir_instrumens` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `instrumen_id` BIGINT,
  `kode_butir` VARCHAR(20) NOT NULL,
  `deskripsi_area_audit` TEXT NOT NULL,
  `target_standar` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `isians` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `butir_id` BIGINT NOT NULL,
  `dosen_id` BIGINT NOT NULL,
  `periode_id` BIGINT NOT NULL,
  `judul_dokumen` VARCHAR(255) NOT NULL,
  `attempt` INT DEFAULT 1,
  `status_attempt` VARCHAR(50) DEFAULT 'submitted',
  `ketersediaan_standar` ENUM ('ada', 'tidak_ada') DEFAULT 'tidak_ada',
  `dokumen` ENUM ('ada', 'tidak_ada') DEFAULT 'tidak_ada',
  `pencapaian_standar_spt_pt` BOOLEAN DEFAULT 0,
  `pencapaian_standar_sn_dikti` BOOLEAN DEFAULT 0,
  `lokal` BOOLEAN DEFAULT 0,
  `nasional` BOOLEAN DEFAULT 0,
  `internasional` BOOLEAN DEFAULT 0,
  `bukti_dokumen` VARCHAR(255),
  `bukti_link` VARCHAR(500),
  `tahun_pelaksanaan` VARCHAR(4) NOT NULL,
  `capaian` TEXT,
  `keterangan` TEXT,
  `status` ENUM ('proses', 'valid', 'revisi') DEFAULT 'proses',
  `catatan_kaprodi` TEXT,
  `created_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

ALTER TABLE `users` ADD FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;

ALTER TABLE `prodis` ADD FOREIGN KEY (`jurusan_id`) REFERENCES `jurusans` (`id`) ON DELETE CASCADE;

ALTER TABLE `dosens` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `dosens` ADD FOREIGN KEY (`prodi_id`) REFERENCES `prodis` (`id`) ON DELETE SET NULL;

ALTER TABLE `instrumens` ADD FOREIGN KEY (`periode_id`) REFERENCES `periode_amis` (`id`) ON DELETE CASCADE;

ALTER TABLE `butir_instrumens` ADD FOREIGN KEY (`instrumen_id`) REFERENCES `instrumens` (`id`) ON DELETE CASCADE;

ALTER TABLE `isians` ADD FOREIGN KEY (`butir_id`) REFERENCES `butir_instrumens` (`id`) ON DELETE CASCADE;

ALTER TABLE `isians` ADD FOREIGN KEY (`dosen_id`) REFERENCES `dosens` (`id`) ON DELETE CASCADE;

ALTER TABLE `isians` ADD FOREIGN KEY (`periode_id`) REFERENCES `periode_amis` (`id`) ON DELETE CASCADE;
