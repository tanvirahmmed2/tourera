import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: 'Name, email, and message are required' }, { status: 400 });
    }

    await query(
      "INSERT INTO ts_contact (name, email, phone, message) VALUES ($1, $2, $3, $4)",
      [name, email, phone || null, message]
    );

    return NextResponse.json({ success: true, message: 'Message sent successfully. We will get back to you soon!' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to send message. Please try again later.' }, { status: 500 });
  }
}
