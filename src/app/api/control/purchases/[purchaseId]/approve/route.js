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

    // If it's a renewal (tenant_id is already set), handle differently
    if (purchase.tenant_id) {
      await withTransaction(async (client) => {
        // 1. Fetch active subscription
        const subRes = await client.query(
          `SELECT s.subscription_id, s.end_date, s.package_id, p.monthly_price 
           FROM ts_subscriptions s
           JOIN ts_packages p ON p.package_id = s.package_id
           WHERE s.tenant_id = $1 AND s.status = 'active' ORDER BY s.subscription_id DESC LIMIT 1`,
          [purchase.tenant_id]
        );

        if (subRes.rows.length === 0) {
          throw new Error('No active subscription found to renew or upgrade');
        }

        const subscription = subRes.rows[0];

        // 2. Calculate remaining credit value
        const remainingDays = Math.max(0, (new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        const remainingValue = (Number(subscription.monthly_price) / 30) * remainingDays;

        // 3. Get new package price
        const newPkgRes = await client.query("SELECT monthly_price FROM ts_packages WHERE package_id = $1", [purchase.package_id]);
        const newPackagePrice = Number(newPkgRes.rows[0].monthly_price);

        // 4. Calculate total value applied (Amount Paid + Remaining Credit)
        const totalValueApplied = Number(purchase.amount) + remainingValue;

        // 5. Calculate new duration days based on total value and new package price
        // (If newPackagePrice is 0, just give them some default, though we shouldn't have free packages like this)
        const newDays = newPackagePrice > 0 ? (totalValueApplied / newPackagePrice) * 30 : 365;

        // 6. Update subscription with new end_date starting from TODAY and new package_id
        const updatedSubRes = await client.query(
          `UPDATE ts_subscriptions 
           SET end_date = NOW() + INTERVAL '1 day' * $1,
               package_id = $2
           WHERE subscription_id = $3 RETURNING *`,
          [newDays, purchase.package_id, subscription.subscription_id]
        );

        // 7. Create Subscription Payment Record
        await client.query(
          "INSERT INTO ts_subscription_payments (subscription_id, amount, provider, status, transaction_id, paid_at) VALUES ($1, $2, $3, 'success', $4, NOW())",
          [subscription.subscription_id, purchase.amount, purchase.payment_method || 'manual', purchase.transaction_id]
        );

        // 8. Mark purchase as paid
        await client.query(
          "UPDATE ts_purchases SET status = 'paid' WHERE purchase_id = $1",
          [purchaseId]
        );

        // 9. Generate Invoice
        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
        await client.query(
          "INSERT INTO ts_invoices (tenant_id, subscription_id, invoice_number, amount, status, due_date) VALUES ($1, $2, $3, $4, 'paid', NOW())",
          [purchase.tenant_id, subscription.subscription_id, invoiceNumber, purchase.amount]
        );
      });

      return NextResponse.json({ success: true, message: 'Renewal/Upgrade approved and subscription updated.' });
    }

    // New workspace approval logic
    const requestedTenantSlug = purchase.requested_tenant_slug || purchase.metadata?.subdomain;
    const requestedTenantName = purchase.requested_tenant_name || purchase.metadata?.companyName;
    const tenantAdminEmail = purchase.metadata?.tenantAdminEmail;

    if (!requestedTenantSlug) {
      return NextResponse.json({ success: false, message: 'Invalid purchase details (missing subdomain).' }, { status: 400 });
    }

    // Double check if slug is still available
    const slugCheck = await query("SELECT tenant_id FROM ts_tenants WHERE slug = $1 LIMIT 1", [requestedTenantSlug]);
    if (slugCheck.rows.length > 0) {
      return NextResponse.json({ success: false, message: 'Tenant slug is no longer available. Please resolve manually.' }, { status: 400 });
    }
    
    await withTransaction(async (client) => {
      // 1. Create Tenant
      const tenantRes = await client.query(
        "INSERT INTO ts_tenants (name, slug, status) VALUES ($1, $2, 'active') RETURNING *",
        [requestedTenantName || 'New Tenant', requestedTenantSlug]
      );
      const newTenant = tenantRes.rows[0];

      // 1.5. Create Domains
      // First, create the default .disibin.com domain
      const defaultDomain = `${requestedTenantSlug}.disibin.com`;
      await client.query(
        "INSERT INTO ts_domains (tenant_id, domain, is_primary, verified) VALUES ($1, $2, true, true)",
        [newTenant.tenant_id, defaultDomain]
      );

      // We will make the default domain primary.
      // Custom domains are no longer added automatically, managers will add them manually later.

      // 2. Create tour_website
      await client.query(
        "INSERT INTO tour_websites (tenant_id, hero_title, name, email) VALUES ($1, $2, $3, $4)", 
        [newTenant.tenant_id, requestedTenantName, requestedTenantName, tenantAdminEmail]
      );

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
