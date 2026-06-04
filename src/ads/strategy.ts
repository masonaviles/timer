// Ads — pluggable slot strategy (ADR-003). One model, resolved by config + consent.
// Layout owns WHERE a slot is; config owns WHAT it renders. Framework-free + pure.

import type { Offering } from './offerings.js';

/** What a deployment configures a slot to be. */
export type AdStrategy =
  | { kind: 'selfPromo'; offerings: Offering[] }
  | { kind: 'network'; provider: 'adsense'; slotId: string }
  | { kind: 'none' };

/** What a renderer should actually draw, after applying the consent gate. */
export type AdRender =
  | { kind: 'selfPromo'; offerings: Offering[] }
  | { kind: 'network'; provider: 'adsense'; slotId: string }
  | { kind: 'empty' };

/**
 * Resolve a strategy to a concrete render, applying the consent gate:
 * - selfPromo and none need no consent (no cookies, no external scripts)
 * - network renders nothing until consent is granted
 */
export function resolveAd(strategy: AdStrategy, consent: boolean): AdRender {
  switch (strategy.kind) {
    case 'none':
      return { kind: 'empty' };
    case 'selfPromo':
      return { kind: 'selfPromo', offerings: strategy.offerings };
    case 'network':
      return consent
        ? { kind: 'network', provider: strategy.provider, slotId: strategy.slotId }
        : { kind: 'empty' };
  }
}

const CONSENT_KEY = 'cuestack:adconsent';

function storageOrNull(explicit?: Storage): Storage | null {
  if (explicit) return explicit;
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

/** Read the persisted ad-consent choice (default false / not granted). */
export function readConsent(storage?: Storage): boolean {
  return storageOrNull(storage)?.getItem(CONSENT_KEY) === 'granted';
}

/** Persist an ad-consent choice (the site's cookie banner calls this). */
export function writeConsent(granted: boolean, storage?: Storage): void {
  storageOrNull(storage)?.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
}
