import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isSupport } from '@/lib/middleware';
import { sendEmail } from '@/lib/brevo';

export async function GET(request) {
  try {
    const auth = await isSupport();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (contactId) {
        const res = await query("SELECT * FROM ts_contact WHERE contact_id = $1", [contactId]);
        if (res.rows.length === 0) return NextResponse.json({ success: false, message: 'Message not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: { contact: res.rows[0] } });
    }

    const res = await query("SELECT * FROM ts_contact ORDER BY created_at DESC");
    return NextResponse.json({ success: true, data: { contacts: res.rows } });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await isSupport();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const { contact_id, reply_message } = await request.json();
    if (!contact_id || !reply_message) return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });

    const contactRes = await query("SELECT * FROM ts_contact WHERE contact_id = $1", [contact_id]);
    if (contactRes.rows.length === 0) return NextResponse.json({ success: false, message: 'Message not found' }, { status: 404 });

    const contact = contactRes.rows[0];

    // Mark as resolved
    await query("UPDATE ts_contact SET status = 'resolved' WHERE contact_id = $1", [contact_id]);

    // Send email using Brevo
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #6366f1;">Reply to your inquiry</h2>
        <p>Hello ${contact.name},</p>
        <p>${reply_message.replace(/\n/g, '<br>')}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <div style="font-size: 12px; color: #888;">
          <p><strong>Your original message:</strong></p>
          <blockquote style="border-left: 3px solid #ccc; margin: 0; padding-left: 10px; color: #555;">
            ${contact.message.replace(/\n/g, '<br>')}
          </blockquote>
        </div>
      </div>
    `;

    await sendEmail({
      to: contact.email,
      subject: `Re: ${contact.message.substring(0, 30)}...`,
      htmlContent: emailHtml,
    });

    return NextResponse.json({ success: true, message: 'Reply sent successfully' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await isSupport();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const { contact_id, status } = await request.json();
    if (!contact_id || !status) return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });

    await query("UPDATE ts_contact SET status = $1 WHERE contact_id = $2", [status, contact_id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
