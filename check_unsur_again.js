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
        i.pemeriksaan_unsur_id,
        u.isi_unsur,
        d.nama_lengkap
      FROM isian_ami i
      JOIN pemeriksaan_unsurs u ON i.pemeriksaan_unsur_id = u.id
      JOIN dosens d ON i.dosen_id = d.id
      WHERE u.isi_unsur LIKE '%people planning%'
    `);
    console.log(rows);
  } catch (err) { console.error(err); } finally {
    if (conn) conn.release();
    pool.end();
  }
}
run();
