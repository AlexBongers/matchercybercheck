import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import { Nav } from "@/components/Nav";
import { MatchCard } from "@/components/MatchCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users } from "lucide-react";

const NAV_LINKS = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/group", label: "My Group" },
  { href: "/student/availability", label: "Availability" },
];

export default async function StudentDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Find student's group
  const { data: membership } = await supabase
    .from("student_group_members")
    .select("group_id, student_groups ( id, name )")
    .eq("profile_id", user.id)
    .maybeSingle();

  const group = membership
    ? ((membership.student_groups as unknown) as { id: string; name: string } | null)
    : null;

  // Fetch matches for this group
  const { data: matches } = group
    ? await supabase
        .from("matches")
        .select(`
          *,
          entrepreneurs (
            company_name,
            address,
            interview_mode,
            profiles ( full_name )
          )
        `)
        .eq("student_group_id", group.id)
        .in("status", ["scheduled", "pending"])
        .order("slot_start")
    : { data: null };

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav role="student" links={NAV_LINKS} />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.full_name ?? "Student"}
          </h1>
          {group && <p className="text-muted-foreground">Group: {group.name}</p>}
        </div>

        {!group && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-6 text-center">
              <p className="text-amber-800 font-medium">You are not in a group yet.</p>
              <p className="text-amber-700 text-sm mt-1">
                Go to <a href="/student/group" className="underline">My Group</a> to create or join a group.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Upcoming interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-indigo-600">{matches?.length ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Group
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{group?.name ?? "—"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Upcoming Interviews</h2>
          {matches && matches.length > 0 ? (
            matches.map((m) => {
              const ent = m.entrepreneurs as {
                company_name: string;
                address: string | null;
                interview_mode: "on-site" | "online";
                profiles: { full_name: string } | null;
              } | null;
              return (
                <MatchCard
                  key={m.id}
                  entrepreneurName={ent?.profiles?.full_name ?? ""}
                  companyName={ent?.company_name}
                  groupName={group?.name}
                  slotStart={m.slot_start}
                  slotEnd={m.slot_end}
                  interviewMode={ent?.interview_mode ?? "online"}
                  status={m.status}
                  teamsLink={m.teams_link}
                  address={ent?.address}
                />
              );
            })
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No upcoming interviews yet. Make sure your group has added availability.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
