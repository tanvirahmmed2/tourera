import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isManager } from '@/lib/middleware';

export async function GET(request, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const { tenantId } = await params;

    const [
      tenantRes,
      websiteRes,
      domainsRes,
      usersRes,
      subsRes,
      purchasesRes,
      invoicesRes
    ] = await Promise.all([
      query("SELECT * FROM ts_tenants WHERE tenant_id = $1", [tenantId]),
      query("SELECT * FROM tour_websites WHERE tenant_id = $1", [tenantId]),
      query("SELECT * FROM ts_domains WHERE tenant_id = $1", [tenantId]),
      query("SELECT user_id, name, email, role, created_at FROM ts_users WHERE tenant_id = $1", [tenantId]),
      query(`
        SELECT s.*, p.name as package_name, p.monthly_price, p.setup_fee 
        FROM ts_subscriptions s 
        LEFT JOIN ts_packages p ON s.package_id = p.package_id 
        WHERE s.tenant_id = $1 
        ORDER BY s.created_at DESC
      `, [tenantId]),
      query(`
        SELECT p.*, pkg.name as package_name 
        FROM ts_purchases p
        LEFT JOIN ts_packages pkg ON p.package_id = pkg.package_id
        WHERE p.tenant_id = $1 
        ORDER BY p.created_at DESC
      `, [tenantId]),
      query("SELECT * FROM ts_invoices WHERE tenant_id = $1 ORDER BY created_at DESC", [tenantId])
    ]);

    if(tenantRes.rows.length === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    
    const tenantData = {
      ...tenantRes.rows[0],
      website: websiteRes.rows[0] || null,
      domains: domainsRes.rows,
      users: usersRes.rows,
      subscriptions: subsRes.rows,
      purchases: purchasesRes.rows,
      invoices: invoicesRes.rows
    };

    return NextResponse.json({ success: true, data: { tenant: tenantData } });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const { status, name } = await request.json();
    await query("UPDATE ts_tenants SET status = COALESCE($1, status), name = COALESCE($2, name) WHERE tenant_id = $3", [status, name, params.tenantId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
