"use client";

import { useState } from "react";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, CheckCircle2, XCircle } from "lucide-react";

const NAV_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/entrepreneurs", label: "Entrepreneurs" },
  { href: "/admin/groups", label: "Groups" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/matching", label: "Run Matching" },
];

interface RunResult {
  matched: number;
  matches: { id: string; slot_start: string; entrepreneur_id: string; student_group_id: string }[];
}

interface LogEntry {
  timestamp: string;
  result: RunResult | null;
  error: string | null;
}

export default function AdminMatchingPage() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);

  const handleRun = async () => {
    setRunning(true);
    const timestamp = new Date().toLocaleString("nl-NL");
    try {
      const res = await fetch("/api/matching/run", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setLog((prev) => [{ timestamp, result: data, error: null }, ...prev]);
      } else {
        setLog((prev) => [{ timestamp, result: null, error: data.error ?? "Unknown error" }, ...prev]);
      }
    } catch (err) {
      setLog((prev) => [
        { timestamp, result: null, error: err instanceof Error ? err.message : "Network error" },
        ...prev,
      ]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav role="admin" links={NAV_LINKS} />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matching Engine</h1>
          <p className="text-muted-foreground">
            Automatically match entrepreneurs with student groups based on overlapping availability.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Run matching engine</CardTitle>
            <CardDescription>
              The engine will scan all unbooked availability slots and create matches where
              an entrepreneur and a student group share the same 45-minute time slot.
              Each run will only match previously unmatched slots.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              onClick={handleRun}
              disabled={running}
              className="gap-2"
            >
              <Play className="h-5 w-5" />
              {running ? "Running…" : "Run Matching Engine"}
            </Button>
          </CardContent>
        </Card>

        {log.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Run log</h2>
            {log.map((entry, i) => (
              <Card key={i} className={entry.error ? "border-red-200" : "border-emerald-200"}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    {entry.error ? (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {entry.error
                            ? "Error"
                            : `${entry.result?.matched ?? 0} new match${(entry.result?.matched ?? 0) !== 1 ? "es" : ""} created`}
                        </p>
                        <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                      </div>
                      {entry.error && (
                        <p className="text-sm text-red-600">{entry.error}</p>
                      )}
                      {entry.result && entry.result.matched > 0 && (
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {entry.result.matches.map((m) => (
                            <li key={m.id}>
                              Match {m.id.slice(0, 8)}… at{" "}
                              {new Date(m.slot_start).toLocaleString("nl-NL")}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
