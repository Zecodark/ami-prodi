const mariadb = require('mariadb');
async function run() {
  const pool = mariadb.createPool({ host: 'localhost', user: 'root', password: '', database: 'ami_prodi' });
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT u.id as user_id, u.email, u.role_name, d.id as dosen_id, d.prodi_id 
      FROM users u 
      LEFT JOIN dosens d ON u.id = d.user_id 
      WHERE u.role_name = 'kaprodi'
    `);
    console.log(rows);
  } catch (err) { console.error(err); } finally {
    if (conn) conn.release();
    pool.end();
  }
}
run();
