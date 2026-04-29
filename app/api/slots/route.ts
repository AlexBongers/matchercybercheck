import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/slots?owner_type=entrepreneur&owner_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner_type = searchParams.get("owner_type");
  const owner_id = searchParams.get("owner_id");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const query = supabase.from("availability_slots").select("*").order("start_time");
  if (owner_type) query.eq("owner_type", owner_type);
  if (owner_id) query.eq("owner_id", owner_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/slots — add a slot
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { owner_type, owner_id, start_time, end_time } = body;

  if (!owner_type || !owner_id || !start_time || !end_time) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("availability_slots")
    .insert({ owner_type, owner_id, start_time, end_time })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/slots?id=xxx — remove a slot
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("availability_slots")
    .delete()
    .eq("id", id)
    .eq("is_booked", false); // can't delete booked slots

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
