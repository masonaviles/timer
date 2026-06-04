// Engine layer — injectable time + scheduling. The engine reads time ONLY through a
// Clock and is driven ONLY through a Ticker, so tests are fully deterministic and the
// countdown is wall-clock accurate regardless of tick cadence or tab throttling.
// See docs/02-ARCHITECTURE.md (Wall-clock correctness).

/** A monotonic-enough source of "now" in milliseconds. */
export interface Clock {
  now(): number;
}

/** Real wall clock. Date.now() reflects real elapsed time even across backgrounded tabs. */
export const systemClock: Clock = {
  now: () => Date.now(),
};

export interface FakeClock extends Clock {
  /** Move time forward by `ms`. */
  advance(ms: number): void;
  /** Set absolute time. */
  set(ms: number): void;
}

/** Deterministic clock for tests. */
export function createFakeClock(start = 0): FakeClock {
  let t = start;
  return {
    now: () => t,
    advance: (ms) => {
      t += ms;
    },
    set: (ms) => {
      t = ms;
    },
  };
}

/**
 * Drives periodic recomputes. Decoupled from the Clock so the *cadence* of UI updates
 * is independent from countdown *accuracy* (accuracy comes from Clock + endsAt).
 */
export interface Ticker {
  start(onTick: () => void): void;
  stop(): void;
}

/** Production ticker backed by setInterval (default ~250ms for smooth UI). */
export function intervalTicker(intervalMs = 250): Ticker {
  let handle: ReturnType<typeof setInterval> | null = null;
  return {
    start(onTick) {
      if (handle !== null) clearInterval(handle);
      handle = setInterval(onTick, intervalMs);
    },
    stop() {
      if (handle !== null) {
        clearInterval(handle);
        handle = null;
      }
    },
  };
}

export interface ManualTicker extends Ticker {
  /** Manually trigger a tick (no-op if stopped). */
  fire(): void;
  /** Whether the ticker is currently started. */
  running(): boolean;
}

/** Test ticker: tick only when `fire()` is called. */
export function manualTicker(): ManualTicker {
  let onTick: (() => void) | null = null;
  return {
    start(cb) {
      onTick = cb;
    },
    stop() {
      onTick = null;
    },
    fire() {
      onTick?.();
    },
    running() {
      return onTick !== null;
    },
  };
}
