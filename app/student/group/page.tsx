"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Copy, Check } from "lucide-react";

const NAV_LINKS = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/group", label: "My Group" },
  { href: "/student/availability", label: "Availability" },
];

interface Member {
  profiles: { full_name: string; email: string } | null;
}

interface Group {
  id: string;
  name: string;
  student_group_members: Member[];
}

export default function StudentGroupPage() {
  const [group, setGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadGroup();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGroup = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase
      .from("student_group_members")
      .select("group_id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (membership) {
      const { data: groupData } = await supabase
        .from("student_groups")
        .select(`
          id, name,
          student_group_members (
            profiles ( full_name, email )
          )
        `)
        .eq("id", membership.group_id)
        .single();

      setGroup(groupData as Group | null);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newGroup, error: gErr } = await supabase
      .from("student_groups")
      .insert({ name: groupName })
      .select()
      .single();

    if (gErr) { setError(gErr.message); setCreating(false); return; }

    const { error: mErr } = await supabase
      .from("student_group_members")
      .insert({ group_id: newGroup.id, profile_id: user.id });

    if (mErr) { setError(mErr.message); setCreating(false); return; }

    await loadGroup();
    setCreating(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // joinCode is the group ID (UUID)
    const { data: targetGroup, error: gErr } = await supabase
      .from("student_groups")
      .select("id, name")
      .eq("id", joinCode.trim())
      .single();

    if (gErr || !targetGroup) {
      setError("Group not found. Check the group code.");
      setJoining(false);
      return;
    }

    // Check group size (max 3)
    const { count } = await supabase
      .from("student_group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", targetGroup.id);

    if ((count ?? 0) >= 3) {
      setError("This group is already full (max 3 members).");
      setJoining(false);
      return;
    }

    const { error: mErr } = await supabase
      .from("student_group_members")
      .insert({ group_id: targetGroup.id, profile_id: user.id });

    if (mErr) { setError(mErr.message); setJoining(false); return; }

    await loadGroup();
    setJoining(false);
  };

  const handleCopy = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav role="student" links={NAV_LINKS} />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav role="student" links={NAV_LINKS} />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Group</h1>

        {group ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {group.name}
              </CardTitle>
              <CardDescription>Share the group code with your teammates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2">
                <code className="text-xs font-mono flex-1 break-all">{group.id}</code>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-sm">Members ({group.student_group_members?.length ?? 0}/3)</h3>
                <ul className="space-y-1">
                  {group.student_group_members?.map((m, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {m.profiles?.full_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      {m.profiles?.full_name ?? "Unknown"} — {m.profiles?.email}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create a group</CardTitle>
                <CardDescription>Start a new group and invite teammates</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group name</Label>
                    <Input
                      id="groupName"
                      placeholder="Team Alpha"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating ? "Creating…" : "Create group"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Join a group</CardTitle>
                <CardDescription>Enter the group code from a teammate</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoin} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="joinCode">Group code</Label>
                    <Input
                      id="joinCode"
                      placeholder="Paste group UUID here"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={joining}>
                    {joining ? "Joining…" : "Join group"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
