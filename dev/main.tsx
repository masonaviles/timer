// Standalone dev app — demonstrates the full Phase 4 flow:
//  - boot resolves config from ?t= / ?id= / draft / sample
//  - Builder ⇄ Player navigation
//  - share links, local saves, theming
// (Astro routes replace this shell in Phase 5.)

import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { EXAMPLE_OFFERINGS } from '../src/ads/index.js';
import { RETREAT_AMBER, createSampleTimer } from '../src/data/presets.js';
import type { TimerConfig } from '../src/data/schema.js';
import { TimerEngine } from '../src/engine/TimerEngine.js';
import { LocalStorageRepository, resolvePlayerConfig } from '../src/persistence/index.js';
import { AdSlot } from '../src/view/AdSlot.js';
import { Builder } from '../src/view/Builder.js';
import { Player } from '../src/view/Player.js';
import { applyTheme } from '../src/view/theme.js';

const repository = new LocalStorageRepository();

function AdsDemo() {
  const [consent, setConsent] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // The AdSlot's CSS reads theme tokens; outside a Player, apply a theme to the root.
  useEffect(() => {
    if (ref.current) applyTheme(ref.current, RETREAT_AMBER);
  }, []);
  const col = 'display:flex;flex-direction:column;gap:6px;width:280px';
  const h =
    'font:600 11px var(--font-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--dim)';
  return (
    <div
      class="cuestack"
      ref={ref}
      style="height:100%;align-items:center;justify-content:center;flex-direction:row;gap:28px;flex-wrap:wrap"
    >
      <div style={col}>
        <div style={h}>selfPromo</div>
        <AdSlot strategy={{ kind: 'selfPromo', offerings: EXAMPLE_OFFERINGS }} />
      </div>
      <div style={col}>
        <div style={h}>network (consent: {consent ? 'granted' : 'denied'})</div>
        <button
          type="button"
          class="cs-hbtn"
          onClick={() => setConsent((c) => !c)}
          style="align-self:flex-start"
        >
          {consent ? 'Revoke consent' : 'Grant consent'}
        </button>
        <AdSlot
          strategy={{ kind: 'network', provider: 'adsense', slotId: 'demo-1' }}
          consent={consent}
        />
      </div>
      <div style={col}>
        <div style={h}>none (clean)</div>
        <AdSlot strategy={{ kind: 'none' }} />
        <div style="font:11px var(--font-mono);color:var(--faint)">— renders nothing —</div>
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<'loading' | 'builder' | 'player' | 'ads'>('loading');
  const [config, setConfig] = useState<TimerConfig>(() => createSampleTimer());
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    resolvePlayerConfig({ repository, fallback: createSampleTimer }).then((res) => {
      setConfig(res.config);
      setNotice(res.notice ?? null);
      // start in the player when a link/id was opened, else the builder
      setMode(res.source === 'link' || res.source === 'id' ? 'player' : 'builder');
    });
  }, []);

  const engine = useMemo(() => new TimerEngine(structuredClone(config)), [config]);

  if (mode === 'loading') return null;

  const tab: string =
    'position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:10002;display:flex;' +
    'gap:6px;background:#000a;border:1px solid #333;padding:5px;border-radius:9px;backdrop-filter:blur(6px)';
  const btn = (on: boolean) =>
    `cursor:pointer;border-radius:6px;padding:5px 12px;border:1px solid ${on ? '#f5a623' : '#444'};` +
    `background:${on ? '#f5a623' : '#1a1b20'};color:${on ? '#0d0e11' : '#ddd'};font:600 12px system-ui`;

  return (
    <>
      {mode === 'builder' && (
        <Builder
          initialConfig={config}
          repository={repository}
          onOpenInPlayer={(c) => {
            setConfig(c);
            setMode('player');
          }}
        />
      )}
      {mode === 'player' && <Player engine={engine} />}
      {mode === 'ads' && <AdsDemo />}

      <div style={tab}>
        <button type="button" style={btn(mode === 'builder')} onClick={() => setMode('builder')}>
          Builder
        </button>
        <button type="button" style={btn(mode === 'player')} onClick={() => setMode('player')}>
          Player
        </button>
        <button type="button" style={btn(mode === 'ads')} onClick={() => setMode('ads')}>
          Ads
        </button>
      </div>

      {notice && (
        <div style="position:fixed;bottom:26px;left:50%;transform:translateX(-50%);z-index:10002;background:#1a1b20;border:1px solid #e05c5c;color:#e8e6df;padding:10px 18px;border-radius:8px;font:12px system-ui">
          {notice}
        </div>
      )}
    </>
  );
}

const el = document.getElementById('app');
if (el) render(<App />, el);
