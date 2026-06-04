// Engine layer — time formatting. Ported from the original BTMB_Retreat_Timer.html.

/** Zero-pad to two digits. */
export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Clock display: "mm:ss", or "h:mm:ss" when an hour or more remains. */
export function fmt(totalSecs: number): string {
  const s = Math.max(0, Math.floor(totalSecs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/**
 * Compact duration for lists/hints: "1h 30m", "45m", "30s".
 * (Original was minute-granular; a sub-minute case is added since steps may be < 1 min.)
 */
export function fmtShort(totalSecs: number): string {
  const s = Math.max(0, Math.floor(totalSecs));
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/** Editable duration string for the builder: "mm:ss", or "h:mm:ss" at an hour or more. */
export function toDurationInput(totalSecs: number): string {
  const s = Math.max(0, Math.floor(totalSecs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/**
 * Parse a duration entered as "ss", "mm:ss", or "h:mm:ss" into seconds.
 * Returns null on malformed input (non-numeric / wrong shape). A well-formed "00:00"
 * returns 0 — callers decide whether zero is acceptable.
 */
export function parseDuration(input: string): number | null {
  const parts = input.trim().split(':');
  if (parts.length < 1 || parts.length > 3) return null;
  if (parts.some((p) => !/^\d+$/.test(p.trim()))) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.length === 1) return nums[0] ?? null;
  if (nums.length === 2) return (nums[0] ?? 0) * 60 + (nums[1] ?? 0);
  return (nums[0] ?? 0) * 3600 + (nums[1] ?? 0) * 60 + (nums[2] ?? 0);
}
