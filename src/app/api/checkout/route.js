import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isLogin } from '@/lib/middleware';

export async function POST(request) {
  try {
    const auth = await isLogin();
    if (!auth.success) return NextResponse.json(auth, { status: 401 });

    const user = auth.data;

    const { packageId, requested_tenant_name, requested_tenant_slug, requested_custom_domain, transaction_id, duration_months = 1 } = await request.json();

    if (!packageId || !requested_tenant_name || !requested_tenant_slug || !transaction_id) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    // Check if the requested slug already exists
    const slugCheck = await query("SELECT tenant_id FROM ts_tenants WHERE slug = $1 LIMIT 1", [requested_tenant_slug.toLowerCase()]);
    if (slugCheck.rows.length > 0) {
      return NextResponse.json({ success: false, message: 'This workspace URL is already taken. Please choose another one.' }, { status: 400 });
    }

    // Get the package price
    const pkgRes = await query("SELECT monthly_price, setup_fee FROM ts_packages WHERE package_id = $1 LIMIT 1", [packageId]);
    if (pkgRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid package' }, { status: 400 });
    }
    
    const pkg = pkgRes.rows[0];
    const parsedDuration = parseInt(duration_months) || 1;
    const totalAmount = (Number(pkg.monthly_price) * parsedDuration) + Number(pkg.setup_fee || 0);

    // Create a pending purchase
    await query(
      `INSERT INTO ts_purchases 
       (user_id, package_id, amount, status, requested_tenant_name, requested_tenant_slug, requested_custom_domain, transaction_id, payment_method, duration_months) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [user.user_id, packageId, totalAmount, 'pending', requested_tenant_name, requested_tenant_slug.toLowerCase(), requested_custom_domain, transaction_id, 'bKash', parsedDuration]
    );

    return NextResponse.json({ success: true, message: 'Purchase request submitted' });

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
