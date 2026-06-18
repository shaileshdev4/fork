import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="max-w-md mx-auto px-5 py-24 text-center">
      <div className="flex justify-center mb-6">
        <Logo variant="eyebrow" />
      </div>
      <h1 className="font-display text-3xl text-ink">This fork doesn&apos;t exist.</h1>
      <p className="text-muted mt-3">The page you&apos;re after isn&apos;t here.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-ink text-paper px-6 py-2.5 text-sm hover:opacity-90">Start a decision</Link>
    </main>
  );
}