import { afterEach, describe, expect, it } from 'vitest';
import { RETREAT_AMBER } from '../src/data/presets.js';
import { applyTheme, pickDefaultTheme, prefersDark } from '../src/view/theme.js';

describe('applyTheme', () => {
  it('writes every colour and font token as a CSS custom property', () => {
    const el = document.createElement('div');
    applyTheme(el, RETREAT_AMBER);
    expect(el.style.getPropertyValue('--accent')).toBe('#f5a623');
    expect(el.style.getPropertyValue('--bg')).toBe('#0d0e11');
    expect(el.style.getPropertyValue('--danger')).toBe('#e05c5c');
    expect(el.style.getPropertyValue('--font-display')).toContain('Bebas Neue');
    expect(el.style.getPropertyValue('--font-mono')).toContain('DM Mono');
  });

  it('overwrites prior tokens on re-apply (idempotent)', () => {
    const el = document.createElement('div');
    applyTheme(el, RETREAT_AMBER);
    const custom = structuredClone(RETREAT_AMBER);
    custom.colors.accent = '#abcdef';
    applyTheme(el, custom);
    expect(el.style.getPropertyValue('--accent')).toBe('#abcdef');
  });
});

describe('prefers-color-scheme', () => {
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original;
  });

  function stubMatchMedia(matches: boolean) {
    window.matchMedia = ((query: string) =>
      ({ matches, media: query }) as unknown as MediaQueryList) as typeof window.matchMedia;
  }

  it('picks a dark preset when the OS prefers dark', () => {
    stubMatchMedia(true);
    expect(prefersDark()).toBe(true);
    expect(pickDefaultTheme().preset).toBe('retreatAmber');
  });

  it('picks the light preset when the OS prefers light', () => {
    stubMatchMedia(false);
    expect(prefersDark()).toBe(false);
    expect(pickDefaultTheme().preset).toBe('daylight');
  });
});
