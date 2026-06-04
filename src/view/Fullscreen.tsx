// View layer — fullscreen presentation. A second subscriber to the same engine state
// (Observer pattern): it mirrors the windowed player, never syncs to it directly.

import type { RefObject } from 'preact';
import { fmt } from '../engine/format.js';
import { urgencyClass } from './urgency.js';
import type { EngineView } from './useEngine.js';

export interface FullscreenProps {
  view: EngineView;
  flashing: boolean;
  rootRef: RefObject<HTMLDivElement>;
  onExit(): void;
}

export function Fullscreen({ view, flashing, rootRef, onExit }: FullscreenProps) {
  const { tick, step } = view;
  const u = urgencyClass(tick.urgency);
  return (
    <div class="cs-fs" ref={rootRef}>
      <button type="button" class="cs-fs-exit" onClick={onExit}>
        ESC · EXIT
      </button>
      <div class="cs-fs-num">{step.step ? `${step.index + 1} / ${step.count}` : ''}</div>
      <div class="cs-fs-label">{step.step ? step.step.name : '—'}</div>
      <div class={`cs-fs-clock ${u} ${flashing ? 'cs-flashing' : ''}`}>
        {fmt(tick.remainingSecs)}
      </div>
      <div class="cs-fs-bar-wrap">
        <div class={`cs-fs-bar ${u}`} style={{ width: `${tick.fraction * 100}%` }} />
      </div>
      <div class="cs-fs-next">{step.nextStep ? `up next · ${step.nextStep.name}` : ''}</div>
    </div>
  );
}
