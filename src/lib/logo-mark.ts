/** Fork mark - one timeline splitting into two futures (path A up, path B down). */
export const LOGO_MARK_VIEWBOX = "0 0 22 22";

export const LOGO_MARK_STEM = "M5 20.5 L5 12.5";

export const LOGO_MARK_PATHS = [
  { d: "M5 12.5 L17 3.5", role: "pathA" as const },
  { d: "M5 12.5 L17 19.5", role: "pathB" as const },
] as const;

export const LOGO_MARK_JUNCTION = { cx: 5, cy: 12.5, r: 2 };

export const LOGO_MARK_ENDPOINTS = [
  { cx: 17, cy: 3.5, r: 1.6, role: "pathA" as const },
  { cx: 17, cy: 19.5, r: 1.6, role: "pathB" as const },
] as const;

export const LOGO_MARK_COLORS = {
  ink: "#1a1d29",
  pathA: "#c77b30",
  pathB: "#2f7d77",
  paper: "#f7f4ee",
  line: "#d9d2c5",
} as const;

export const LOGO_MARK_STROKE = 1.85;
