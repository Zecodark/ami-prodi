const mariadb = require('mariadb');
async function run() {
  const pool = mariadb.createPool({ host: 'localhost', user: 'root', password: '', database: 'ami_prodi' });
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT * FROM isian_review_logs WHERE isian_id IN (131, 150)
    `);
    console.log(rows);
  } catch (err) { console.error(err); } finally {
    if (conn) conn.release();
    pool.end();
  }
}
run();
