import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isLogin } from '@/lib/middleware';
import { BASE_URL } from '@/lib/secret';

export async function GET(request, { params }) {
  try {
    const auth = await isLogin();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const { tenantId } = await params;
    const session = auth.data;

    // Verify ownership via ts_purchases
    const purchaseCheck = await query("SELECT purchase_id FROM ts_purchases WHERE user_id = $1 AND tenant_id = $2 LIMIT 1", [session.user_id, tenantId]);
    if (purchaseCheck.rows.length === 0 && session.tenant_id !== Number(tenantId)) {
        return NextResponse.json({ success: false, message: 'Unauthorized access to this workspace.' }, { status: 403 });
    }

    // 1. Fetch Tenant details
    const tenantRes = await query(`
      SELECT t.tenant_id, t.name, t.slug, t.status, t.created_at
      FROM ts_tenants t
      WHERE t.tenant_id = $1
    `, [tenantId]);

    if (tenantRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Workspace not found.' }, { status: 404 });
    }
    const tenant = tenantRes.rows[0];

    // 2. Fetch Website Configuration
    const websiteRes = await query(`
      SELECT website_id, hero_title, hero_subtitle, name, address, tagline, sociallink, email, phone, theme_color, logo_url
      FROM tour_websites
      WHERE tenant_id = $1
    `, [tenantId]);
    const website = websiteRes.rows[0] || null;

    // 3. Fetch Domains
    const domainsRes = await query(`
      SELECT domain_id, domain, is_primary, verified
      FROM ts_domains
      WHERE tenant_id = $1
      ORDER BY is_primary DESC, domain ASC
    `, [tenantId]);
    const domains = domainsRes.rows;

    // 4. Fetch Subscription
    const subRes = await query(`
      SELECT s.subscription_id, s.package_id, s.status, s.start_date, s.end_date, s.auto_renew, pk.name as plan_name, pk.monthly_price, pk.yearly_price
      FROM ts_subscriptions s
      JOIN ts_packages pk ON pk.package_id = s.package_id
      WHERE s.tenant_id = $1 AND s.status = 'active'
      ORDER BY s.subscription_id DESC
      LIMIT 1
    `, [tenantId]);
    const subscription = subRes.rows[0] || null;

    return NextResponse.json({ 
      success: true, 
      data: { 
        tenant,
        website,
        domains,
        subscription,
        baseUrl: BASE_URL
      } 
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await isLogin();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const { tenantId } = await params;
    const session = auth.data;

    // Verify ownership via ts_purchases
    const purchaseCheck = await query("SELECT purchase_id FROM ts_purchases WHERE user_id = $1 AND tenant_id = $2 LIMIT 1", [session.user_id, tenantId]);
    if (purchaseCheck.rows.length === 0 && session.tenant_id !== Number(tenantId)) {
        return NextResponse.json({ success: false, message: 'Unauthorized access to this workspace.' }, { status: 403 });
    }

    const body = await request.json();
    
    // Allowed fields for update in tour_websites
    const allowedFields = ['name', 'address', 'tagline', 'sociallink', 'email', 'phone', 'hero_title', 'hero_subtitle'];
    
    let queryStr = "UPDATE tour_websites SET ";
    const values = [];
    let count = 1;
    
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        queryStr += `${key} = $${count}, `;
        values.push(body[key]);
        count++;
      }
    }
    
    if (values.length === 0) {
      return NextResponse.json({ success: false, message: 'No updates provided' }, { status: 400 });
    }
    
    queryStr = queryStr.slice(0, -2) + ` WHERE tenant_id = $${count}`;
    values.push(tenantId);

    // If website record doesn't exist, we should theoretically INSERT instead, 
    // but the approval flow creates it, so it should exist. 
    // However, we can use an UPSERT (ON CONFLICT) just in case.
    // Wait, tour_websites has tenant_id as UNIQUE constraint, so we can't easily upsert dynamically with this query builder unless we do it explicitly.
    // Let's just do UPDATE. If rowCount is 0, we can do an INSERT.
    const updateRes = await query(queryStr, values);

    if (updateRes.rowCount === 0) {
       // Need to insert
       let insertFields = 'tenant_id, ';
       let insertValues = `$1, `;
       let insertParams = [tenantId];
       let vCount = 2;
       
       for (const key of allowedFields) {
         if (body[key] !== undefined) {
           insertFields += `${key}, `;
           insertValues += `$${vCount}, `;
           insertParams.push(body[key]);
           vCount++;
         }
       }
       insertFields = insertFields.slice(0, -2);
       insertValues = insertValues.slice(0, -2);
       
       await query(`INSERT INTO tour_websites (${insertFields}) VALUES (${insertValues})`, insertParams);
    }

    return NextResponse.json({ success: true, message: 'Website information updated successfully.' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
