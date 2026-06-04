// Data layer — built-in theme presets + the canonical sample timer.
// Phase 3 expands the preset set; this phase ports the original "Retreat Amber"
// look and the original 19-step agenda (now in seconds) as the parity fixture.

import { SCHEMA_VERSION, type Step, type ThemeTokens, type TimerConfig } from './schema.js';

/** Ported from the original BTMB_Retreat_Timer.html :root tokens. */
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

/** Built-in presets keyed by id (expanded in Phase 3). */
export const PRESETS: Record<string, ThemeTokens> = {
  retreatAmber: RETREAT_AMBER,
};
