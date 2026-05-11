import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ITEMS = [
  { href: "/admin",            label: "Dashboard" },
  { href: "/admin/articles",   label: "Articles" },
  { href: "/admin/sources",    label: "Sources" },
  { href: "/admin/taxonomy",   label: "Taxonomy" },
  { href: "/admin/featured",   label: "Featured" },
  { href: "/admin/logs",       label: "Logs" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // login page handles its own auth
  // child server components also re-check; this is a soft gate.
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <AdminHeader />
      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 gap-6 px-4 py-6">
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="sticky top-20 space-y-1 rounded-xl border border-ink-line bg-bg-soft p-3">
            {ITEMS.map((i) => (
              <Link key={i.href} href={i.href} className="block rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-bg-elev hover:text-ink">
                {i.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

async function AdminHeader() {
  const admin = await getCurrentAdmin();
  return (
    <header className="sticky top-0 z-30 border-b border-ink-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-4 px-4 py-3">
        <Link href="/admin" className="font-display text-lg font-bold tracking-tightish">
          GADGET <span className="text-accent">//</span> ADMIN
        </Link>
        <span className="rounded-full bg-bg-elev px-2 py-0.5 font-mono text-[10px] tracking-[0.2em] text-ink-muted">CONSOLE</span>
        <div className="flex-1" />
        <Link href="/" className="text-xs text-ink-muted hover:text-ink">View public site →</Link>
        {admin ? (
          <span className="rounded-full border border-ink-line px-2 py-0.5 text-[11px] text-ink-soft">{admin.user.email}</span>
        ) : (
          <Link href="/admin/login" className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-bg">Sign in</Link>
        )}
      </div>
    </header>
  );
}

