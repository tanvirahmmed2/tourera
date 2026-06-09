import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isManager } from '@/lib/middleware';

export async function PATCH(request, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const body = await request.json();
    
    let queryStr = "UPDATE ts_reviews SET ";
    const values = [];
    let count = 1;

    if (body.is_approved !== undefined) {
      queryStr += `is_approved = $${count}, `;
      values.push(body.is_approved);
      count++;
    }

    if (body.reply !== undefined) {
      queryStr += `reply = $${count}, `;
      values.push(body.reply);
      count++;
    }

    if (values.length === 0) return NextResponse.json({ success: false, message: 'No updates provided' }, { status: 400 });

    queryStr = queryStr.slice(0, -2) + ` WHERE review_id = $${count}`;
    values.push(params.reviewId);

    await query(queryStr, values);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    await query("DELETE FROM ts_reviews WHERE review_id = $1", [params.reviewId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
