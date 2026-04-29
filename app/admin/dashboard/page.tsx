import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import { Nav } from "@/components/Nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CalendarCheck, Clock } from "lucide-react";

const NAV_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/entrepreneurs", label: "Entrepreneurs" },
  { href: "/admin/groups", label: "Groups" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/matching", label: "Run Matching" },
];

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [
    { count: entrepreneurCount },
    { count: groupCount },
    { count: scheduledCount },
    { count: pendingCount },
  ] = await Promise.all([
    supabase.from("entrepreneurs").select("*", { count: "exact", head: true }),
    supabase.from("student_groups").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const kpis = [
    { label: "Entrepreneurs", value: entrepreneurCount ?? 0, icon: Building2, color: "text-indigo-600" },
    { label: "Student Groups", value: groupCount ?? 0, icon: Users, color: "text-indigo-600" },
    { label: "Scheduled", value: scheduledCount ?? 0, icon: CalendarCheck, color: "text-emerald-600" },
    { label: "Pending", value: pendingCount ?? 0, icon: Clock, color: "text-amber-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav role="admin" links={NAV_LINKS} />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-4xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {NAV_LINKS.slice(1).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 rounded-md text-sm bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  {link.label} →
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
