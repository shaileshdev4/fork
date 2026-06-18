import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { LOGO_MARK_COLORS } from "@/lib/logo-mark";

const wordmarkClass = {
  sm: "text-[1.05rem] leading-none",
  md: "text-base leading-none",
  lg: "text-3xl leading-none",
} as const;

export function Logo({
  size = 22,
  showWordmark = true,
  wordmarkSize = "md",
  variant = "default",
  href,
  className = "",
  accentA = LOGO_MARK_COLORS.pathA,
  accentB = LOGO_MARK_COLORS.pathB,
}: {
  size?: number;
  showWordmark?: boolean;
  wordmarkSize?: keyof typeof wordmarkClass;
  variant?: "default" | "eyebrow";
  href?: string;
  className?: string;
  accentA?: string;
  accentB?: string;
}) {
  const mark = (
    <LogoMark size={size} accentA={accentA} accentB={accentB} className="shrink-0" />
  );

  const content =
    variant === "eyebrow" ? (
      <span
        className={`inline-flex items-center gap-2.5 text-xs uppercase tracking-[0.25em] text-muted ${className}`}
      >
        <span
          className="h-px w-6 sm:w-8 shrink-0"
          style={{ background: accentA }}
        />
        {mark}
        {showWordmark && (
          <span className="font-display text-ink normal-case tracking-tight text-base">
            Fork
          </span>
        )}
        <span
          className="h-px w-6 sm:w-8 shrink-0"
          style={{ background: accentB }}
        />
      </span>
    ) : (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        {mark}
        {showWordmark && (
          <span
            className={`font-display tracking-tight text-ink ${wordmarkClass[wordmarkSize]}`}
          >
            Fork
          </span>
        )}
      </span>
    );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {content}
      </Link>
    );
  }

  return content;
}
