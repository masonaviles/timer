import { describe, expect, it } from 'vitest';
import { RETREAT_AMBER } from '../src/data/presets.js';
import type { Step, TimerConfig } from '../src/data/schema.js';
import { TimerEngine } from '../src/engine/TimerEngine.js';
import { createFakeClock, manualTicker } from '../src/engine/clock.js';
import type { FinishedEvent } from '../src/engine/events.js';

function setup(steps: Step[]) {
  const clock = createFakeClock(0);
  const ticker = manualTicker();
  const config: TimerConfig = {
    version: 1,
    title: 'T',
    steps,
    theme: structuredClone(RETREAT_AMBER),
    options: { audioAlert: true, autoAdvance: false, showProgressBar: true },
  };
  const engine = new TimerEngine(config, { clock, ticker });
  const captured: { finished?: FinishedEvent } = {};
  engine.on('finished', (e) => {
    captured.finished = e;
  });
  return { engine, clock, ticker, captured };
}

describe('resilience: backgrounded-tab sync', () => {
  it('sync() catches up after a hidden gap with no ticks', () => {
    const { engine, clock } = setup([{ id: 'a', name: 'A', durationSecs: 600 }]);
    engine.selectStep(0);
    engine.start();
    clock.advance(300_000); // 5 min hidden; throttled interval fired nothing
    expect(engine.remaining).toBe(600); // display is stale until a tick/sync
    engine.sync();
    expect(engine.remaining).toBe(300); // caught up exactly
  });

  it('sync() finishes a step whose time fully elapsed while hidden', () => {
    const { engine, clock, captured } = setup([{ id: 'a', name: 'A', durationSecs: 60 }]);
    engine.selectStep(0);
    engine.start();
    clock.advance(120_000); // overshoot while hidden
    engine.sync();
    expect(engine.state).toBe('FINISHED');
    expect(engine.remaining).toBe(0);
    expect(captured.finished?.step.name).toBe('A');
  });

  it('sync() is a no-op when not running', () => {
    const { engine } = setup([{ id: 'a', name: 'A', durationSecs: 600 }]);
    engine.selectStep(0);
    engine.sync();
    expect(engine.state).toBe('READY');
    expect(engine.remaining).toBe(600);
  });

  it('stays within a second across many hours of simulated time', () => {
    const { engine, clock } = setup([{ id: 'a', name: 'A', durationSecs: 6 * 3600 }]);
    engine.selectStep(0);
    engine.start();
    // advance an hour at a time, syncing once per hour (sparse ticks)
    for (let h = 1; h <= 5; h++) {
      clock.advance(3_600_000);
      engine.sync();
      expect(engine.remaining).toBe((6 - h) * 3600);
    }
  });
});
