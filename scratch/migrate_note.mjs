import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres.hhedhfauqdrkjmbwncst',
  password: 'tanvir483469',
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
});

async function run() {
  try {
    await pool.query('ALTER TABLE ts_purchases ADD COLUMN note TEXT;');
    console.log('Successfully added note column');
  } catch (err) {
    if (err.code === '42701') { // column already exists
      console.log('Column note already exists');
    } else {
      console.error(err);
    }
  } finally {
    await pool.end();
  }
}

run();
