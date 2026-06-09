const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.hhedhfauqdrkjmbwncst:tanvir483469@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres' });
  await client.connect();
  const res = await client.query("SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count FROM ts_tenants WHERE created_at >= NOW() - INTERVAL '6 months' GROUP BY month ORDER BY month ASC");
  console.log(res.rows);
  const rev = await client.query("SELECT COALESCE(SUM(amount), 0) as total FROM ts_subscription_payments WHERE status = 'success'");
  console.log(rev.rows);
  await client.end();
}

run();
