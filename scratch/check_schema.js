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
    await pool.query(`ALTER TABLE ts_packages ADD COLUMN setup_fee NUMERIC(10,2) DEFAULT 0;`);
    console.log("Added setup_fee to ts_packages");
  } catch (e) {
    console.log("Error or already exists:", e.message);
  }
  pool.end();
}

run();
