import { describe, expect, it } from 'vitest';
import { fmt, fmtShort, pad, parseDuration, toDurationInput } from '../src/engine/format.js';

describe('pad', () => {
  it('zero-pads to two digits', () => {
    expect(pad(0)).toBe('00');
    expect(pad(5)).toBe('05');
    expect(pad(42)).toBe('42');
  });
});

describe('fmt', () => {
  it('formats mm:ss under an hour', () => {
    expect(fmt(0)).toBe('00:00');
    expect(fmt(5)).toBe('00:05');
    expect(fmt(65)).toBe('01:05');
    expect(fmt(599)).toBe('09:59');
  });

  it('formats h:mm:ss at or over an hour', () => {
    expect(fmt(3600)).toBe('1:00:00');
    expect(fmt(3661)).toBe('1:01:01');
    expect(fmt(22380)).toBe('6:13:00'); // the original 6h 13m total
  });

  it('floors and clamps negatives', () => {
    expect(fmt(-5)).toBe('00:00');
    expect(fmt(9.9)).toBe('00:09');
  });
});

describe('fmtShort', () => {
  it('handles sub-minute, minute, and hour granularity', () => {
    expect(fmtShort(0)).toBe('0s');
    expect(fmtShort(45)).toBe('45s');
    expect(fmtShort(300)).toBe('5m');
    expect(fmtShort(3600)).toBe('1h');
    expect(fmtShort(3660)).toBe('1h 1m');
    expect(fmtShort(5400)).toBe('1h 30m');
  });
});

describe('toDurationInput', () => {
  it('renders mm:ss, and h:mm:ss at an hour or more', () => {
    expect(toDurationInput(90)).toBe('01:30');
    expect(toDurationInput(0)).toBe('00:00');
    expect(toDurationInput(600)).toBe('10:00');
    expect(toDurationInput(3661)).toBe('1:01:01');
  });
});

describe('parseDuration', () => {
  it('parses ss, mm:ss, and h:mm:ss', () => {
    expect(parseDuration('90')).toBe(90);
    expect(parseDuration('1:30')).toBe(90);
    expect(parseDuration('10:00')).toBe(600);
    expect(parseDuration('1:00:00')).toBe(3600);
    expect(parseDuration(' 1:30 ')).toBe(90);
  });

  it('returns 0 for a well-formed zero and null for malformed input', () => {
    expect(parseDuration('00:00')).toBe(0);
    expect(parseDuration('abc')).toBeNull();
    expect(parseDuration('1:2:3:4')).toBeNull();
    expect(parseDuration('1.5')).toBeNull();
    expect(parseDuration('')).toBeNull();
  });
});
