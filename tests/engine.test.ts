import { describe, expect, it } from 'vitest';
import { RETREAT_AMBER } from '../src/data/presets.js';
import { SCHEMA_VERSION, type Step, type TimerConfig } from '../src/data/schema.js';
import { TimerEngine } from '../src/engine/TimerEngine.js';
import { createFakeClock, manualTicker } from '../src/engine/clock.js';
import type { FinishedEvent, StepChangeEvent, TickEvent } from '../src/engine/events.js';

const welcome: Step = { id: 'w', name: 'Welcome', durationSecs: 20 };
const journal: Step = { id: 'j', name: 'Journal', durationSecs: 120 };

function makeConfig(steps: Step[]): TimerConfig {
  return {
    version: SCHEMA_VERSION,
    title: 'Test',
    steps,
    theme: structuredClone(RETREAT_AMBER),
    options: { audioAlert: true, autoAdvance: false, showProgressBar: true },
  };
}

function setup(steps: Step[] = [welcome, journal]) {
  const clock = createFakeClock(0);
  const ticker = manualTicker();
  const engine = new TimerEngine(makeConfig(steps), { clock, ticker });
  const ticks: TickEvent[] = [];
  const stepChanges: StepChangeEvent[] = [];
  const captured: { finished?: FinishedEvent } = {};
  engine.on('tick', (e) => ticks.push(e));
  engine.on('stepchange', (e) => stepChanges.push(e));
  engine.on('finished', (e) => {
    captured.finished = e;
  });
  return { clock, ticker, engine, ticks, stepChanges, captured };
}

const lastTick = (ticks: TickEvent[]) => ticks[ticks.length - 1];
const lastStep = (s: StepChangeEvent[]) => s[s.length - 1];

describe('selecting a step', () => {
  it('enters READY at full duration and reports the next step', () => {
    const { engine, stepChanges } = setup();
    engine.selectStep(0);
    expect(engine.state).toBe('READY');
    expect(engine.remaining).toBe(20);
    expect(engine.total).toBe(20);
    const sc = lastStep(stepChanges);
    expect(sc?.index).toBe(0);
    expect(sc?.step?.name).toBe('Welcome');
    expect(sc?.nextStep?.name).toBe('Journal');
    expect(sc?.count).toBe(2);
  });

  it('reports no next step on the last step', () => {
    const { engine, stepChanges } = setup();
    engine.selectStep(1);
    expect(lastStep(stepChanges)?.nextStep).toBeNull();
  });

  it('ignores out-of-range indices', () => {
    const { engine } = setup();
    engine.selectStep(99);
    expect(engine.state).toBe('IDLE');
    expect(engine.index).toBe(-1);
  });
});

describe('running', () => {
  it('counts down from wall-clock, not tick count', () => {
    const { engine, clock, ticker } = setup();
    engine.selectStep(0); // 20s
    engine.start();
    expect(engine.state).toBe('RUNNING');
    clock.advance(5000);
    ticker.fire();
    expect(engine.remaining).toBe(15);
  });

  it('does not drift when fewer ticks fire than seconds elapse', () => {
    const { engine, clock, ticker } = setup();
    engine.selectStep(1); // 120s
    engine.start();
    clock.advance(90_000); // 90s pass, only 2 ticks
    ticker.fire();
    ticker.fire();
    expect(engine.remaining).toBe(30);
  });

  it('stays accurate across a long, sparsely-ticked session', () => {
    const { engine, clock, ticker } = setup([{ id: 'long', name: 'Long', durationSecs: 7200 }]);
    engine.selectStep(0);
    engine.start();
    clock.advance(3_600_000); // 1h, single tick
    ticker.fire();
    expect(engine.remaining).toBe(3600);
    clock.advance(3_600_000); // another hour
    ticker.fire();
    expect(engine.remaining).toBe(0);
    expect(engine.state).toBe('FINISHED');
  });

  it('reaching zero finishes the step and emits finished', () => {
    const { engine, clock, ticker, captured } = setup();
    engine.selectStep(0); // 20s
    engine.start();
    clock.advance(20_000);
    ticker.fire();
    expect(engine.remaining).toBe(0);
    expect(engine.state).toBe('FINISHED');
    expect(captured.finished?.step.name).toBe('Welcome');
  });

  it('start() is a no-op with no selection or zero time left', () => {
    const { engine } = setup();
    engine.start();
    expect(engine.state).toBe('IDLE');
  });
});

describe('pause / resume', () => {
  it('preserves remaining time across a pause', () => {
    const { engine, clock, ticker } = setup();
    engine.selectStep(1); // 120s
    engine.start();
    clock.advance(30_000);
    ticker.fire();
    engine.pause();
    expect(engine.state).toBe('PAUSED');
    expect(engine.remaining).toBe(90);

    clock.advance(600_000); // 10 min paused
    engine.start();
    expect(engine.state).toBe('RUNNING');
    expect(engine.remaining).toBe(90);

    clock.advance(10_000);
    ticker.fire();
    expect(engine.remaining).toBe(80);
  });

  it('toggle flips between running and paused', () => {
    const { engine } = setup();
    engine.selectStep(0);
    engine.toggle();
    expect(engine.state).toBe('RUNNING');
    engine.toggle();
    expect(engine.state).toBe('PAUSED');
  });
});

describe('reset', () => {
  it('returns the current step to full duration and READY', () => {
    const { engine, clock, ticker } = setup();
    engine.selectStep(1); // 120s
    engine.start();
    clock.advance(40_000);
    ticker.fire();
    expect(engine.remaining).toBe(80);
    engine.reset();
    expect(engine.remaining).toBe(120);
    expect(engine.state).toBe('READY');
  });
});

describe('urgency', () => {
  it.each([
    { advance: 50_000, expected: 'normal' as const },
    { advance: 80_000, expected: 'warn' as const },
    { advance: 95_000, expected: 'danger' as const },
  ])('is $expected at the matching fraction remaining', ({ advance, expected }) => {
    const { engine, clock, ticker, ticks } = setup([{ id: 'x', name: 'X', durationSecs: 100 }]);
    engine.selectStep(0);
    engine.start();
    clock.advance(advance);
    ticker.fire();
    expect(lastTick(ticks)?.urgency).toBe(expected);
  });

  it('uses the theme-provided thresholds', () => {
    const cfg = makeConfig([{ id: 'x', name: 'X', durationSecs: 100 }]);
    cfg.theme.thresholds = { warn: 0.3, danger: 0.15 };
    const clock = createFakeClock(0);
    const ticker = manualTicker();
    const engine = new TimerEngine(cfg, { clock, ticker });
    const ticks: TickEvent[] = [];
    engine.on('tick', (e) => ticks.push(e));
    engine.selectStep(0);
    engine.start();
    clock.advance(72_000); // 28s left -> 0.28: warn under this theme (normal under the default 0.25)
    ticker.fire();
    expect(lastTick(ticks)?.urgency).toBe('warn');
  });
});

describe('navigation', () => {
  it('next() and prev() move the active pointer and stay READY', () => {
    const { engine } = setup();
    engine.selectStep(0);
    engine.next();
    expect(engine.index).toBe(1);
    expect(engine.state).toBe('READY');
    engine.prev();
    expect(engine.index).toBe(0);
  });

  it('next() stops at the last step and prev() at the first', () => {
    const { engine } = setup();
    engine.selectStep(1);
    engine.next();
    expect(engine.index).toBe(1);
    engine.selectStep(0);
    engine.prev();
    expect(engine.index).toBe(0);
  });
});

describe('subscriptions', () => {
  it('exposes the active config', () => {
    const { engine } = setup();
    expect(engine.config.title).toBe('Test');
    expect(engine.config.steps).toHaveLength(2);
  });

  it('on() returns a working unsubscribe', () => {
    const { engine } = setup();
    const seen: number[] = [];
    const off = engine.on('tick', (e) => seen.push(e.remainingSecs));
    engine.selectStep(0); // emits a tick
    const countAfterFirst = seen.length;
    off();
    engine.selectStep(1); // would emit again, but we unsubscribed
    expect(seen.length).toBe(countAfterFirst);
  });
});

describe('lifecycle', () => {
  it('load() swaps config and returns to IDLE', () => {
    const { engine, stepChanges } = setup();
    engine.selectStep(0);
    engine.load(makeConfig([{ id: 'a', name: 'Only', durationSecs: 30 }]));
    expect(engine.state).toBe('IDLE');
    expect(engine.index).toBe(-1);
    expect(lastStep(stepChanges)?.count).toBe(1);
  });

  it('dispose() stops the ticker and removes listeners', () => {
    const { engine, ticker, ticks } = setup();
    engine.selectStep(0);
    engine.start();
    const before = ticks.length;
    engine.dispose();
    expect(ticker.running()).toBe(false);
    ticker.fire();
    expect(ticks.length).toBe(before); // no further emissions
  });
});
