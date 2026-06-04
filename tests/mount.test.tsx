import { describe, expect, it } from 'vitest';
import { createSampleTimer } from '../src/data/presets.js';
import { createFakeClock, manualTicker } from '../src/engine/clock.js';
import { mountPlayer } from '../src/view/mount.js';

describe('mountPlayer', () => {
  it('renders a player into the element and unmounts cleanly', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const { engine, unmount } = mountPlayer(el, createSampleTimer(), {
      clock: createFakeClock(0),
      ticker: manualTicker(),
    });
    expect(el.querySelector('.cuestack')).toBeTruthy();
    expect(engine.config.steps).toHaveLength(19);
    unmount();
    expect(el.querySelector('.cuestack')).toBeNull();
    el.remove();
  });
});
