import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isLogin } from '@/lib/middleware';

export async function POST(request, { params }) {
  try {
    const auth = await isLogin();
    if (!auth.success) return NextResponse.json(auth, { status: 401 });

    const user = auth.data;
    const { tenantId } = await params;
    const { duration_months, transaction_id } = await request.json();

    if (!duration_months || !transaction_id) {
      return NextResponse.json({ success: false, message: 'Duration and TrxID are required' }, { status: 400 });
    }

    // Check ownership
    const purchaseCheck = await query("SELECT purchase_id FROM ts_purchases WHERE user_id = $1 AND tenant_id = $2 LIMIT 1", [user.user_id, tenantId]);
    if (purchaseCheck.rows.length === 0 && user.tenant_id !== Number(tenantId)) {
        return NextResponse.json({ success: false, message: 'Unauthorized access to this workspace.' }, { status: 403 });
    }

    // Get active subscription to find package_id
    const subRes = await query(`
      SELECT s.package_id, pk.monthly_price, t.name as tenant_name, t.slug as tenant_slug
      FROM ts_subscriptions s
      JOIN ts_packages pk ON pk.package_id = s.package_id
      JOIN ts_tenants t ON t.tenant_id = s.tenant_id
      WHERE s.tenant_id = $1 AND s.status = 'active'
      ORDER BY s.subscription_id DESC LIMIT 1
    `, [tenantId]);

    if (subRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'No active subscription found to renew' }, { status: 400 });
    }

    const { package_id, monthly_price, tenant_name, tenant_slug } = subRes.rows[0];
    const parsedDuration = parseInt(duration_months) || 1;
    const totalAmount = Number(monthly_price) * parsedDuration;

    // Create pending renewal purchase
    await query(
      `INSERT INTO ts_purchases 
       (user_id, tenant_id, package_id, amount, status, requested_tenant_name, requested_tenant_slug, transaction_id, payment_method, duration_months, note) 
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, 'bKash', $8, $9)`,
      [user.user_id, tenantId, package_id, totalAmount, tenant_name, tenant_slug, transaction_id, parsedDuration, 'Subscription Renewal']
    );

    return NextResponse.json({ success: true, message: 'Renewal request submitted successfully.' });

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
