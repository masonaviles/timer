import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { act } from 'preact/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { createSampleTimer } from '../src/data/presets.js';
import { TimerEngine } from '../src/engine/TimerEngine.js';
import { createFakeClock, manualTicker } from '../src/engine/clock.js';
import { Player } from '../src/view/Player.js';

afterEach(cleanup);

function renderPlayer() {
  const clock = createFakeClock(0);
  const ticker = manualTicker();
  const engine = new TimerEngine(createSampleTimer(), { clock, ticker });
  const utils = render(<Player engine={engine} />);
  const clockEl = () => utils.container.querySelector('.cs-clock') as HTMLElement;
  const root = () => utils.container.querySelector('.cuestack') as HTMLElement;
  return { engine, clock, ticker, clockEl, root, ...utils };
}

describe('Player — initial render (parity)', () => {
  it('shows the brand, step list, and total', () => {
    renderPlayer();
    expect(screen.getByText('CueStack')).toBeTruthy(); // brandAccent highlighted
    expect(screen.getByText('Welcome Prompt & Recap')).toBeTruthy();
    expect(screen.getByText(/19 steps/)).toBeTruthy();
  });

  it('starts idle: 00:00 and STANDBY', () => {
    const { clockEl } = renderPlayer();
    expect(clockEl().textContent).toBe('00:00');
    expect(screen.getByText('STANDBY')).toBeTruthy();
  });

  it('applies the theme as CSS custom properties on the root', () => {
    const { root } = renderPlayer();
    expect(root().style.getPropertyValue('--accent')).toBe('#f5a623');
  });
});

describe('Player — selecting a step', () => {
  it('shows the step name, number, and full duration', () => {
    const { clockEl } = renderPlayer();
    fireEvent.click(screen.getByRole('button', { name: /Welcome Prompt & Recap/ }));
    expect(clockEl().textContent).toBe('20:00');
    expect(screen.getByText('STEP 1 OF 19')).toBeTruthy();
    expect(screen.getByText(/next: Family Journal Time/)).toBeTruthy();
  });
});

describe('Player — controls', () => {
  it('start toggles to pause and reports RUNNING', () => {
    renderPlayer();
    fireEvent.click(screen.getByRole('button', { name: /Welcome Prompt & Recap/ }));
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    expect(screen.getByRole('button', { name: /Pause/ })).toBeTruthy();
    expect(screen.getByText('RUNNING')).toBeTruthy();
  });

  it('reset returns the clock to the full duration', () => {
    const { clock, ticker, clockEl } = renderPlayer();
    fireEvent.click(screen.getByRole('button', { name: /Welcome Prompt & Recap/ }));
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    act(() => {
      clock.advance(60_000);
      ticker.fire();
    });
    expect(clockEl().textContent).toBe('19:00');
    fireEvent.click(screen.getByRole('button', { name: /Reset/ }));
    expect(clockEl().textContent).toBe('20:00');
  });
});

describe('Player — edge cases', () => {
  it('shows an empty state and disables Start with zero steps', () => {
    const empty = { ...createSampleTimer(), steps: [] };
    const engine = new TimerEngine(empty, { clock: createFakeClock(0), ticker: manualTicker() });
    render(<Player engine={engine} />);
    expect(screen.getByText('No steps yet.')).toBeTruthy();
    expect((screen.getByRole('button', { name: /Start/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('renders a very long step name in the truncating element without crashing', () => {
    const longName = 'A'.repeat(300);
    const cfg = {
      ...createSampleTimer(),
      steps: [{ id: 'x', name: longName, durationSecs: 60 }],
    };
    const engine = new TimerEngine(cfg, { clock: createFakeClock(0), ticker: manualTicker() });
    const { container } = render(<Player engine={engine} />);
    // The name sits in .cs-cue-nm (CSS applies white-space/overflow/ellipsis — verified visually).
    const nameEl = container.querySelector('.cs-cue-nm') as HTMLElement;
    expect(nameEl.textContent).toBe(longName);
  });
});

describe('Player — urgency colours', () => {
  it('escalates the clock to danger near the end', () => {
    const { clock, ticker, clockEl } = renderPlayer();
    fireEvent.click(screen.getByRole('button', { name: /Welcome Prompt & Recap/ })); // 1200s
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    act(() => {
      clock.advance(1_150_000); // 50s left -> ~4% -> danger
      ticker.fire();
    });
    expect(clockEl().textContent).toBe('00:50');
    expect(clockEl().classList.contains('danger')).toBe(true);
    expect(screen.getByText('URGENT')).toBeTruthy();
  });
});
