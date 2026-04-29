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

export default async function AdminEntrepreneursPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: entrepreneurs } = await supabase
    .from("entrepreneurs")
    .select(`
      id, company_name, kvk_number, interview_mode,
      profiles ( full_name, email, phone )
    `)
    .order("company_name");

  // Count availability slots and get match status per entrepreneur
  const entrepreneurIds = (entrepreneurs ?? []).map((e) => e.id);

  const { data: slotCounts } = await supabase
    .from("availability_slots")
    .select("owner_id")
    .eq("owner_type", "entrepreneur")
    .in("owner_id", entrepreneurIds);

  const { data: matchStatuses } = await supabase
    .from("matches")
    .select("entrepreneur_id, status")
    .in("entrepreneur_id", entrepreneurIds);

  const slotsMap: Record<string, number> = {};
  for (const s of slotCounts ?? []) {
    slotsMap[s.owner_id] = (slotsMap[s.owner_id] ?? 0) + 1;
  }

  const matchMap: Record<string, string> = {};
  for (const m of matchStatuses ?? []) {
    matchMap[m.entrepreneur_id] = m.status;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav role="admin" links={NAV_LINKS} />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Entrepreneurs ({entrepreneurs?.length ?? 0})
        </h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All registered entrepreneurs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Slots</TableHead>
                  <TableHead>Match status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(entrepreneurs ?? []).map((e) => {
                  const profile = (e.profiles as unknown) as { full_name: string; email: string; phone: string } | null;
                  const status = matchMap[e.id];
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{profile?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{e.company_name}</TableCell>
                      <TableCell className="capitalize">{e.interview_mode}</TableCell>
                      <TableCell>{slotsMap[e.id] ?? 0}</TableCell>
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
                {(entrepreneurs?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No entrepreneurs registered yet.
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
