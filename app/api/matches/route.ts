import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/matches — list matches (optionally filtered)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entrepreneur_id = searchParams.get("entrepreneur_id");
  const student_group_id = searchParams.get("student_group_id");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase
    .from("matches")
    .select(`
      *,
      entrepreneurs (
        company_name,
        address,
        interview_mode,
        profiles ( full_name, email )
      ),
      student_groups (
        name,
        student_group_members (
          profiles ( full_name, email )
        )
      )
    `)
    .order("slot_start");

  if (entrepreneur_id) query = query.eq("entrepreneur_id", entrepreneur_id);
  if (student_group_id) query = query.eq("student_group_id", student_group_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/matches?id=xxx — update match status
export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admin can update
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { data, error } = await supabase
    .from("matches")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
