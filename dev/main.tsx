// Standalone dev app — demonstrates the full Phase 4 flow:
//  - boot resolves config from ?t= / ?id= / draft / sample
//  - Builder ⇄ Player navigation
//  - share links, local saves, theming
// (Astro routes replace this shell in Phase 5.)

import { render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { createSampleTimer } from '../src/data/presets.js';
import type { TimerConfig } from '../src/data/schema.js';
import { TimerEngine } from '../src/engine/TimerEngine.js';
import { LocalStorageRepository, resolvePlayerConfig } from '../src/persistence/index.js';
import { Builder } from '../src/view/Builder.js';
import { Player } from '../src/view/Player.js';

const repository = new LocalStorageRepository();

function App() {
  const [mode, setMode] = useState<'loading' | 'builder' | 'player'>('loading');
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
      {mode === 'builder' ? (
        <Builder
          initialConfig={config}
          repository={repository}
          onOpenInPlayer={(c) => {
            setConfig(c);
            setMode('player');
          }}
        />
      ) : (
        <Player engine={engine} />
      )}

      <div style={tab}>
        <button type="button" style={btn(mode === 'builder')} onClick={() => setMode('builder')}>
          Builder
        </button>
        <button type="button" style={btn(mode === 'player')} onClick={() => setMode('player')}>
          Player
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
