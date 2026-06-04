// View layer — ThemeProvider. Applies ThemeTokens to an element's CSS custom properties.
// Theming is a pure data->variable mapping; no component reads a colour directly.
// (Secondary shades like --border/--dim are DERIVED in styles.css from these.)

import { DAYLIGHT, RETREAT_AMBER } from '../data/presets.js';
import type { ThemeTokens } from '../data/schema.js';

/** Map of theme token path -> CSS custom property name. */
const COLOR_VARS: Record<keyof ThemeTokens['colors'], string> = {
  bg: '--bg',
  bg2: '--bg2',
  surface: '--surface',
  text: '--text',
  muted: '--muted',
  accent: '--accent',
  warn: '--warn',
  danger: '--danger',
  ok: '--ok',
};

const FONT_VARS: Record<keyof ThemeTokens['fonts'], string> = {
  display: '--font-display',
  body: '--font-body',
  mono: '--font-mono',
};

/** Write a theme's tokens onto `el` as CSS custom properties. Idempotent. */
export function applyTheme(el: HTMLElement, theme: ThemeTokens): void {
  for (const [key, varName] of Object.entries(COLOR_VARS)) {
    el.style.setProperty(varName, theme.colors[key as keyof ThemeTokens['colors']]);
  }
  for (const [key, varName] of Object.entries(FONT_VARS)) {
    el.style.setProperty(varName, theme.fonts[key as keyof ThemeTokens['fonts']]);
  }
}

/** Whether the user's OS prefers a dark colour scheme (defaults to dark off-DOM). */
export function prefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Pick a default preset when a config specifies none, honouring prefers-color-scheme. */
export function pickDefaultTheme(): ThemeTokens {
  return structuredClone(prefersDark() ? RETREAT_AMBER : DAYLIGHT);
}
