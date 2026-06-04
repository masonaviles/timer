import { describe, expect, it } from 'vitest';
import { RETREAT_AMBER } from '../src/data/presets.js';
import { applyTheme } from '../src/view/theme.js';

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
