const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres.hhedhfauqdrkjmbwncst',
  password: 'tanvir483469',
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const slugify = (text) => text ? text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)+/g, '') : '';

const features = [
  "Multi-User Management",
  "Customer CRM",
  "Invoice Generation",
  "bKash Integration",
  "Nagad Integration",
  "SSLCommerz Integration",
  "Discount & Coupon System",
  "Tour Availability Calendar",
  "Email Marketing Tools",
  "Financial Reports",
  "Lead Management",
  "Multi-Branch Management",
  "Agent & Partner Portal",
  "White Label Branding",
  "Multi-Vendor Marketplace",
  "Mobile App Integration",
  "AI Chat Assistant",
  "Automated Workflows",
  "Subscription Billing",
  "Dedicated Account Manager",
  "Custom Integrations",
  "Custom Booking System",
  "Custom Admin Dashboard",
  "Customer Management",
  "Payment Gateway Integration",
  "Tour Management System",
  "SEO Optimization",
  "Blog & Content Management",
  "Analytics Dashboard",
  "Custom Reports",
  "Domain & Hosting Setup",
  "Staff Training",
  "Multi-Tenant Architecture",
  "Franchise Management",
  "Agent Network System",
  "Vendor Management",
  "Hotel & Transport Management",
  "ERP Integration",
  "Accounting Integration",
  "API Development",
  "Dedicated Development Team"
];

async function run() {
  try {
    for (const name of features) {
      const key = slugify(name);
      await pool.query(
        "INSERT INTO ts_features (key, name) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
        [key, name]
      );
      console.log(`Added: ${name}`);
    }
    console.log("All features seeded successfully.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}

run();
