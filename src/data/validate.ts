// Data layer — runtime validation + defaults. The type boundary between untrusted
// input (decoded links, stored drafts) and the rest of the app. Normalizes where it
// safely can (fills defaults, coerces, drops invalid steps) and throws only when the
// input is fundamentally unusable. See docs/phases/phase-1-engine.md.

import { nanoid } from 'nanoid';
import { RETREAT_AMBER } from './presets.js';
import {
  SCHEMA_VERSION,
  type Step,
  type ThemeThresholds,
  type ThemeTokens,
  type TimerConfig,
  type TimerOptions,
} from './schema.js';

export class ValidationError extends Error {
  override name = 'ValidationError';
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function getProp(obj: unknown, key: string): unknown {
  return isObject(obj) ? obj[key] : undefined;
}

function toBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/** A non-empty string after trimming, else null. */
function nonEmptyString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null;
}

/** Normalize one step; returns null if it is unusable (blank name / non-positive duration). */
function validateStep(input: unknown): Step | null {
  if (!isObject(input)) return null;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const durationSecs = Math.round(Number(input.durationSecs));
  if (name === '' || !Number.isFinite(durationSecs) || durationSecs <= 0) return null;

  const step: Step = {
    id: nonEmptyString(input.id) ?? nanoid(8),
    name,
    durationSecs,
  };
  const note = nonEmptyString(input.note);
  if (note !== null) step.note = note;
  return step;
}

/** Overlay valid string values from `input` onto a copy of `base`, keeping base's key set. */
function mergeStrings<T extends object>(base: T, input: unknown): T {
  const out = { ...base } as Record<string, unknown>;
  if (isObject(input)) {
    for (const key of Object.keys(base)) {
      const v = input[key];
      if (typeof v === 'string' && v !== '') out[key] = v;
    }
  }
  return out as T;
}

function fraction(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < 1 ? n : fallback;
}

function validateThresholds(input: unknown, base: ThemeThresholds): ThemeThresholds {
  const warn = fraction(getProp(input, 'warn'), base.warn);
  const danger = fraction(getProp(input, 'danger'), base.danger);
  // danger must trip at or before warn
  return danger <= warn ? { warn, danger } : { warn: danger, danger: warn };
}

function validateTheme(input: unknown): ThemeTokens {
  const theme: ThemeTokens = {
    colors: mergeStrings(RETREAT_AMBER.colors, getProp(input, 'colors')),
    fonts: mergeStrings(RETREAT_AMBER.fonts, getProp(input, 'fonts')),
    thresholds: validateThresholds(getProp(input, 'thresholds'), RETREAT_AMBER.thresholds),
  };
  const preset = nonEmptyString(getProp(input, 'preset'));
  if (preset !== null) theme.preset = preset;
  return theme;
}

/**
 * Validate and normalize untrusted input into a TimerConfig.
 * @throws {ValidationError} when input is not an object.
 */
export function validateConfig(input: unknown): TimerConfig {
  if (!isObject(input)) {
    throw new ValidationError('TimerConfig must be an object');
  }

  const steps: Step[] = Array.isArray(input.steps)
    ? input.steps.map(validateStep).filter((s): s is Step => s !== null)
    : [];

  const options: TimerOptions = {
    audioAlert: toBool(getProp(input.options, 'audioAlert'), true),
    autoAdvance: toBool(getProp(input.options, 'autoAdvance'), false),
    showProgressBar: toBool(getProp(input.options, 'showProgressBar'), true),
  };

  const config: TimerConfig = {
    version: SCHEMA_VERSION,
    title: nonEmptyString(input.title) ?? 'Untitled Timer',
    steps,
    theme: validateTheme(input.theme),
    options,
  };

  const brandAccent = nonEmptyString(input.brandAccent);
  if (brandAccent !== null) config.brandAccent = brandAccent;

  return config;
}
