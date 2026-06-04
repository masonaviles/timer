// Data layer — the canonical schema. The shareable unit is a TimerConfig.
// See docs/02-ARCHITECTURE.md#core-data-model. Canonical time unit is SECONDS.

export const SCHEMA_VERSION = 1 as const;

/** A single ordered segment of the timer. */
export interface Step {
  /** Stable unique id; survives reorder/edit (decouples identity from array index). */
  id: string;
  /** Display label, e.g. "Family Journal Time". */
  name: string;
  /** Duration in seconds; always > 0. */
  durationSecs: number;
  /** Optional presenter note (reserved for later phases). */
  note?: string;
}

/**
 * Theme colours. Maps 1:1 onto CSS custom properties at runtime (Phase 2/3).
 * Phase 3 may add UI-only tokens (e.g. border/dim); validation backfills missing
 * keys from a preset, so expanding this set later does not break old share links.
 */
export interface ThemeColors {
  bg: string;
  bg2: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  warn: string;
  danger: string;
  ok: string;
}

export interface ThemeFonts {
  display: string;
  body: string;
  mono: string;
}

/** Urgency colour switch points, as the fraction of time remaining. */
export interface ThemeThresholds {
  /** At/below this fraction remaining, urgency becomes "warn". */
  warn: number;
  /** At/below this fraction remaining, urgency becomes "danger". */
  danger: number;
}

export interface ThemeTokens {
  /** Name of the built-in preset this derives from, or "custom". */
  preset?: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  thresholds: ThemeThresholds;
}

export interface TimerOptions {
  /** Beep at step end. */
  audioAlert: boolean;
  /** Auto-start the next step on finish (v1 default false; backlog feature). */
  autoAdvance: boolean;
  showProgressBar: boolean;
}

/** Everything needed to render a fully-branded timer. The shareable unit. */
export interface TimerConfig {
  /** Equals SCHEMA_VERSION at write time; migrated on read. */
  version: number;
  /** Brand/header text, e.g. "Retreat Cue Timer". */
  title: string;
  /** Optional word within the title rendered in the accent colour. */
  brandAccent?: string;
  steps: Step[];
  theme: ThemeTokens;
  options: TimerOptions;
}

/** Urgency level derived from fraction remaining vs. theme thresholds. */
export type Urgency = 'normal' | 'warn' | 'danger';

/** Engine finite-state-machine states. */
export type EngineState = 'IDLE' | 'READY' | 'RUNNING' | 'PAUSED' | 'FINISHED';
