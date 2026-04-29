"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Nav } from "@/components/Nav";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NAV_LINKS = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/group", label: "My Group" },
  { href: "/student/availability", label: "Availability" },
];

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export default function StudentAvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noGroup, setNoGroup] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("student_group_members")
        .select("group_id")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!membership) {
        setNoGroup(true);
        setLoading(false);
        return;
      }

      const gid = membership.group_id;
      setGroupId(gid);

      const { data } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("owner_type", "student_group")
        .eq("owner_id", gid)
        .order("start_time");

      setSlots(data ?? []);
      setLoading(false);
    })();
  }, []);

  const handleToggle = async (startTime: string, endTime: string, existingId?: string) => {
    if (!groupId) return;

    if (existingId) {
      await fetch(`/api/slots?id=${existingId}`, { method: "DELETE" });
      setSlots((prev) => prev.filter((s) => s.id !== existingId));
    } else {
      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_type: "student_group",
          owner_id: groupId,
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
      <Nav role="student" links={NAV_LINKS} />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Group Availability</h1>
          <p className="text-muted-foreground">
            Slots you mark here apply to the entire group. All members can edit availability.
          </p>
        </div>

        {noGroup ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-8 text-center">
              <p className="text-amber-800 font-medium">You need to be in a group first.</p>
              <p className="text-amber-700 text-sm mt-1">
                Go to <a href="/student/group" className="underline">My Group</a> to create or join one.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly availability</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : (
                <AvailabilityGrid existingSlots={slots} onToggle={handleToggle} />
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
