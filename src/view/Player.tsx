// View layer — the player. Renders engine state and forwards user input as commands.
// Holds NO timer logic (that's the engine) and reads NO colour directly (that's the theme).

import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { TimerEngine } from '../engine/TimerEngine.js';
import { fmt, fmtShort } from '../engine/format.js';
import { Fullscreen } from './Fullscreen.js';
import { beep } from './audio.js';
import { useKeyboard } from './keyboard.js';
import { applyTheme } from './theme.js';
import { urgencyClass } from './urgency.js';
import { type EngineView, useEngine } from './useEngine.js';
import './styles.css';

export interface PlayerProps {
  engine: TimerEngine;
}

function statusText({ state, tick }: EngineView): string {
  if (state === 'RUNNING') {
    if (tick.urgency === 'danger') return 'URGENT';
    if (tick.urgency === 'warn') return 'WARNING';
    return 'RUNNING';
  }
  if (state === 'FINISHED') return 'DONE';
  if (state === 'PAUSED') return 'PAUSED';
  if (state === 'READY') return 'READY';
  return 'STANDBY';
}

function dotClass(view: EngineView): string {
  if (view.state !== 'RUNNING') return '';
  return urgencyClass(view.tick.urgency) || 'running';
}

function Brand({ title, accent }: { title: string; accent: string | undefined }) {
  if (!accent) return <>{title}</>;
  const i = title.indexOf(accent);
  if (i >= 0) {
    return (
      <>
        {title.slice(0, i)}
        <b>{accent}</b>
        {title.slice(i + accent.length)}
      </>
    );
  }
  return (
    <>
      <b>{accent}</b>
      {` · ${title}`}
    </>
  );
}

export function Player({ engine }: PlayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fsRef = useRef<HTMLDivElement>(null);
  const view = useEngine(engine);
  const [fsOpen, setFsOpen] = useState(false);
  const [flashing, setFlashing] = useState(false);

  const config = engine.config;
  const { tick, step } = view;
  const u = urgencyClass(tick.urgency);

  // Apply theme tokens to the root element's CSS custom properties.
  useEffect(() => {
    if (rootRef.current) applyTheme(rootRef.current, config.theme);
  }, [config.theme]);

  // End-of-step: optional beep + flash (CSS suppresses the animation under reduced-motion).
  useEffect(() => {
    return engine.on('finished', () => {
      if (engine.config.options.audioAlert) beep();
      setFlashing(true);
      setTimeout(() => setFlashing(false), 3200);
    });
  }, [engine]);

  // Catch up instantly when a backgrounded tab returns (setInterval is throttled while hidden).
  useEffect(() => {
    const onVisible = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') engine.sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [engine]);

  // Auto-scroll the active step into view in the list. The effect reads the active
  // element from the DOM, so the dependency on step.index is intentional.
  // biome-ignore lint/correctness/useExhaustiveDependencies: rerun when the active step changes
  useEffect(() => {
    rootRef.current?.querySelector('.cs-cue-item.active')?.scrollIntoView?.({ block: 'nearest' });
  }, [step.index]);

  const openFullscreen = useCallback(() => setFsOpen(true), []);
  const closeFullscreen = useCallback(() => {
    setFsOpen(false);
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);
  const kbHandlers = useMemo(
    () => ({ openFullscreen, closeFullscreen }),
    [openFullscreen, closeFullscreen],
  );
  useKeyboard(engine, kbHandlers);

  // Request the real Fullscreen API once the overlay is mounted; keep state in sync if
  // the user exits via the browser.
  useEffect(() => {
    if (!fsOpen) return;
    fsRef.current?.requestFullscreen?.().catch(() => {});
    const onChange = () => {
      if (!document.fullscreenElement) setFsOpen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [fsOpen]);

  const totalSecs = config.steps.reduce((sum, s) => sum + s.durationSecs, 0);
  const nextHint = step.nextStep
    ? `next: ${step.nextStep.name} · ${fmtShort(step.nextStep.durationSecs)}`
    : step.step
      ? 'last step'
      : '';
  // Announce step changes and completion — NOT every urgency tick (would be chatty).
  const announcement =
    view.state === 'FINISHED' && step.step
      ? `Time's up. ${step.step.name} complete.`
      : step.step
        ? `Step ${step.index + 1} of ${step.count}: ${step.step.name}`
        : '';

  return (
    <div class="cuestack" ref={rootRef}>
      <header class="cs-header">
        <div class="cs-brand">
          <Brand title={config.title} accent={config.brandAccent} />
        </div>
        <div class="cs-header-right">
          <div class="cs-status">
            <span class={`cs-dot ${dotClass(view)}`} />
            <span>{statusText(view)}</span>
          </div>
          <button type="button" class="cs-hbtn" onClick={openFullscreen}>
            ⤢ FULLSCREEN
          </button>
        </div>
      </header>

      <div class="cs-main">
        <div class="cs-clock-panel">
          <div class="cs-cue-number">
            {step.step ? `STEP ${step.index + 1} OF ${step.count}` : ''}
          </div>
          <div class={`cs-cue-label ${step.step ? 'active' : ''}`}>
            {step.step
              ? step.step.name
              : step.count
                ? '— select a step to begin —'
                : '— no steps yet —'}
          </div>
          <div class={`cs-clock ${u} ${flashing ? 'cs-flashing' : ''}`}>
            {fmt(tick.remainingSecs)}
          </div>
          {config.options.showProgressBar && (
            <div class="cs-progress-wrap">
              <div class={`cs-progress ${u}`} style={{ width: `${tick.fraction * 100}%` }} />
            </div>
          )}
          <div class="cs-controls">
            <button
              type="button"
              class={`cs-btn cs-btn-start ${view.state === 'RUNNING' ? 'running' : ''}`}
              onClick={() => engine.toggle()}
              disabled={step.index < 0}
            >
              {view.state === 'RUNNING' ? '⏸ Pause' : '▶ Start'}
            </button>
            <button type="button" class="cs-btn cs-btn-ghost" onClick={() => engine.reset()}>
              ↺ Reset
            </button>
          </div>
          <div class="cs-next-hint">{nextHint}</div>
          {view.state === 'FINISHED' && <div class="cs-done-banner">✓ Time's Up</div>}
        </div>

        <div class="cs-side">
          <div class="cs-cue-head">
            <div class="cs-cue-head-title">Steps</div>
            <div class="cs-cue-total">
              {config.steps.length} steps · {fmtShort(totalSecs)}
            </div>
          </div>
          {config.steps.length ? (
            <ul class="cs-cue-list">
              {config.steps.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    class={`cs-cue-item ${i === step.index ? 'active' : ''}`}
                    onClick={() => engine.selectStep(i)}
                  >
                    <span class="cs-cue-n">{i + 1}</span>
                    <span class="cs-cue-nm">{s.name}</span>
                    <span class="cs-cue-d">{fmtShort(s.durationSecs)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div class="cs-empty">No steps yet.</div>
          )}
        </div>
      </div>

      {/* <output> has an implicit role="status"; aria-live escalates on completion. */}
      <output class="cs-sr-only" aria-live={view.state === 'FINISHED' ? 'assertive' : 'polite'}>
        {announcement}
      </output>

      {fsOpen && (
        <Fullscreen view={view} flashing={flashing} rootRef={fsRef} onExit={closeFullscreen} />
      )}
    </div>
  );
}
