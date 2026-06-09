import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isLogin } from '@/lib/middleware';
import { BASE_URL } from '@/lib/secret';

export async function GET() {
  try {
    const auth = await isLogin();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const session = auth.data;

    const workspacesRes = await query(`
      SELECT t.tenant_id, t.name AS tenant_name, t.slug, t.status, t.created_at,
             pk.package_id, pk.name AS plan_name, pk.max_tours, pk.max_bookings_per_month,
             s.status AS subscription_status,
             (SELECT domain FROM ts_domains WHERE tenant_id = t.tenant_id AND is_primary = true LIMIT 1) as primary_domain
      FROM ts_tenants t
      LEFT JOIN ts_subscriptions s ON s.tenant_id = t.tenant_id AND s.status = 'active'
      LEFT JOIN ts_packages pk ON pk.package_id = s.package_id
      WHERE t.tenant_id IN (SELECT tenant_id FROM ts_purchases WHERE user_id = $1 AND tenant_id IS NOT NULL)
      ORDER BY t.created_at DESC
    `, [session.user_id]);

    return NextResponse.json({ 
      success: true, 
      data: { 
        workspaces: workspacesRes.rows,
        baseUrl: BASE_URL
      } 
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
