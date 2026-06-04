import { describe, expect, it } from 'vitest';
import { createSampleTimer } from '../src/data/presets.js';
import { CodecError, buildShareUrl, decodeConfig, encodeConfig } from '../src/persistence/codec.js';

describe('ConfigCodec — round trip', () => {
  it('decode(encode(c)) is lossless', () => {
    const c = createSampleTimer();
    const back = decodeConfig(encodeConfig(c));
    expect(back.title).toBe(c.title);
    expect(back.steps).toHaveLength(c.steps.length);
    expect(back.steps[0]?.durationSecs).toBe(c.steps[0]?.durationSecs);
    expect(back.theme.colors.accent).toBe(c.theme.colors.accent);
  });

  it('survives unicode names', () => {
    const c = createSampleTimer();
    c.steps[0] = { id: 'u', name: 'Café ☕ — naïve', durationSecs: 90 };
    const back = decodeConfig(encodeConfig(c));
    expect(back.steps[0]?.name).toBe('Café ☕ — naïve');
  });

  it('drops invalid steps via validation before encoding', () => {
    const c = createSampleTimer();
    // @ts-expect-error intentionally invalid step for the test
    c.steps.push({ name: '', durationSecs: 0 });
    const back = decodeConfig(encodeConfig(c));
    expect(back.steps).toHaveLength(19);
  });
});

describe('ConfigCodec — errors', () => {
  it('throws CodecError on undecompressable input', () => {
    expect(() => decodeConfig('!!!not-valid!!!')).toThrow(CodecError);
  });

  it('throws CodecError on empty input', () => {
    expect(() => decodeConfig('')).toThrow(CodecError);
  });
});

describe('buildShareUrl', () => {
  it('produces a ?t= url and flags overflow', () => {
    const c = createSampleTimer();
    const link = buildShareUrl('https://example.com/utilities/timer', c);
    expect(link.url).toContain('?t=');
    expect(link.param.length).toBeGreaterThan(0);
    expect(typeof link.overflow).toBe('boolean');
  });

  it('flags overflow for an oversize config', () => {
    const c = createSampleTimer();
    c.steps = Array.from({ length: 400 }, (_, i) => ({
      id: `s${i}`,
      name: `A very long step name number ${i} used to bloat the encoded payload`,
      durationSecs: 60 + i,
    }));
    expect(buildShareUrl('https://example.com/', c).overflow).toBe(true);
  });
});
