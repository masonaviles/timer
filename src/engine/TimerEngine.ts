// Engine layer — the finite state machine. The heart of the app.
// States: IDLE -> READY -> RUNNING <-> PAUSED -> FINISHED (+ reset/select transitions).
// No DOM, no window, no Date.now(): time comes from the injected Clock, ticks from the
// injected Ticker. Countdown accuracy is derived from `endsAt` + Clock, never from the
// number of ticks — so it cannot drift or pause when a tab is throttled.
// See docs/02-ARCHITECTURE.md (The engine) and docs/phases/phase-1-engine.md.

import type { EngineState, TimerConfig, Urgency } from '../data/schema.js';
import { type Clock, type Ticker, intervalTicker, systemClock } from './clock.js';
import { Emitter, type EngineEventMap, type StepChangeEvent, type TickEvent } from './events.js';

export interface TimerEngineOptions {
  clock?: Clock;
  ticker?: Ticker;
}

export class TimerEngine extends Emitter<EngineEventMap> {
  private readonly clock: Clock;
  private readonly ticker: Ticker;
  private cfg: TimerConfig;

  private current = -1;
  private rem = 0;
  private tot = 0;
  private endsAt = 0;
  private st: EngineState = 'IDLE';

  constructor(config: TimerConfig, options: TimerEngineOptions = {}) {
    super();
    this.cfg = config;
    this.clock = options.clock ?? systemClock;
    this.ticker = options.ticker ?? intervalTicker();
  }

  // ---- read-only state ----
  get state(): EngineState {
    return this.st;
  }
  get index(): number {
    return this.current;
  }
  get remaining(): number {
    return this.rem;
  }
  get total(): number {
    return this.tot;
  }
  get config(): TimerConfig {
    return this.cfg;
  }

  /** Current state as a one-shot snapshot — primes a view on mount (and SSR/hydration). */
  snapshot(): { state: EngineState; tick: TickEvent; step: StepChangeEvent } {
    return { state: this.st, tick: this.tickPayload(), step: this.stepInfo() };
  }

  /** Swap in a new config and return to IDLE. Emits state/step/tick. */
  load(config: TimerConfig): void {
    this.ticker.stop();
    this.cfg = config;
    this.current = -1;
    this.rem = 0;
    this.tot = 0;
    this.setState('IDLE');
    this.emit('stepchange', this.stepInfo());
    this.emitTick();
  }

  // ---- commands ----
  selectStep(index: number): void {
    const step = this.cfg.steps[index];
    if (!step) return; // out of range -> no-op
    this.ticker.stop();
    this.current = index;
    this.tot = step.durationSecs;
    this.rem = step.durationSecs;
    this.setState('READY');
    this.emit('stepchange', this.stepInfo());
    this.emitTick();
  }

  start(): void {
    if (this.current < 0 || this.rem <= 0) return;
    if (this.st === 'RUNNING') return;
    this.endsAt = this.clock.now() + this.rem * 1000;
    this.setState('RUNNING');
    this.ticker.start(() => this.tick());
    this.emitTick();
  }

  pause(): void {
    if (this.st !== 'RUNNING') return;
    this.rem = this.computeRemaining();
    this.ticker.stop();
    this.setState('PAUSED');
    this.emitTick();
  }

  toggle(): void {
    if (this.st === 'RUNNING') this.pause();
    else this.start();
  }

  reset(): void {
    if (this.current < 0) return;
    const step = this.cfg.steps[this.current];
    if (!step) return;
    this.ticker.stop();
    this.tot = step.durationSecs;
    this.rem = step.durationSecs;
    this.setState('READY');
    this.emitTick();
  }

  next(): void {
    if (this.current < this.cfg.steps.length - 1) this.selectStep(this.current + 1);
  }

  prev(): void {
    if (this.current > 0) this.selectStep(this.current - 1);
  }

  /**
   * Force an immediate recompute from the wall clock. Call when a backgrounded tab returns:
   * setInterval is throttled while hidden, so the display can be seconds stale until the next
   * tick — sync() catches it up at once. No-op unless RUNNING.
   */
  sync(): void {
    if (this.st === 'RUNNING') this.tick();
  }

  /** Stop the ticker and drop all listeners. */
  dispose(): void {
    this.ticker.stop();
    this.clear();
  }

  // ---- internals ----
  /** Recompute remaining from wall-clock; the count of calls is irrelevant to the result. */
  private computeRemaining(): number {
    return Math.max(0, Math.round((this.endsAt - this.clock.now()) / 1000));
  }

  private tick(): void {
    if (this.st !== 'RUNNING') return;
    const next = this.computeRemaining();
    if (next !== this.rem) {
      this.rem = next;
      this.emitTick();
    }
    if (next <= 0) {
      this.ticker.stop();
      this.setState('FINISHED');
      const step = this.cfg.steps[this.current];
      if (step) this.emit('finished', { step });
    }
  }

  private setState(state: EngineState): void {
    this.st = state;
    this.emit('statechange', { state });
  }

  private stepInfo(): StepChangeEvent {
    const step = this.current >= 0 ? (this.cfg.steps[this.current] ?? null) : null;
    const nextStep = this.current >= 0 ? (this.cfg.steps[this.current + 1] ?? null) : null;
    return { index: this.current, step, nextStep, count: this.cfg.steps.length };
  }

  private computeUrgency(): Urgency {
    if (this.tot === 0) return 'normal';
    const f = this.rem / this.tot;
    const { warn, danger } = this.cfg.theme.thresholds;
    if (f <= danger) return 'danger';
    if (f <= warn) return 'warn';
    return 'normal';
  }

  private tickPayload(): TickEvent {
    return {
      remainingSecs: this.rem,
      totalSecs: this.tot,
      fraction: this.tot > 0 ? this.rem / this.tot : 1,
      urgency: this.computeUrgency(),
      running: this.st === 'RUNNING',
    };
  }

  private emitTick(): void {
    this.emit('tick', this.tickPayload());
  }
}
