import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Not logged in — redirect to login for protected routes
  if (!user) {
    if (
      pathname.startsWith("/entrepreneur") ||
      pathname.startsWith("/student") ||
      pathname.startsWith("/admin")
    ) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    return supabaseResponse;
  }

  // Fetch role from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as "admin" | "student" | "entrepreneur" | undefined;

  // Role-based guards
  if (pathname.startsWith("/entrepreneur") && role !== "entrepreneur" && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/student") && role !== "student" && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/entrepreneur/:path*",
    "/student/:path*",
    "/admin/:path*",
  ],
};
