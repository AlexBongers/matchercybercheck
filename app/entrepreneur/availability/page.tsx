"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Nav } from "@/components/Nav";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const NAV_LINKS = [
  { href: "/entrepreneur/dashboard", label: "Dashboard" },
  { href: "/entrepreneur/availability", label: "Availability" },
  { href: "/entrepreneur/profile", label: "Profile" },
];

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export default function EntrepreneurAvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [entrepreneurId, setEntrepreneurId] = useState<string | null>(null);
  const [interviewMode, setInterviewMode] = useState<"online" | "on-site">("online");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: entrepreneur } = await supabase
        .from("entrepreneurs")
        .select("id, interview_mode")
        .eq("profile_id", user.id)
        .single();

      if (!entrepreneur) return;
      setEntrepreneurId(entrepreneur.id);
      setInterviewMode(entrepreneur.interview_mode as "online" | "on-site");

      const { data } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("owner_type", "entrepreneur")
        .eq("owner_id", entrepreneur.id)
        .order("start_time");

      setSlots(data ?? []);
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModeChange = async (value: string) => {
    setInterviewMode(value as "online" | "on-site");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("entrepreneurs")
      .update({ interview_mode: value })
      .eq("profile_id", user.id);
  };

  const handleToggle = async (startTime: string, endTime: string, existingId?: string) => {
    if (!entrepreneurId) return;

    if (existingId) {
      // Remove slot
      await fetch(`/api/slots?id=${existingId}`, { method: "DELETE" });
      setSlots((prev) => prev.filter((s) => s.id !== existingId));
    } else {
      // Add slot
      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_type: "entrepreneur",
          owner_id: entrepreneurId,
          start_time: startTime,
          end_time: endTime,
        }),
      });
      const newSlot = await res.json();
      if (!newSlot.error) {
        setSlots((prev) => [...prev, newSlot]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav role="entrepreneur" links={NAV_LINKS} />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
          <p className="text-muted-foreground">
            Click on time slots to mark yourself as available for a 45-minute interview.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interview preference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs space-y-2">
              <Label>Interview mode</Label>
              <Select value={interviewMode} onValueChange={handleModeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online (Microsoft Teams)</SelectItem>
                  <SelectItem value="on-site">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly availability</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : (
              <AvailabilityGrid
                existingSlots={slots}
                onToggle={handleToggle}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
