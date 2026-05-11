import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Soft auth gate for /admin/*. Final enforcement still happens inside each
 * server component via getCurrentAdmin().
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.nextUrl.pathname.startsWith("/admin")) return res;
  if (req.nextUrl.pathname.startsWith("/admin/login")) return res;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (k: string) => req.cookies.get(k)?.value,
        set: (k: string, v: string, o: CookieOptions) => res.cookies.set({ name: k, value: v, ...o }),
        remove: (k: string, o: CookieOptions) => res.cookies.set({ name: k, value: "", ...o }),
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
