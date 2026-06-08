import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isManager } from '@/lib/middleware';

export async function POST(request, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });

    const { purchaseId } = await params;

    const res = await query("SELECT * FROM ts_purchases WHERE purchase_id = $1", [purchaseId]);
    if (res.rows.length === 0) return NextResponse.json({ success: false, message: 'Purchase not found' }, { status: 404 });
    const purchase = res.rows[0];

    if (purchase.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Only pending purchases can be declined.' }, { status: 400 });
    }

    await query("UPDATE ts_purchases SET status = 'cancelled' WHERE purchase_id = $1", [purchaseId]);

    return NextResponse.json({ success: true, message: 'Purchase declined successfully.' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
