import { describe, expect, it, vi } from 'vitest';
import { createFakeClock, intervalTicker, manualTicker, systemClock } from '../src/engine/clock.js';

describe('systemClock', () => {
  it('returns a numeric millisecond timestamp', () => {
    expect(typeof systemClock.now()).toBe('number');
  });
});

describe('createFakeClock', () => {
  it('advances and sets deterministically', () => {
    const clock = createFakeClock(1000);
    expect(clock.now()).toBe(1000);
    clock.advance(500);
    expect(clock.now()).toBe(1500);
    clock.set(0);
    expect(clock.now()).toBe(0);
  });
});

describe('manualTicker', () => {
  it('fires only when started and only on fire()', () => {
    const ticker = manualTicker();
    const cb = vi.fn();
    expect(ticker.running()).toBe(false);
    ticker.fire(); // no-op while stopped
    ticker.start(cb);
    expect(ticker.running()).toBe(true);
    ticker.fire();
    ticker.fire();
    expect(cb).toHaveBeenCalledTimes(2);
    ticker.stop();
    expect(ticker.running()).toBe(false);
    ticker.fire();
    expect(cb).toHaveBeenCalledTimes(2);
  });
});

describe('intervalTicker', () => {
  it('fires on the interval and stops cleanly', () => {
    vi.useFakeTimers();
    try {
      const cb = vi.fn();
      const ticker = intervalTicker(100);
      ticker.start(cb);
      vi.advanceTimersByTime(350);
      expect(cb).toHaveBeenCalledTimes(3);
      ticker.stop();
      vi.advanceTimersByTime(500);
      expect(cb).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });
});
