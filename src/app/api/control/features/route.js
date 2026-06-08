import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isManager } from '@/lib/middleware';

const slugify = (text) => text ? text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)+/g, '') : '';

export async function GET() {
  try {
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const res = await query("SELECT * FROM ts_features ORDER BY feature_id ASC");
    return NextResponse.json({ success: true, data: { features: res.rows } });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const { name } = await request.json();
    if (!name) return NextResponse.json({ success: false, message: 'Name required' }, { status: 400 });
    
    const key = slugify(name);
    
    const res = await query(
      "INSERT INTO ts_features (key, name) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name RETURNING *",
      [key, name]
    );
    return NextResponse.json({ success: true, data: { feature: res.rows[0] } });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
