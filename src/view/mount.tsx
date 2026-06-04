// View layer — convenience mount for non-framework hosts (and the dev app).
// Astro (Phase 5) renders <Player> directly as an island instead.

import { render } from 'preact';
import type { TimerConfig } from '../data/schema.js';
import { TimerEngine, type TimerEngineOptions } from '../engine/TimerEngine.js';
import { Player } from './Player.js';

export interface MountResult {
  engine: TimerEngine;
  unmount(): void;
}

/** Create an engine for `config` and render a Player into `el`. */
export function mountPlayer(
  el: HTMLElement,
  config: TimerConfig,
  options: TimerEngineOptions = {},
): MountResult {
  const engine = new TimerEngine(config, options);
  render(<Player engine={engine} />, el);
  return {
    engine,
    unmount() {
      render(null, el);
      engine.dispose();
    },
  };
}
