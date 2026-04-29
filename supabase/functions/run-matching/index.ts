// Supabase Edge Function: run-matching
// Deploy with: supabase functions deploy run-matching
//
// This function is invoked by the admin via POST /api/matching/run
// OR can be scheduled via a cron trigger.
//
// It runs the matching engine and sends email notifications via Resend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY")!;
  const fromEmail = Deno.env.get("FROM_EMAIL") ?? "noreply@cybercheck.nl";

  const supabase = createClient(supabaseUrl, serviceKey);
  const resend = new Resend(resendKey);

  try {
    // Fetch unbooked entrepreneur slots
    const { data: eSlots } = await supabase
      .from("availability_slots")
      .select("*, entrepreneurs(*, profiles(full_name, email))")
      .eq("owner_type", "entrepreneur")
      .eq("is_booked", false)
      .order("start_time");

    // Fetch unbooked student-group slots (FIFO by group creation)
    const { data: sSlots } = await supabase
      .from("availability_slots")
      .select("*, student_groups(id, name, created_at, student_group_members(profiles(full_name, email)))")
      .eq("owner_type", "student_group")
      .eq("is_booked", false)
      .order("start_time");

    const results: object[] = [];
    const usedEntrepreneurIds = new Set<string>();
    const usedGroupIds = new Set<string>();
    const bookedSlotIds: string[] = [];

    for (const eSlot of eSlots ?? []) {
      if (usedEntrepreneurIds.has(eSlot.owner_id)) continue;

      const sortedSSlots = [...(sSlots ?? [])].sort((a, b) =>
        (a.student_groups?.created_at ?? "").localeCompare(b.student_groups?.created_at ?? "")
      );

      for (const sSlot of sortedSSlots) {
        if (usedGroupIds.has(sSlot.owner_id)) continue;
        if (eSlot.start_time !== sSlot.start_time) continue;

        const { data: match } = await supabase
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

        if (!match) continue;

        bookedSlotIds.push(eSlot.id, sSlot.id);
        usedEntrepreneurIds.add(eSlot.owner_id);
        usedGroupIds.add(sSlot.owner_id);
        results.push(match);

        // --- Send emails ---
        const slotDate = new Date(eSlot.start_time).toLocaleString("nl-NL", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam",
        });

        const entrepreneurEmail = eSlot.entrepreneurs?.profiles?.email;
        const groupMembers: { full_name: string; email: string }[] =
          sSlot.student_groups?.student_group_members?.map(
            (m: { profiles: { full_name: string; email: string } }) => m.profiles
          ) ?? [];

        const subject = `Cybercheck — Interview scheduled: ${slotDate}`;
        const htmlBase = `
          <h2>Your cyber-security interview has been scheduled!</h2>
          <p><strong>Date &amp; Time:</strong> ${slotDate}</p>
          <p><strong>Mode:</strong> ${eSlot.entrepreneurs?.interview_mode === "online" ? "Online (Microsoft Teams)" : "On-site"}</p>
          <p>Please ensure both parties have confirmed the appointment.</p>
          <p>— Cybercheck Platform</p>
        `;

        const emailList: string[] = [];
        if (entrepreneurEmail) emailList.push(entrepreneurEmail);
        for (const member of groupMembers) {
          if (member.email) emailList.push(member.email);
        }

        for (const to of emailList) {
          await resend.emails.send({
            from: fromEmail,
            to,
            subject,
            html: htmlBase,
          });
        }

        break;
      }
    }

    // Batch-mark slots as booked
    if (bookedSlotIds.length > 0) {
      await supabase
        .from("availability_slots")
        .update({ is_booked: true })
        .in("id", bookedSlotIds);
    }

    return new Response(
      JSON.stringify({ matched: results.length, matches: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
