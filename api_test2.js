const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.hhedhfauqdrkjmbwncst:tanvir483469@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres' });
  await client.connect();
  const res = await client.query("SELECT user_id, role FROM ts_users LIMIT 5");
  console.log('Users:', res.rows);
  await client.end();
}

run();
