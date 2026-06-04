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
