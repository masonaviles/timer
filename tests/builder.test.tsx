import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RETREAT_AMBER } from '../src/data/presets.js';
import type { TimerConfig } from '../src/data/schema.js';
import { LocalStorageRepository } from '../src/persistence/repository.js';
import { Builder } from '../src/view/Builder.js';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

function cfg(): TimerConfig {
  return {
    version: 1,
    title: 'Test Timer',
    steps: [
      { id: 'a', name: 'Alpha', durationSecs: 60 },
      { id: 'b', name: 'Beta', durationSecs: 120 },
    ],
    theme: structuredClone(RETREAT_AMBER),
    options: { audioAlert: true, autoAdvance: false, showProgressBar: true },
  };
}

function renderBuilder() {
  const captured: { config?: TimerConfig } = {};
  const repository = new LocalStorageRepository();
  const utils = render(
    <Builder
      initialConfig={cfg()}
      repository={repository}
      baseUrl="https://example.com/utilities/timer"
      onOpenInPlayer={(c) => {
        captured.config = c;
      }}
    />,
  );
  const openInPlayer = () =>
    fireEvent.click(screen.getByRole('button', { name: /Open in player/ }));
  return { captured, repository, openInPlayer, ...utils };
}

describe('Builder — steps', () => {
  it('adds, reorders, and deletes steps', () => {
    const { captured, openInPlayer } = renderBuilder();

    fireEvent.click(screen.getByRole('button', { name: /Add step/ }));
    openInPlayer();
    expect(captured.config?.steps).toHaveLength(3);

    // move Beta above Alpha (second row's up button)
    fireEvent.click(screen.getAllByTitle('Move up')[1] as HTMLElement);
    openInPlayer();
    expect(captured.config?.steps[0]?.name).toBe('Beta');

    // delete the first row
    fireEvent.click(screen.getAllByTitle('Delete')[0] as HTMLElement);
    openInPlayer();
    expect(captured.config?.steps[0]?.name).toBe('Alpha');
  });

  it('stores mm:ss durations as seconds', () => {
    const { captured, openInPlayer } = renderBuilder();
    fireEvent.input(screen.getByLabelText('Step 1 duration'), { target: { value: '1:30' } });
    openInPlayer();
    expect(captured.config?.steps[0]?.durationSecs).toBe(90);
  });

  it('flags a blank name and skips it from the exported config', () => {
    const { captured, openInPlayer } = renderBuilder();
    fireEvent.input(screen.getByLabelText('Step 1 name'), { target: { value: '' } });
    expect(screen.getByText('Name required')).toBeTruthy();
    openInPlayer();
    // validateConfig drops the blank step
    expect(captured.config?.steps).toHaveLength(1);
    expect(captured.config?.steps[0]?.name).toBe('Beta');
  });
});

describe('Builder — live preview', () => {
  it('reflects a title edit in the player preview', async () => {
    renderBuilder();
    fireEvent.input(screen.getByLabelText('Timer title'), { target: { value: 'Workshop Clock' } });
    await waitFor(() => expect(screen.getByText('Workshop Clock')).toBeTruthy());
  });
});

describe('Builder — local saves', () => {
  it('saves a named timer and loads it back', async () => {
    const { repository } = renderBuilder();
    fireEvent.input(screen.getByPlaceholderText('Name this timer'), {
      target: { value: 'Morning Retreat' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Morning Retreat' })).toBeTruthy(),
    );
    const saved = await repository.list();
    expect(saved[0]?.name).toBe('Morning Retreat');
  });
});

describe('Builder — share', () => {
  it('copies a ?t= share link to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderBuilder();
    fireEvent.click(screen.getByRole('button', { name: /Copy share link/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0]?.[0]).toContain('?t=');
  });
});
