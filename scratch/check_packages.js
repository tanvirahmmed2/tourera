const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres.hhedhfauqdrkjmbwncst',
  password: 'tanvir483469',
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query('SELECT package_id, name FROM ts_packages');
    console.log("Packages:", res.rows);
  } catch (err) {
    console.error("Error:", err.message);
  }
  pool.end();
}

run();
