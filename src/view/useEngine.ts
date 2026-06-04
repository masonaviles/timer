// View layer — Preact hook bridging the imperative engine to reactive UI state.
// Subscribes to engine events and re-renders; holds NO timer logic of its own.

import { useEffect, useState } from 'preact/hooks';
import type { EngineState } from '../data/schema.js';
import type { TimerEngine } from '../engine/TimerEngine.js';
import type { StateChangeEvent, StepChangeEvent, TickEvent } from '../engine/events.js';

export interface EngineView {
  state: EngineState;
  tick: TickEvent;
  step: StepChangeEvent;
}

export function useEngine(engine: TimerEngine): EngineView {
  const snap = engine.snapshot();
  const [state, setState] = useState<EngineState>(snap.state);
  const [tick, setTick] = useState<TickEvent>(snap.tick);
  const [step, setStep] = useState<StepChangeEvent>(snap.step);

  useEffect(() => {
    // Re-prime in case the engine changed between render and effect.
    const s = engine.snapshot();
    setState(s.state);
    setTick(s.tick);
    setStep(s.step);

    const offs = [
      engine.on('statechange', (e: StateChangeEvent) => setState(e.state)),
      engine.on('tick', setTick),
      engine.on('stepchange', setStep),
    ];
    return () => {
      for (const off of offs) off();
    };
  }, [engine]);

  return { state, tick, step };
}
