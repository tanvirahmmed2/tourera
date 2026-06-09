import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const res = await query("SELECT user_id, email FROM ts_users WHERE email = $1", [email.toLowerCase().trim()]);
    
    // We always return success to prevent email enumeration
    if (res.rows.length === 0) {
      return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' }, { status: 200 });
    }

    const user = res.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set token and expiry (1 hour from now)
    await query(
      "UPDATE ts_users SET reset_password_token = $1, reset_password_expires = NOW() + INTERVAL '1 hour' WHERE user_id = $2",
      [resetToken, user.user_id]
    );

    // In a real app, send email here
    const resetLink = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log('--- Password Reset Email ---');
    console.log(`To: ${user.email}`);
    console.log(`Link: ${resetLink}`);
    console.log('----------------------------');

    return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
