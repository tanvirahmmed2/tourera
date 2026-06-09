import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, signToken, buildSessionCookie } from '@/lib/middleware';
import { BASE_DOMAIN } from '@/lib/secret';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password required' }, { status: 400 });
    }

    const userRes = await query("SELECT * FROM ts_users WHERE email = $1 LIMIT 1", [email.toLowerCase().trim()]);
    const user = userRes.rows.length > 0 ? userRes.rows[0] : null;

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    if (user.is_verified === false) {
      return NextResponse.json({ success: false, message: 'Please verify your email address before logging in' }, { status: 403 });
    }

    const tokenPayload = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = signToken(tokenPayload);
    const cookie = buildSessionCookie(token);

    const response = NextResponse.json({
      success: true,
      data: tokenPayload
    }, { status: 200 });

    response.headers.set('Set-Cookie', cookie);
    return response;
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
