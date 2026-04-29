"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NAV_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/entrepreneurs", label: "Entrepreneurs" },
  { href: "/admin/groups", label: "Groups" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/matching", label: "Run Matching" },
];

interface Match {
  id: string;
  slot_start: string;
  slot_end: string;
  interview_mode: string;
  status: string;
  teams_link: string | null;
  entrepreneurs: {
    company_name: string;
    profiles: { full_name: string } | null;
  } | null;
  student_groups: {
    name: string;
  } | null;
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    const res = await fetch("/api/matches");
    const data = await res.json();
    setMatches(data);
    setLoading(false);
  };

  const handleStatusChange = async (matchId: string, status: string) => {
    setUpdating(matchId);
    await fetch(`/api/matches?id=${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadMatches();
    setUpdating(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav role="admin" links={NAV_LINKS} />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Matches ({matches.length})
        </h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All matches</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm py-4">Loading…</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entrepreneur</TableHead>
                    <TableHead>Student Group</TableHead>
                    <TableHead>Date &amp; Time</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((m) => {
                    const start = new Date(m.slot_start);
                    const dateStr = start.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
                    const timeStr = start.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <p className="font-medium">{m.entrepreneurs?.company_name}</p>
                          <p className="text-xs text-muted-foreground">{m.entrepreneurs?.profiles?.full_name}</p>
                        </TableCell>
                        <TableCell>{m.student_groups?.name}</TableCell>
                        <TableCell>
                          <p>{dateStr}</p>
                          <p className="text-xs text-muted-foreground">{timeStr}</p>
                        </TableCell>
                        <TableCell className="capitalize">{m.interview_mode}</TableCell>
                        <TableCell>
                          <StatusBadge status={m.status as "scheduled" | "completed" | "cancelled" | "pending"} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={m.status}
                              onValueChange={(v) => handleStatusChange(m.id, v)}
                              disabled={updating === m.id}
                            >
                              <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {matches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No matches yet. Run the matching engine to create matches.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
