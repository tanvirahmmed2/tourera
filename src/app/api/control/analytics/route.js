import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isManager } from '@/lib/middleware';

export async function GET() {
  try {
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });

    const [
      activeTenantsRes,
      newTenantsRes,
      totalRevenueRes,
      revenue30dRes,
      tenantGrowthRes
    ] = await Promise.all([
      query("SELECT COUNT(*) FROM ts_tenants WHERE status = 'active'"),
      query("SELECT COUNT(*) FROM ts_tenants WHERE created_at >= NOW() - INTERVAL '30 days'"),
      query("SELECT COALESCE(SUM(amount), 0) as total FROM ts_subscription_payments WHERE status = 'success'"),
      query("SELECT COALESCE(SUM(amount), 0) as total FROM ts_subscription_payments WHERE status = 'success' AND created_at >= NOW() - INTERVAL '30 days'"),
      query(`
        SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count 
        FROM ts_tenants 
        WHERE created_at >= NOW() - INTERVAL '6 months' 
        GROUP BY month 
        ORDER BY month ASC
      `)
    ]);

    const metrics = {
      active_tenants: parseInt(activeTenantsRes.rows[0].count),
      new_tenants_30d: parseInt(newTenantsRes.rows[0].count),
      bookings_30d: 0,
      active_tours: 0,
      total_revenue: parseFloat(totalRevenueRes.rows[0].total),
      revenue_30d: parseFloat(revenue30dRes.rows[0].total),
    };

    return NextResponse.json({ 
      success: true, 
      data: { 
        metrics,
        tenantGrowth: tenantGrowthRes.rows
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
