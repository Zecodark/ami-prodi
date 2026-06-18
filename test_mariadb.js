const mariadb = require('mariadb');
async function run() {
  const pool = mariadb.createPool({
    host: 'localhost', 
    user: 'root', 
    password: '',
    database: 'ami_prodi'
  });
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT id, status, dosen_id, pemeriksaan_unsur_id FROM isian_ami");
    console.log(rows);
  } catch (err) {
    throw err;
  } finally {
    if (conn) conn.release();
    pool.end();
  }
}
run();
