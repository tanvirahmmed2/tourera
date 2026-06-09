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
    await pool.query(`
      ALTER TABLE tour_websites
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'development' CHECK (status IN ('active', 'development', 'suspended'));
    `);
    console.log("Added status to tour_websites");
  } catch (err) {
    console.error("Migration Error:", err.message);
  } finally {
    pool.end();
  }
}

run();
