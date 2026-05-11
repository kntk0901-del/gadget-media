import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-screen-md px-4 py-20 text-center">
        <div className="font-mono text-[11px] tracking-[0.3em] text-accent mb-3">404 / NOT FOUND</div>
        <h1 className="font-display text-4xl font-bold tracking-tightish">電源が見つかりません。</h1>
        <p className="mt-3 text-ink-muted">お探しのページは存在しないか、削除された可能性があります。</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-accent px-5 py-2 text-sm font-medium text-bg hover:bg-accent-hover">
          トップへ戻る
        </Link>
      </main>
      <Footer />
    </>
  );
}
