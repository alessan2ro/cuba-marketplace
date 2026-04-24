import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

async function verifyAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session) return null;
  try { return JSON.parse(session.value); }
  catch { return null; }
}

export async function GET() {
  const admin = await verifyAdminSession();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, is_verified, seller_id, created_at, profiles(username)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdminSession();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { storeId, is_verified } = await req.json();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('stores')
    .update({ is_verified })
    .eq('id', storeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}