import {
  LOGO_MARK_COLORS,
  LOGO_MARK_ENDPOINTS,
  LOGO_MARK_JUNCTION,
  LOGO_MARK_PATHS,
  LOGO_MARK_STEM,
  LOGO_MARK_STROKE,
  LOGO_MARK_VIEWBOX,
} from "@/lib/logo-mark";

/** Timeline switch - one life path diverges into two futures. */
export function LogoMark({
  size = 22,
  className = "",
  accentA = LOGO_MARK_COLORS.pathA,
  accentB = LOGO_MARK_COLORS.pathB,
}: {
  size?: number;
  className?: string;
  accentA?: string;
  accentB?: string;
}) {
  const pathColor = (role: "pathA" | "pathB") =>
    role === "pathA" ? accentA : accentB;

  return (
    <svg
      width={size}
      height={size}
      viewBox={LOGO_MARK_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d={LOGO_MARK_STEM}
        stroke={LOGO_MARK_COLORS.ink}
        strokeWidth={LOGO_MARK_STROKE}
        strokeLinecap="round"
      />
      {LOGO_MARK_PATHS.map((p) => (
        <path
          key={p.role}
          d={p.d}
          stroke={pathColor(p.role)}
          strokeWidth={LOGO_MARK_STROKE}
          strokeLinecap="round"
        />
      ))}
      <circle
        cx={LOGO_MARK_JUNCTION.cx}
        cy={LOGO_MARK_JUNCTION.cy}
        r={LOGO_MARK_JUNCTION.r}
        fill={LOGO_MARK_COLORS.ink}
      />
      {LOGO_MARK_ENDPOINTS.map((c) => (
        <circle
          key={c.role}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          fill={pathColor(c.role)}
        />
      ))}
    </svg>
  );
}
