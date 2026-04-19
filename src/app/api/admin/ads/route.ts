import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

async function verifyAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session) return null;
  try {
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}

export async function GET() {
  const admin = await verifyAdminSession();
  if (!admin)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .order("order_index");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession();
  if (!admin)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ads")
    .insert({
      image_url: body.image_url,
      description: body.description,
      target_url: body.target_url,
      is_active: body.is_active ?? true,
      order_index: body.order_index ?? 0,
    })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdminSession();
  if (!admin)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, ...updates } = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from("ads").update(updates).eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdminSession();
  if (!admin)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from("ads").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
