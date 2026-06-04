import { beforeEach, describe, expect, it } from 'vitest';
import {
  type AdStrategy,
  EXAMPLE_OFFERINGS,
  readConsent,
  resolveAd,
  writeConsent,
} from '../src/ads/index.js';

beforeEach(() => localStorage.clear());

describe('resolveAd', () => {
  it('renders nothing for the none strategy', () => {
    expect(resolveAd({ kind: 'none' }, true)).toEqual({ kind: 'empty' });
  });

  it('renders self-promo offerings without needing consent', () => {
    const strategy: AdStrategy = { kind: 'selfPromo', offerings: EXAMPLE_OFFERINGS };
    const render = resolveAd(strategy, false);
    expect(render.kind).toBe('selfPromo');
    expect(render.kind === 'selfPromo' && render.offerings).toHaveLength(2);
  });

  it('gates the network strategy behind consent', () => {
    const strategy: AdStrategy = { kind: 'network', provider: 'adsense', slotId: 'abc' };
    expect(resolveAd(strategy, false)).toEqual({ kind: 'empty' });
    expect(resolveAd(strategy, true)).toEqual({
      kind: 'network',
      provider: 'adsense',
      slotId: 'abc',
    });
  });
});

describe('consent persistence', () => {
  it('defaults to not granted and round-trips a choice', () => {
    expect(readConsent()).toBe(false);
    writeConsent(true);
    expect(readConsent()).toBe(true);
    writeConsent(false);
    expect(readConsent()).toBe(false);
  });
});
