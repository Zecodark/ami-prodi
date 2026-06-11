const { PrismaClient } = require('./app/generated/prisma/index.js');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating table password_reset_otps...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS password_reset_otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email VARCHAR(50) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP NULL,
        attempt_count INT UNSIGNED DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX (user_id),
        INDEX (email)
      );
    `);
    console.log('Table created successfully!');
  } catch (e) {
    console.error('Error creating table:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
