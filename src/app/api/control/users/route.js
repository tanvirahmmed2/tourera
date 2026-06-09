import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isOwner } from '@/lib/middleware';

export async function GET() {
  try {
    const auth = await isOwner();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const res = await query("SELECT user_id, name, email, phone, is_verified, role, created_at FROM ts_users ORDER BY created_at DESC");
    return NextResponse.json({ success: true, data: { users: res.rows } });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
