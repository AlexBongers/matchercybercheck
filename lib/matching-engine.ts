import { SupabaseClient } from "@supabase/supabase-js";

export interface MatchResult {
  id: string;
  entrepreneur_id: string;
  student_group_id: string;
  slot_start: string;
  slot_end: string;
  interview_mode: string;
  status: string;
}

export async function runMatchingEngine(
  supabase: SupabaseClient
): Promise<MatchResult[]> {
  // Fetch all unbooked entrepreneur slots ordered by time (FIFO)
  const { data: eSlots, error: eErr } = await supabase
    .from("availability_slots")
    .select("*, entrepreneurs(*)")
    .eq("owner_type", "entrepreneur")
    .eq("is_booked", false)
    .order("start_time");

  if (eErr) throw new Error(`Error fetching entrepreneur slots: ${eErr.message}`);

  // Fetch all unbooked student-group slots ordered by group creation date (FIFO tie-breaking)
  const { data: sSlots, error: sErr } = await supabase
    .from("availability_slots")
    .select("*, student_groups(*)")
    .eq("owner_type", "student_group")
    .eq("is_booked", false)
    .order("start_time");

  if (sErr) throw new Error(`Error fetching student slots: ${sErr.message}`);

  const results: MatchResult[] = [];
  const usedEntrepreneurIds = new Set<string>();
  const usedGroupIds = new Set<string>();
  const bookedSlotIds: string[] = [];

  for (const eSlot of eSlots ?? []) {
    if (usedEntrepreneurIds.has(eSlot.owner_id)) continue;

    for (const sSlot of (sSlots ?? []).sort((a, b) => {
      // FIFO: prefer the group created earliest
      const aCreated = a.student_groups?.created_at ?? "";
      const bCreated = b.student_groups?.created_at ?? "";
      return aCreated.localeCompare(bCreated);
    })) {
      if (usedGroupIds.has(sSlot.owner_id)) continue;
      if (eSlot.start_time !== sSlot.start_time) continue;

      // Found an overlap — create match
      const { data: match, error: mErr } = await supabase
        .from("matches")
        .insert({
          entrepreneur_id: eSlot.owner_id,
          student_group_id: sSlot.owner_id,
          slot_start: eSlot.start_time,
          slot_end: eSlot.end_time,
          interview_mode: eSlot.entrepreneurs?.interview_mode ?? "online",
          status: "scheduled",
        })
        .select()
        .single();

      if (mErr) continue;

      bookedSlotIds.push(eSlot.id, sSlot.id);
      usedEntrepreneurIds.add(eSlot.owner_id);
      usedGroupIds.add(sSlot.owner_id);
      results.push(match as MatchResult);
      break;
    }
  }

  // Mark all matched slots as booked in one batch
  if (bookedSlotIds.length > 0) {
    await supabase
      .from("availability_slots")
      .update({ is_booked: true })
      .in("id", bookedSlotIds);
  }

  return results;
}
