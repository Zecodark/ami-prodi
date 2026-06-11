import * as mariadb from 'mariadb';

async function main() {
  const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ami_prodi',
    connectionLimit: 1
  });

  try {
    const conn = await pool.getConnection();
    await conn.query(`
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
    console.log('Table created successfully via mariadb driver!');
    conn.release();
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    pool.end();
  }
}

main();
