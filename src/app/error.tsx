"use client";

import { Logo } from "@/components/Logo";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="max-w-md mx-auto px-5 py-24 text-center">
      <div className="flex justify-center mb-6">
        <Logo variant="eyebrow" />
      </div>
      <h1 className="font-display text-3xl text-ink">Something hiccuped.</h1>
      <p className="text-muted mt-3">
        A rare glitch on our side - your decision wasn&apos;t lost. Try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-ink text-paper px-6 py-2.5 text-sm hover:opacity-90"
      >
        Reload the simulator
      </button>
    </main>
  );
}
