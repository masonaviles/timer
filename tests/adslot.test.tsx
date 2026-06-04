import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { EXAMPLE_OFFERINGS } from '../src/ads/index.js';
import { AdSlot } from '../src/view/AdSlot.js';

afterEach(cleanup);

describe('AdSlot', () => {
  it('renders self-promo offerings and sets no cookies', () => {
    document.cookie = ''; // baseline
    const { container } = render(
      <AdSlot strategy={{ kind: 'selfPromo', offerings: EXAMPLE_OFFERINGS }} />,
    );
    expect(screen.getByText('Work with me 1:1')).toBeTruthy();
    expect(container.querySelectorAll('.cs-ad-card')).toHaveLength(2);
    expect(document.cookie).toBe(''); // privacy-safe: no advertising cookies
  });

  it('renders nothing for the none strategy', () => {
    const { container } = render(<AdSlot strategy={{ kind: 'none' }} />);
    expect(container.querySelector('.cs-ad')).toBeNull();
  });

  it('renders nothing for a network strategy before consent', () => {
    const { container } = render(
      <AdSlot strategy={{ kind: 'network', provider: 'adsense', slotId: 'x' }} consent={false} />,
    );
    expect(container.querySelector('.cs-ad')).toBeNull();
  });

  it('renders the network slot after consent', () => {
    const { container } = render(
      <AdSlot strategy={{ kind: 'network', provider: 'adsense', slotId: 'x' }} consent={true} />,
    );
    expect(container.querySelector('.cs-ad-network')).toBeTruthy();
  });
});
