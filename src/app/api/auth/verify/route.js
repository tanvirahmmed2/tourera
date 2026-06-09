import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Token is required' }, { status: 400 });
    }

    const res = await query("SELECT user_id FROM ts_users WHERE verification_token = $1", [token]);
    
    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid or expired verification token' }, { status: 400 });
    }

    const userId = res.rows[0].user_id;

    await query(
      "UPDATE ts_users SET is_verified = true, verification_token = NULL WHERE user_id = $1",
      [userId]
    );

    return NextResponse.json({ success: true, message: 'Account verified successfully' }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
