import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import { Nav } from "@/components/Nav";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const NAV_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/entrepreneurs", label: "Entrepreneurs" },
  { href: "/admin/groups", label: "Groups" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/matching", label: "Run Matching" },
];

export default async function AdminGroupsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: groups } = await supabase
    .from("student_groups")
    .select(`
      id, name, created_at,
      student_group_members (
        profiles ( full_name, email )
      )
    `)
    .order("created_at");

  const groupIds = (groups ?? []).map((g) => g.id);

  const { data: slotCounts } = await supabase
    .from("availability_slots")
    .select("owner_id")
    .eq("owner_type", "student_group")
    .in("owner_id", groupIds);

  const { data: matchStatuses } = await supabase
    .from("matches")
    .select("student_group_id, status")
    .in("student_group_id", groupIds);

  const slotsMap: Record<string, number> = {};
  for (const s of slotCounts ?? []) {
    slotsMap[s.owner_id] = (slotsMap[s.owner_id] ?? 0) + 1;
  }

  const matchMap: Record<string, string> = {};
  for (const m of matchStatuses ?? []) {
    matchMap[m.student_group_id] = m.status;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav role="admin" links={NAV_LINKS} />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Student Groups ({groups?.length ?? 0})
        </h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All student groups</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Slots</TableHead>
                  <TableHead>Match status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(groups ?? []).map((g) => {
                  const members = (g.student_group_members as unknown) as { profiles: { full_name: string; email: string } | null }[];
                  const status = matchMap[g.id];
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {members?.map((m, i) => (
                            <p key={i} className="text-xs text-muted-foreground">
                              {m.profiles?.full_name} ({m.profiles?.email})
                            </p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{slotsMap[g.id] ?? 0}</TableCell>
                      <TableCell>
                        {status ? (
                          <StatusBadge status={status as "scheduled" | "completed" | "cancelled" | "pending"} />
                        ) : (
                          <span className="text-xs text-muted-foreground">No match</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(groups?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No student groups yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
