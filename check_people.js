const mariadb = require('mariadb');
async function run() {
  const pool = mariadb.createPool({ host: 'localhost', user: 'root', password: '', database: 'ami_prodi' });
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT 
        i.id as isian_id, 
        i.status, 
        i.dosen_id, 
        u.isi_unsur
      FROM isian_ami i
      JOIN pemeriksaan_unsurs u ON i.pemeriksaan_unsur_id = u.id
      WHERE u.isi_unsur LIKE '%people%'
    `);
    console.log(rows);
  } catch (err) { console.error(err); } finally {
    if (conn) conn.release();
    pool.end();
  }
}
run();
