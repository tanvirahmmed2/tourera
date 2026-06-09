import { query } from './src/lib/db.js';

async function main() {
  try {
    await query(`
      ALTER TABLE ts_users
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS verification_token TEXT,
        ADD COLUMN IF NOT EXISTS reset_password_token TEXT,
        ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
    `);
    console.log("Migration successful");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
