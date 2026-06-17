import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-md mx-auto px-5 py-24 text-center">
      <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.25em] text-muted mb-6">
        <span className="h-px w-8 bg-pathA" />Fork<span className="h-px w-8 bg-pathB" />
      </div>
      <h1 className="font-display text-3xl text-ink">This fork doesn&apos;t exist.</h1>
      <p className="text-muted mt-3">The page you&apos;re after isn&apos;t here.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-ink text-paper px-6 py-2.5 text-sm hover:opacity-90">Start a decision</Link>
    </main>
  );
}