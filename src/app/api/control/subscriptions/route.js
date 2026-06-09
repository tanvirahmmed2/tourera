import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isOwner } from '@/lib/middleware';

export async function GET() {
  try {
    const auth = await isOwner();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });

    const res = await query(`
      SELECT s.*, 
             t.name as tenant_name, t.slug as slug, 
             p.name as plan_name, p.monthly_price, p.yearly_price,
             s.end_date as current_period_end,
             CASE 
                WHEN s.end_date IS NOT NULL AND s.start_date IS NOT NULL AND EXTRACT(DAY FROM (s.end_date - s.start_date)) > 300 THEN 'yearly' 
                ELSE 'monthly' 
             END AS billing_cycle
      FROM ts_subscriptions s
      JOIN ts_tenants t ON t.tenant_id = s.tenant_id
      JOIN ts_packages p ON p.package_id = s.package_id
      ORDER BY s.created_at DESC
    `);
    return NextResponse.json({ success: true, data: { subscriptions: res.rows } });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
