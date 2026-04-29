"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
}

interface NavProps {
  role: "entrepreneur" | "student" | "admin";
  links: NavLink[];
}

export function Nav({ role, links }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const roleLabel: Record<string, string> = {
    entrepreneur: "Entrepreneur",
    student: "Student",
    admin: "Admin",
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-indigo-600" />
            <span className="font-bold text-lg text-indigo-700">Cybercheck</span>
            <span className="hidden sm:inline text-xs bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5 font-medium">
              {roleLabel[role]}
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Sign out */}
          <div className="hidden md:block">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1" />
              Sign out
            </Button>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium",
                pathname === link.href
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
