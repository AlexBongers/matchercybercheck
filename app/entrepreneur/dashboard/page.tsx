import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import { Nav } from "@/components/Nav";
import { MatchCard } from "@/components/MatchCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Building2 } from "lucide-react";

const NAV_LINKS = [
  { href: "/entrepreneur/dashboard", label: "Dashboard" },
  { href: "/entrepreneur/availability", label: "Availability" },
  { href: "/entrepreneur/profile", label: "Profile" },
];

export default async function EntrepreneurDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: entrepreneur } = await supabase
    .from("entrepreneurs")
    .select("id, company_name, interview_mode, address")
    .eq("profile_id", user.id)
    .single();

  if (!entrepreneur) redirect("/entrepreneur/profile");

  const { data: matches } = await supabase
    .from("matches")
    .select(`
      *,
      student_groups ( name )
    `)
    .eq("entrepreneur_id", entrepreneur.id)
    .in("status", ["scheduled", "pending"])
    .order("slot_start");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav role="entrepreneur" links={NAV_LINKS} />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.full_name ?? "Entrepreneur"}
          </h1>
          <p className="text-muted-foreground">{entrepreneur.company_name}</p>
        </div>

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
                <Building2 className="h-4 w-4" /> Interview mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold capitalize">{entrepreneur.interview_mode}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Upcoming Interviews</h2>
          {matches && matches.length > 0 ? (
            matches.map((m) => (
              <MatchCard
                key={m.id}
                entrepreneurName={profile?.full_name ?? ""}
                companyName={entrepreneur.company_name}
                groupName={(m.student_groups as { name: string } | null)?.name}
                slotStart={m.slot_start}
                slotEnd={m.slot_end}
                interviewMode={m.interview_mode}
                status={m.status}
                teamsLink={m.teams_link}
                address={entrepreneur.address}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No upcoming interviews yet. Make sure you have added your availability.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
