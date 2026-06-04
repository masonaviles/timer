// View layer — global keyboard shortcuts (ported from the original).
// Space: start/pause · F: fullscreen · Esc: exit fullscreen.

import { useEffect } from 'preact/hooks';
import type { TimerEngine } from '../engine/TimerEngine.js';

export interface KeyboardHandlers {
  openFullscreen(): void;
  closeFullscreen(): void;
}

export function useKeyboard(engine: TimerEngine, handlers: KeyboardHandlers): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack typing in inputs (matters once the builder shares the page).
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        if (e.code === 'Escape') handlers.closeFullscreen();
        return;
      }
      if (e.code === 'Escape') handlers.closeFullscreen();
      else if (e.code === 'KeyF') handlers.openFullscreen();
      else if (e.code === 'Space' && engine.index >= 0) {
        e.preventDefault();
        engine.toggle();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [engine, handlers]);
}
