// Engine layer — typed event emitter + the engine event map (Observer pattern).
// Views subscribe; the engine is the single source of truth they react to.

import type { EngineState, Step, Urgency } from '../data/schema.js';

export interface TickEvent {
  remainingSecs: number;
  totalSecs: number;
  /** remaining / total, in [0, 1]; 1 when no step is selected. */
  fraction: number;
  urgency: Urgency;
  running: boolean;
}

export interface StateChangeEvent {
  state: EngineState;
}

export interface StepChangeEvent {
  /** Active step index, or -1 when none selected. */
  index: number;
  step: Step | null;
  nextStep: Step | null;
  /** Total number of steps. */
  count: number;
}

export interface FinishedEvent {
  step: Step;
}

// A type alias (not interface) so it satisfies the Emitter's Record<string, unknown>
// constraint — interfaces lack the implicit index signature that requires.
export type EngineEventMap = {
  tick: TickEvent;
  statechange: StateChangeEvent;
  stepchange: StepChangeEvent;
  finished: FinishedEvent;
};

export type Listener<T> = (payload: T) => void;

/** Minimal typed pub/sub. `on` returns an unsubscribe function. */
export class Emitter<Events extends Record<string, unknown>> {
  private listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    let set = this.listeners[event];
    if (!set) {
      set = new Set<Listener<Events[K]>>();
      this.listeners[event] = set;
    }
    set.add(fn);
    return () => this.off(event, fn);
  }

  off<K extends keyof Events>(event: K, fn: Listener<Events[K]>): void {
    this.listeners[event]?.delete(fn);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners[event];
    if (!set) return;
    for (const fn of set) fn(payload);
  }

  /** Remove all listeners. */
  clear(): void {
    this.listeners = {};
  }
}
