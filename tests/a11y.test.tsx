import { cleanup, render } from '@testing-library/preact';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EXAMPLE_OFFERINGS } from '../src/ads/index.js';
import { createSampleTimer } from '../src/data/presets.js';
import { TimerEngine } from '../src/engine/TimerEngine.js';
import { createFakeClock, manualTicker } from '../src/engine/clock.js';
import { LocalStorageRepository } from '../src/persistence/repository.js';
import { AdSlot } from '../src/view/AdSlot.js';
import { Builder } from '../src/view/Builder.js';
import { Player } from '../src/view/Player.js';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

/** Run axe over a container, returning offending rule ids. Contrast is excluded because
 *  jsdom has no layout to compute it (covered in the manual/cross-browser pass). */
async function violationIds(container: Element): Promise<string[]> {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations.map((v) => v.id);
}

describe('accessibility (axe, WCAG 2.0 A/AA)', () => {
  it('Player has no violations', async () => {
    const engine = new TimerEngine(createSampleTimer(), {
      clock: createFakeClock(0),
      ticker: manualTicker(),
    });
    const { container } = render(<Player engine={engine} />);
    expect(await violationIds(container)).toEqual([]);
  });

  it('Builder has no violations', async () => {
    const { container } = render(
      <Builder initialConfig={createSampleTimer()} repository={new LocalStorageRepository()} />,
    );
    expect(await violationIds(container)).toEqual([]);
  });

  it('AdSlot (self-promo) has no violations', async () => {
    const { container } = render(
      <AdSlot strategy={{ kind: 'selfPromo', offerings: EXAMPLE_OFFERINGS }} />,
    );
    expect(await violationIds(container)).toEqual([]);
  });
});
