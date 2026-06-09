import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isManager } from '@/lib/middleware';

export async function PATCH(request, { params }) {
  try {
    const { packageId } = await params;
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    const body = await request.json();
    if (body.monthly_price !== undefined) {
      body.yearly_price = parseFloat(body.monthly_price) * 12;
    }
    
    let queryStr = "UPDATE ts_packages SET ";
    const values = [];
    let count = 1;
    
    const allowedFields = ['name', 'slug', 'description', 'monthly_price', 'yearly_price', 'setup_fee', 'max_tours', 'max_bookings_per_month', 'max_staff', 'is_active'];
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        queryStr += `${key} = $${count}, `;
        
        let val = body[key];
        if (['monthly_price', 'yearly_price', 'setup_fee', 'max_tours', 'max_bookings_per_month', 'max_staff'].includes(key) && val === '') {
          val = 0;
        }

        values.push(val);
        count++;
      }
    }
    
    if (values.length === 0) return NextResponse.json({ success: false, message: 'No updates provided' }, { status: 400 });
    
    queryStr = queryStr.slice(0, -2) + ` WHERE package_id = $${count}`;
    values.push(packageId);

    await query(queryStr, values);
    
    if (body.features !== undefined && Array.isArray(body.features)) {
      await query("DELETE FROM ts_package_features WHERE package_id = $1", [packageId]);
      for (const featureId of body.features) {
        if (featureId) {
          await query("INSERT INTO ts_package_features (package_id, feature_id) VALUES ($1, $2)", [packageId, featureId]);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { packageId } = await params;
    const auth = await isManager();
    if (!auth.success) return NextResponse.json(auth, { status: 403 });
    await query("DELETE FROM ts_packages WHERE package_id = $1", [packageId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
