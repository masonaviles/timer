import { describe, expect, it } from 'vitest';
import {
  PRESETS,
  PRESET_LIST,
  RETREAT_AMBER,
  clonePreset,
  withAccent,
} from '../src/data/presets.js';
import type { ThemeTokens } from '../src/data/schema.js';

const COLOR_KEYS: Array<keyof ThemeTokens['colors']> = [
  'bg',
  'bg2',
  'surface',
  'text',
  'muted',
  'accent',
  'warn',
  'danger',
  'ok',
];

describe('presets', () => {
  it('every preset is complete and self-consistent', () => {
    for (const [key, theme] of Object.entries(PRESETS)) {
      expect(theme.preset).toBe(key);
      for (const c of COLOR_KEYS) {
        expect(theme.colors[c], `${key}.${c}`).toMatch(/^#/);
      }
      expect(theme.fonts.display).toBeTruthy();
      expect(theme.fonts.body).toBeTruthy();
      expect(theme.fonts.mono).toBeTruthy();
      const { warn, danger } = theme.thresholds;
      expect(danger).toBeGreaterThan(0);
      expect(danger).toBeLessThanOrEqual(warn);
      expect(warn).toBeLessThan(1);
    }
  });

  it('ships both light and dark presets', () => {
    // crude luminance check on bg: daylight is light, the rest dark
    expect(PRESETS.daylight?.colors.bg).toBe('#f4f2ec');
    expect(PRESETS.retreatAmber?.colors.bg).toBe('#0d0e11');
  });

  it('PRESET_LIST keys all resolve', () => {
    for (const { key } of PRESET_LIST) {
      expect(PRESETS[key]).toBeDefined();
    }
  });
});

describe('clonePreset', () => {
  it('returns an independent deep copy', () => {
    const a = clonePreset('midnight');
    a.colors.accent = '#000000';
    expect(PRESETS.midnight?.colors.accent).not.toBe('#000000');
  });

  it('falls back to Retreat Amber for unknown keys', () => {
    expect(clonePreset('nope').preset).toBe('retreatAmber');
  });
});

describe('withAccent', () => {
  it('overrides the accent and marks the theme custom without mutating the base', () => {
    const next = withAccent(RETREAT_AMBER, '#ff00aa');
    expect(next.colors.accent).toBe('#ff00aa');
    expect(next.preset).toBe('custom');
    expect(RETREAT_AMBER.colors.accent).toBe('#f5a623'); // base untouched
    expect(RETREAT_AMBER.preset).toBe('retreatAmber');
  });

  it('leaves warn/danger from the base intact', () => {
    const next = withAccent(PRESETS.midnight as ThemeTokens, '#123456');
    expect(next.colors.warn).toBe('#ffc857');
    expect(next.colors.danger).toBe('#ff6b6b');
  });
});
