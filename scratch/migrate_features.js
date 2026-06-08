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
    // 1. Create ts_features
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ts_features (
        feature_id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL
      );
    `);
    console.log("Created ts_features");

    // 2. Recreate ts_package_features with correct schema matching schema.psql
    await pool.query(`DROP TABLE IF EXISTS ts_package_features CASCADE;`);
    await pool.query(`
      CREATE TABLE ts_package_features (
        id SERIAL PRIMARY KEY,
        package_id INT REFERENCES ts_packages(package_id) ON DELETE CASCADE,
        feature_id INT REFERENCES ts_features(feature_id) ON DELETE CASCADE
      );
    `);
    console.log("Created ts_package_features");

    // 3. Drop legacy columns
    await pool.query(`
      ALTER TABLE ts_packages 
      DROP COLUMN IF EXISTS custom_domain,
      DROP COLUMN IF EXISTS analytics,
      DROP COLUMN IF EXISTS features;
    `);
    console.log("Dropped legacy columns");

    // 4. Seed default features
    await pool.query(`
      INSERT INTO ts_features (key, name) VALUES 
      ('custom_domain', 'Custom Domain'),
      ('analytics', 'Advanced Analytics'),
      ('priority_support', 'Priority Support'),
      ('api_access', 'API Access')
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log("Seeded features");

  } catch (e) {
    console.log("Migration Error:", e.message);
  } finally {
    pool.end();
  }
}

run();
