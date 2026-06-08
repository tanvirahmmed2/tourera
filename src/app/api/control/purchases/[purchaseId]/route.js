import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isManager } from '@/lib/middleware';

export async function PATCH(request, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const { status } = await request.json();
    const { purchaseId } = await params;
    await query("UPDATE ts_purchases SET status = $1 WHERE purchase_id = $2", [status, purchaseId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const { purchaseId } = await params;
    await query("DELETE FROM ts_purchases WHERE purchase_id = $1", [purchaseId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
