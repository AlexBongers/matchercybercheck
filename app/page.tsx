import Link from "next/link";
import { ShieldCheck, ArrowRight, Users, Building2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-indigo-600" />
          <span className="font-bold text-xl text-indigo-700">Cybercheck</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Sign up</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 text-center py-24">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 rounded-full px-4 py-1 text-sm font-medium mb-6">
          <Lock className="h-4 w-4" />
          HBO ICT · Cyber Security Audits
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Effortless Cyber Security
          <br />
          <span className="text-indigo-600">Interview Scheduling</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Cybercheck automatically matches HBO ICT student groups with entrepreneurs
          for 45-minute cyber-security interviews — eliminating manual coordination.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup?role=entrepreneur">
            <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
              <Building2 className="h-5 w-5" />
              I&apos;m an entrepreneur
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth/signup?role=student">
            <Button size="lg" className="w-full sm:w-auto gap-2">
              <Users className="h-5 w-5" />
              I&apos;m a student
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
              </div>
              <CardTitle className="text-lg">1. Entrepreneurs sign up</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Entrepreneurs register their company, select their availability, and
              choose between on-site or online (Teams) interviews.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <CardTitle className="text-lg">2. Students form groups</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Students (groups of 2-3) create a team, share their group code, and
              indicate their collective availability.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
              </div>
              <CardTitle className="text-lg">3. Automatic matching</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              The matching engine finds overlapping time slots and schedules
              interviews automatically. Both parties receive a confirmation email.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Cybercheck · HBO ICT Cyber Security Platform
        </div>
      </footer>
    </div>
  );
}
