import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isManager } from '@/lib/middleware';

const slugify = (text) => text ? text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)+/g, '') : '';

export async function PATCH(request, { params }) {
  try {
    const { featureId } = await params;
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const { name } = await request.json();
    if (!name) return NextResponse.json({ success: false, message: 'Name required' }, { status: 400 });
    
    const key = slugify(name);
    
    const res = await query(
      "UPDATE ts_features SET name = $1, key = $2 WHERE feature_id = $3 RETURNING *",
      [name, key, featureId]
    );
    
    if (res.rowCount === 0) return NextResponse.json({ success: false, message: 'Feature not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { feature: res.rows[0] } });
  } catch (err) {
    if (err.code === '23505') {
      return NextResponse.json({ success: false, message: 'A feature with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { featureId } = await params;
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    
    await query("DELETE FROM ts_features WHERE feature_id = $1", [featureId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
