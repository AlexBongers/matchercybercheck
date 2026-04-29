"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NAV_LINKS = [
  { href: "/entrepreneur/dashboard", label: "Dashboard" },
  { href: "/entrepreneur/availability", label: "Availability" },
  { href: "/entrepreneur/profile", label: "Profile" },
];

export default function EntrepreneurProfilePage() {
  const [companyName, setCompanyName] = useState("");
  const [kvkNumber, setKvkNumber] = useState("");
  const [address, setAddress] = useState("");
  const [interviewMode, setInterviewMode] = useState("online");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: entrepreneur }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("entrepreneurs").select("*").eq("profile_id", user.id).single(),
      ]);

      if (profile) {
        setFullName(profile.full_name ?? "");
        setPhone(profile.phone ?? "");
      }
      if (entrepreneur) {
        setCompanyName(entrepreneur.company_name ?? "");
        setKvkNumber(entrepreneur.kvk_number ?? "");
        setAddress(entrepreneur.address ?? "");
        setInterviewMode(entrepreneur.interview_mode ?? "online");
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await Promise.all([
      supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id),
      supabase.from("entrepreneurs").update({
        company_name: companyName,
        kvk_number: kvkNumber,
        address,
        interview_mode: interviewMode,
      }).eq("profile_id", user.id),
    ]);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav role="entrepreneur" links={NAV_LINKS} />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav role="entrepreneur" links={NAV_LINKS} />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company name *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kvk">KvK number</Label>
                <Input id="kvk" value={kvkNumber} onChange={(e) => setKvkNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Interview mode</Label>
                <Select value={interviewMode} onValueChange={setInterviewMode}>
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

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
          </div>
        </form>
      </main>
    </div>
  );
}
