const mariadb = require('mariadb');
async function run() {
  const pool = mariadb.createPool({ host: 'localhost', user: 'root', password: '', database: 'ami_prodi' });
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT * FROM dosens WHERE user_id = (SELECT id FROM users WHERE email LIKE '%kaprodi.ti%')
    `);
    console.log(rows);
  } catch (err) { console.error(err); } finally {
    if (conn) conn.release();
    pool.end();
  }
}
run();
