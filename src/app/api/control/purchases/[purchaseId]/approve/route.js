import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { isManager } from '@/lib/middleware';

export async function POST(request, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });

    const { purchaseId } = await params;

    const res = await query("SELECT * FROM ts_purchases WHERE purchase_id = $1", [purchaseId]);
    if (res.rows.length === 0) return NextResponse.json({ success: false, message: 'Purchase not found' }, { status: 404 });
    const purchase = res.rows[0];

    if (purchase.status === 'paid') return NextResponse.json({ success: false, message: 'Already approved' }, { status: 400 });

    // Double check if slug is still available
    const slugCheck = await query("SELECT tenant_id FROM ts_tenants WHERE slug = $1 LIMIT 1", [purchase.requested_tenant_slug]);
    if (slugCheck.rows.length > 0) {
      return NextResponse.json({ success: false, message: 'Tenant slug is no longer available. Please resolve manually.' }, { status: 400 });
    }
    
    await withTransaction(async (client) => {
      // 1. Create Tenant
      const tenantRes = await client.query(
        "INSERT INTO ts_tenants (name, slug, status) VALUES ($1, $2, 'active') RETURNING *",
        [purchase.requested_tenant_name || 'New Tenant', purchase.requested_tenant_slug]
      );
      const newTenant = tenantRes.rows[0];

      // 1.5. Create Domain if provided
      if (purchase.requested_custom_domain) {
        await client.query(
          "INSERT INTO ts_domains (tenant_id, domain, is_primary, verified) VALUES ($1, $2, true, false)",
          [newTenant.tenant_id, purchase.requested_custom_domain]
        );
      }

      // 2. Create tour_website
      await client.query("INSERT INTO tour_websites (tenant_id, hero_title) VALUES ($1, $2)", [newTenant.tenant_id, purchase.requested_tenant_name]);

      // 3. Create Subscription
      const subRes = await client.query(
        `INSERT INTO ts_subscriptions (tenant_id, package_id, status, start_date, end_date) 
         VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '1 month' * $3) RETURNING *`,
        [newTenant.tenant_id, purchase.package_id, purchase.duration_months || 1]
      );
      
      // 4. Create Initial Subscription Payment Record
      await client.query(
        "INSERT INTO ts_subscription_payments (subscription_id, amount, provider, status, transaction_id, paid_at) VALUES ($1, $2, $3, 'success', $4, NOW())",
        [subRes.rows[0].subscription_id, purchase.amount, purchase.payment_method || 'manual', purchase.transaction_id]
      );

      // 5. Update user to owner and link tenant
      await client.query(
        "UPDATE ts_users SET role = 'owner', tenant_id = $1 WHERE user_id = $2",
        [newTenant.tenant_id, purchase.user_id]
      );

      // 6. Mark purchase as paid and link tenant
      await client.query(
        "UPDATE ts_purchases SET status = 'paid', tenant_id = $1 WHERE purchase_id = $2",
        [newTenant.tenant_id, purchaseId]
      );

      // 6.5. Generate Invoice
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
      await client.query(
        "INSERT INTO ts_invoices (tenant_id, subscription_id, invoice_number, amount, status, due_date) VALUES ($1, $2, $3, $4, 'paid', NOW())",
        [newTenant.tenant_id, subRes.rows[0].subscription_id, invoiceNumber, purchase.amount]
      );

      // 7. Create Onboarding Support Ticket
      await client.query(
        "INSERT INTO ts_support_tickets (tenant_id, subject, message, priority, status) VALUES ($1, $2, $3, 'high', 'open')",
        [
          newTenant.tenant_id, 
          'Welcome to Tourbin! Your Workspace is Active 🎉', 
          'Hello!\n\nYour purchase has been approved and your workspace has been successfully provisioned. We are thrilled to have you on board.\n\nIf you have any questions, need help setting up your custom domain, or need assistance configuring your tours, please reply directly to this ticket.\n\nBest,\nThe Tourbin Support Team'
        ]
      );
    });

    return NextResponse.json({ success: true, message: 'Approved successfully and tenant provisioned.' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
