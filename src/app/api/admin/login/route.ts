import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc('verify_admin', {
      p_email: email.toLowerCase().trim(),
      p_password: password,
    });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    const admin = data[0];

    const response = NextResponse.json({ ok: true });

    response.cookies.set('admin_session', JSON.stringify({
      id: admin.id,
      email: admin.email,
      name: admin.name,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
      path: '/',
      sameSite: 'strict',
    });

    return response;

  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}