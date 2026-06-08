import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query("SELECT * FROM ts_packages WHERE is_active = true ORDER BY monthly_price ASC");
    const featuresRes = await query(`
      SELECT pf.package_id, f.feature_id, f.key, f.name 
      FROM ts_package_features pf
      JOIN ts_features f ON pf.feature_id = f.feature_id
    `);
    
    const packages = res.rows.map(pkg => {
        return {
            ...pkg,
            features: featuresRes.rows.filter(f => f.package_id === pkg.package_id).map(f => ({ feature_id: f.feature_id, key: f.key, name: f.name }))
        };
    });

    return NextResponse.json({ success: true, data: { packages } });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
