import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const supabase = await createClient();

  // Buscar admin con email y password hasheado
  const { data: admin, error } = await supabase.rpc("verify_admin", {
    p_email: email,
    p_password: password,
  });

  if (error || !admin) {
    return NextResponse.json(
      { error: "Credenciales incorrectas" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });

  // Cookie de sesión admin (httpOnly, 8 horas)
  response.cookies.set(
    "admin_session",
    JSON.stringify({
      id: admin.id,
      email: admin.email,
      name: admin.name,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8,
      path: "/",
      sameSite: "strict",
    },
  );

  return response;
}
