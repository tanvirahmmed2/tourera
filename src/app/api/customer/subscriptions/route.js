import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isLogin } from '@/lib/middleware';
import { BASE_URL } from '@/lib/secret';

export async function GET() {
  try {
    const auth = await isLogin();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const session = auth.data;

    const purchasesRes = await query(`
      SELECT p.purchase_id, p.status as purchase_status, p.created_at, p.amount, p.tenant_id,
             pk.name as plan_name,
             p.metadata->>'companyName' as requested_name,
             p.metadata->>'subdomain' as requested_slug,
             t.name as tenant_name,
             t.slug as tenant_slug,
             s.status as subscription_status,
             s.start_date,
             s.end_date
      FROM ts_purchases p
      JOIN ts_packages pk ON pk.package_id = p.package_id
      LEFT JOIN ts_tenants t ON p.tenant_id = t.tenant_id
      LEFT JOIN ts_subscriptions s ON s.tenant_id = p.tenant_id AND s.status = 'active'
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [session.user_id]);

    // We can also fetch active subscriptions here in the future if needed
    // For now, it just returns pending purchases

    return NextResponse.json({ 
      success: true, 
      data: { 
        purchases: purchasesRes.rows,
        baseUrl: BASE_URL
      } 
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
