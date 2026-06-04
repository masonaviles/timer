// View layer — pluggable ad slot (Strategy pattern; ADR-003). Renders self-promo offerings,
// a consent-gated network placeholder, or nothing. Ads belong in the page SHELL, not inside
// the player/builder island, so the tool stays clean and reusable.

import { type AdStrategy, resolveAd } from '../ads/index.js';
import './styles.css';

export interface AdSlotProps {
  strategy: AdStrategy;
  /** Whether the user has granted consent (only gates the `network` strategy). */
  consent?: boolean;
  /** Optional label shown above the slot. */
  label?: string;
}

export function AdSlot({ strategy, consent = false, label = 'Sponsored' }: AdSlotProps) {
  const render = resolveAd(strategy, consent);

  if (render.kind === 'empty') return null;

  if (render.kind === 'network') {
    // Real deployments inject the provider script here (after consent). Placeholder for now.
    return (
      <aside class="cs-ad" aria-label="Advertisement">
        <div class="cs-ad-tag">{label}</div>
        <div class="cs-ad-network" data-provider={render.provider} data-slot={render.slotId}>
          network ad · {render.provider}
        </div>
      </aside>
    );
  }

  return (
    <aside class="cs-ad" aria-label="Sponsored">
      <div class="cs-ad-tag">{label}</div>
      {render.offerings.map((o) => (
        <a class="cs-ad-card" key={o.href + o.title} href={o.href}>
          <div class="cs-ad-title">{o.title}</div>
          <div class="cs-ad-blurb">{o.blurb}</div>
          {o.cta && <span class="cs-ad-cta">{o.cta} →</span>}
        </a>
      ))}
    </aside>
  );
}
