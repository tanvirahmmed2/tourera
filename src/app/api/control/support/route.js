import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isSupport } from '@/lib/middleware';

export async function GET(request) {
  try {
    const auth = await isSupport();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');

    if (ticketId) {
        const [ticketRes, repliesRes] = await Promise.all([
            query("SELECT * FROM ts_support_tickets WHERE ticket_id = $1", [ticketId]),
            query("SELECT * FROM ts_support_replies WHERE ticket_id = $1 ORDER BY created_at ASC", [ticketId])
        ]);
        if (ticketRes.rows.length === 0) return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: { ticket: ticketRes.rows[0], replies: repliesRes.rows } });
    }

    const res = await query(`
      SELECT 
        t.*, 
        ten.name as tenant_name,
        (SELECT COUNT(*) FROM ts_support_replies r WHERE r.ticket_id = t.ticket_id) as reply_count
      FROM ts_support_tickets t 
      LEFT JOIN ts_tenants ten ON ten.tenant_id = t.tenant_id 
      ORDER BY t.created_at DESC
    `);
    return NextResponse.json({ success: true, data: { tickets: res.rows } });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await isSupport();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const { ticket_id, message } = await request.json();
    if (!ticket_id || !message) return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });

    await query(
      "INSERT INTO ts_support_replies (ticket_id, user_id, is_admin, message) VALUES ($1, $2, true, $3)",
      [ticket_id, auth.data.user_id, message]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await isSupport();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const { ticket_id, status } = await request.json();
    if (!ticket_id || !status) return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });

    await query("UPDATE ts_support_tickets SET status = $1, updated_at = NOW() WHERE ticket_id = $2", [status, ticket_id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
