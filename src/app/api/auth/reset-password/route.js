import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/middleware';

export async function POST(request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ success: false, message: 'Token and new password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const res = await query(
      "SELECT user_id FROM ts_users WHERE reset_password_token = $1 AND reset_password_expires > NOW()", 
      [token]
    );
    
    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid or expired reset token' }, { status: 400 });
    }

    const userId = res.rows[0].user_id;
    const hashed = await hashPassword(password);

    await query(
      "UPDATE ts_users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE user_id = $2",
      [hashed, userId]
    );

    return NextResponse.json({ success: true, message: 'Password has been reset successfully' }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
