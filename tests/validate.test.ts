import { describe, expect, it } from 'vitest';
import { createSampleTimer } from '../src/data/presets.js';
import { SCHEMA_VERSION } from '../src/data/schema.js';
import { ValidationError, validateConfig } from '../src/data/validate.js';

describe('validateConfig — rejects unusable input', () => {
  it('throws ValidationError for non-objects', () => {
    expect(() => validateConfig(null)).toThrow(ValidationError);
    expect(() => validateConfig(42)).toThrow(ValidationError);
    expect(() => validateConfig('nope')).toThrow(ValidationError);
  });
});

describe('validateConfig — fills defaults', () => {
  it('produces a usable config from an empty object', () => {
    const c = validateConfig({});
    expect(c.version).toBe(SCHEMA_VERSION);
    expect(c.title).toBe('Untitled Timer');
    expect(c.steps).toEqual([]);
    expect(c.options).toEqual({ audioAlert: true, autoAdvance: false, showProgressBar: true });
    expect(c.theme.colors.accent).toBe('#f5a623');
    expect(c.theme.thresholds).toEqual({ warn: 0.25, danger: 0.1 });
    expect(c.brandAccent).toBeUndefined();
  });

  it('always stamps the current schema version', () => {
    const c = validateConfig({ version: 999, steps: [] });
    expect(c.version).toBe(SCHEMA_VERSION);
  });
});

describe('validateConfig — steps', () => {
  it('drops blank-name and non-positive-duration steps', () => {
    const c = validateConfig({
      steps: [
        { name: 'Keep', durationSecs: 60 },
        { name: '   ', durationSecs: 60 }, // blank
        { name: 'Zero', durationSecs: 0 }, // non-positive
        { name: 'Neg', durationSecs: -5 },
        { durationSecs: 60 }, // missing name
      ],
    });
    expect(c.steps).toHaveLength(1);
    expect(c.steps[0]?.name).toBe('Keep');
  });

  it('coerces and rounds durations and trims names', () => {
    const c = validateConfig({ steps: [{ name: '  Intro  ', durationSecs: '90.6' }] });
    expect(c.steps[0]?.name).toBe('Intro');
    expect(c.steps[0]?.durationSecs).toBe(91);
  });

  it('preserves a provided id and generates one when missing', () => {
    const c = validateConfig({
      steps: [
        { id: 'keep-me', name: 'A', durationSecs: 10 },
        { name: 'B', durationSecs: 10 },
      ],
    });
    expect(c.steps[0]?.id).toBe('keep-me');
    expect(c.steps[1]?.id).toBeTruthy();
    expect(c.steps[1]?.id).not.toBe('keep-me');
  });
});

describe('validateConfig — theme & meta', () => {
  it('keeps brandAccent only when a non-empty string', () => {
    expect(validateConfig({ brandAccent: 'BTMB' }).brandAccent).toBe('BTMB');
    expect(validateConfig({ brandAccent: '  ' }).brandAccent).toBeUndefined();
    expect(validateConfig({ brandAccent: 123 }).brandAccent).toBeUndefined();
  });

  it('backfills missing theme colors from the preset', () => {
    const c = validateConfig({ theme: { colors: { accent: '#abcdef' } } });
    expect(c.theme.colors.accent).toBe('#abcdef'); // override kept
    expect(c.theme.colors.bg).toBe('#0d0e11'); // backfilled
  });

  it('clamps invalid thresholds and orders danger <= warn', () => {
    const c = validateConfig({ theme: { thresholds: { warn: 0.1, danger: 0.3 } } });
    expect(c.theme.thresholds.danger).toBeLessThanOrEqual(c.theme.thresholds.warn);
    const bad = validateConfig({ theme: { thresholds: { warn: 5, danger: -1 } } });
    expect(bad.theme.thresholds).toEqual({ warn: 0.25, danger: 0.1 }); // fall back to defaults
  });
});

describe('validateConfig — round-trips the sample', () => {
  it('returns the sample essentially unchanged', () => {
    const sample = createSampleTimer();
    const c = validateConfig(sample);
    expect(c.title).toBe('Sample Retreat');
    expect(c.steps).toHaveLength(19);
    expect(c.steps[0]?.durationSecs).toBe(1200);
  });
});
