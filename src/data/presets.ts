// Data layer — built-in theme presets, the canonical sample timer, and theme helpers.
// Presets cover light + dark. This layer is pure (no DOM): prefers-color-scheme selection
// lives in the view layer (view/theme.ts).

import { SCHEMA_VERSION, type Step, type ThemeTokens, type TimerConfig } from './schema.js';

/** Ported from the original BTMB_Retreat_Timer.html :root tokens (dark). */
export const RETREAT_AMBER: ThemeTokens = {
  preset: 'retreatAmber',
  colors: {
    bg: '#0d0e11',
    bg2: '#111216',
    surface: '#1a1b20',
    text: '#e8e6df',
    muted: '#888888',
    accent: '#f5a623',
    warn: '#f5a623',
    danger: '#e05c5c',
    ok: '#4caf7d',
  },
  fonts: {
    display: "'Bebas Neue', sans-serif",
    body: "'DM Sans', sans-serif",
    mono: "'DM Mono', monospace",
  },
  thresholds: { warn: 0.25, danger: 0.1 },
};

/** Cool, high-contrast dark. */
export const MIDNIGHT: ThemeTokens = {
  preset: 'midnight',
  colors: {
    bg: '#0a0f1a',
    bg2: '#0e1424',
    surface: '#16203a',
    text: '#e6ecf7',
    muted: '#8595b3',
    accent: '#6ea8fe',
    warn: '#ffc857',
    danger: '#ff6b6b',
    ok: '#4dd4ac',
  },
  fonts: {
    display: "'Space Grotesk', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'DM Mono', monospace",
  },
  thresholds: { warn: 0.25, danger: 0.1 },
};

/** Earthy dark. */
export const FOREST: ThemeTokens = {
  preset: 'forest',
  colors: {
    bg: '#0c130f',
    bg2: '#101a14',
    surface: '#17241c',
    text: '#e8f0e8',
    muted: '#86a08c',
    accent: '#7bc47f',
    warn: '#e3b341',
    danger: '#e0685c',
    ok: '#7bc47f',
  },
  fonts: {
    display: "'Bebas Neue', sans-serif",
    body: "'DM Sans', sans-serif",
    mono: "'DM Mono', monospace",
  },
  thresholds: { warn: 0.25, danger: 0.1 },
};

/** Light theme for bright rooms / projectors. */
export const DAYLIGHT: ThemeTokens = {
  preset: 'daylight',
  colors: {
    bg: '#f4f2ec',
    bg2: '#ffffff',
    surface: '#eceae2',
    text: '#23211c',
    muted: '#6b6657',
    accent: '#d4791f',
    warn: '#d4791f',
    danger: '#d0453b',
    ok: '#3d9a6b',
  },
  fonts: {
    display: "'Space Grotesk', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'DM Mono', monospace",
  },
  thresholds: { warn: 0.25, danger: 0.1 },
};

/** Built-in presets keyed by id. */
export const PRESETS: Record<string, ThemeTokens> = {
  retreatAmber: RETREAT_AMBER,
  midnight: MIDNIGHT,
  forest: FOREST,
  daylight: DAYLIGHT,
};

/** Stable display order for preset pickers (label + key). */
export const PRESET_LIST: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'retreatAmber', label: 'Retreat Amber' },
  { key: 'midnight', label: 'Midnight' },
  { key: 'forest', label: 'Forest' },
  { key: 'daylight', label: 'Daylight' },
];

/** A deep copy of a preset (or RETREAT_AMBER if the key is unknown). */
export function clonePreset(key: string): ThemeTokens {
  return structuredClone(PRESETS[key] ?? RETREAT_AMBER);
}

/**
 * Produce a custom theme from a base with a new accent colour. Marks the theme `custom`.
 * The single place the builder (Phase 4) derives a custom theme — keeps overrides consistent.
 */
export function withAccent(base: ThemeTokens, accent: string): ThemeTokens {
  const next = structuredClone(base);
  next.colors.accent = accent;
  next.preset = 'custom';
  return next;
}

function step(id: string, name: string, mins: number): Step {
  return { id, name, durationSecs: mins * 60 };
}

/** The original 19-segment retreat agenda, ported to the config schema. */
const SAMPLE_STEPS: Step[] = [
  step('s01', 'Welcome Prompt & Recap', 20),
  step('s02', 'Family Journal Time', 7),
  step('s03', 'Friendship Journal Time', 6),
  step('s04', '10 Min Break', 10),
  step('s05', 'Nervous System Exercise', 20),
  step('s06', '20 Min Break', 20),
  step('s07', 'Bad Reactions Journal', 10),
  step('s08', 'Bad Reactions Roleplay #1', 10),
  step('s09', 'Bad Reactions Roleplay #2', 10),
  step('s10', 'Bad Reactions Roleplay #3', 10),
  step('s11', 'Lunch', 60),
  step('s12', 'Friendship Journal', 10),
  step('s13', 'Friendship Roleplay #1', 12),
  step('s14', 'Friendship Roleplay #2', 12),
  step('s15', '10 Min Break', 10),
  step('s16', 'Family Journal', 12),
  step('s17', 'Family Roleplay #1', 12),
  step('s18', 'Family Roleplay #2', 12),
  step('s19', '20 Min Break', 20),
];

/**
 * Canonical sample config used as the default and as the Phase 2 parity fixture.
 * Returns a fresh deep copy each call so callers can mutate freely.
 */
export function createSampleTimer(): TimerConfig {
  return {
    version: SCHEMA_VERSION,
    title: 'Sample Retreat',
    brandAccent: 'CueStack',
    steps: structuredClone(SAMPLE_STEPS),
    theme: structuredClone(RETREAT_AMBER),
    options: { audioAlert: true, autoAdvance: false, showProgressBar: true },
  };
}
