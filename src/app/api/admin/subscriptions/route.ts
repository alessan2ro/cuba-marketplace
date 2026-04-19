import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

async function verifyAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session) return null;
  try {
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}


export async function PATCH(req: NextRequest) {
  const admin = await verifyAdminSession();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { userId, action, months } = await req.json();
  const supabase = createAdminClient();

  let updateData: Record<string, string | boolean | null> = {};

  if (action === 'activate') {
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + (months || 1));
    updateData = {
      subscription_status: 'active',
      seller_account: true,
      subscription_start: start.toISOString(),
      subscription_end: end.toISOString(),
    };
  } else if (action === 'deny') {
    updateData = {
      subscription_status: 'inactive',
      seller_account: false,
    };
  } else if (action === 'deactivate') {
    updateData = {
      subscription_status: 'inactive',
      seller_account: false,
      subscription_start: null,
      subscription_end: null,
    };
  } else {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const admin = await verifyAdminSession();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      phone,
      seller_account,
      subscription_status,
      subscription_start,
      subscription_end
    `)
    .eq('role', 'seller');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });


  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  const emailMap = new Map(authUsers.users.map(u => [u.id, u.email]));

  const enriched = data.map(p => ({
    ...p,
    email: emailMap.get(p.id) || '',
  }));

  return NextResponse.json({ data: enriched });
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdminSession();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { userId } = await req.json();
  const supabase = createAdminClient();

  const { error } = await supabase.rpc('delete_user_admin', { user_id: userId });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}