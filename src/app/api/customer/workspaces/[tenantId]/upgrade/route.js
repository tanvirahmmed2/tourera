import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isLogin } from '@/lib/middleware';

export async function POST(request, { params }) {
  try {
    const auth = await isLogin();
    if (!auth.success) return NextResponse.json(auth, { status: 401 });

    const user = auth.data;
    const { tenantId } = await params;
    const { package_id, duration_months, transaction_id } = await request.json();

    if (!package_id || !duration_months) {
      return NextResponse.json({ success: false, message: 'Package ID and Duration are required' }, { status: 400 });
    }

    // Check ownership
    const purchaseCheck = await query("SELECT purchase_id FROM ts_purchases WHERE user_id = $1 AND tenant_id = $2 LIMIT 1", [user.user_id, tenantId]);
    if (purchaseCheck.rows.length === 0 && user.tenant_id !== Number(tenantId)) {
        return NextResponse.json({ success: false, message: 'Unauthorized access to this workspace.' }, { status: 403 });
    }

    // Get active subscription to calculate remaining value
    const subRes = await query(`
      SELECT s.end_date, pk.monthly_price as old_monthly_price, t.name as tenant_name, t.slug as tenant_slug, s.package_id as old_package_id
      FROM ts_subscriptions s
      JOIN ts_packages pk ON pk.package_id = s.package_id
      JOIN ts_tenants t ON t.tenant_id = s.tenant_id
      WHERE s.tenant_id = $1 AND s.status = 'active'
      ORDER BY s.subscription_id DESC LIMIT 1
    `, [tenantId]);

    if (subRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'No active subscription found to upgrade' }, { status: 400 });
    }

    const sub = subRes.rows[0];

    // Get new package details
    const newPkgRes = await query("SELECT monthly_price, name FROM ts_packages WHERE package_id = $1 AND is_active = true", [package_id]);
    if (newPkgRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid or inactive new package selected' }, { status: 400 });
    }
    const newPkg = newPkgRes.rows[0];

    // Calculate Remaining Value
    const remainingDays = Math.max(0, (new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
    const remainingValue = (Number(sub.old_monthly_price) / 30) * remainingDays;

    // Calculate New Cost
    const parsedDuration = parseInt(duration_months) || 1;
    const newCost = Number(newPkg.monthly_price) * parsedDuration;

    // Calculate Total Amount Payable
    const totalAmount = Math.max(0, newCost - remainingValue);

    if (totalAmount > 0 && !transaction_id) {
      return NextResponse.json({ success: false, message: 'Transaction ID is required for upgrades requiring payment' }, { status: 400 });
    }

    // Determine if it's an upgrade or downgrade for note purposes
    const changeType = Number(newPkg.monthly_price) >= Number(sub.old_monthly_price) ? 'Upgrade' : 'Downgrade';

    // Create pending purchase
    await query(
      `INSERT INTO ts_purchases 
       (user_id, tenant_id, package_id, amount, status, requested_tenant_name, requested_tenant_slug, transaction_id, payment_method, duration_months, note) 
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, 'bKash', $8, $9)`,
      [
        user.user_id, 
        tenantId, 
        package_id, 
        totalAmount, 
        sub.tenant_name, 
        sub.tenant_slug, 
        transaction_id || 'N/A', 
        parsedDuration, 
        `Package ${changeType} to ${newPkg.name}`
      ]
    );

    return NextResponse.json({ success: true, message: `${changeType} request submitted successfully.` });

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
