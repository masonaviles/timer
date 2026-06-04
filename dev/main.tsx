// Standalone dev app — boots the Player and provides a dev-only preset + accent switcher
// to exercise the theming system. The real theme UI is the Phase 4 builder; this is throwaway.
// (Share-link loading via ?t= arrives in Phase 4; Astro routes in Phase 5.)

import { render } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { PRESET_LIST, clonePreset, createSampleTimer, withAccent } from '../src/data/presets.js';
import { TimerEngine } from '../src/engine/TimerEngine.js';
import { Player } from '../src/view/Player.js';

function Dev() {
  const [presetKey, setPresetKey] = useState('retreatAmber');
  const [accent, setAccent] = useState<string | null>(null);

  const engine = useMemo(() => {
    const cfg = createSampleTimer();
    const base = clonePreset(presetKey);
    cfg.theme = accent ? withAccent(base, accent) : base;
    return new TimerEngine(cfg);
  }, [presetKey, accent]);

  const bar: string =
    'position:fixed;z-index:10000;bottom:14px;left:50%;transform:translateX(-50%);' +
    'display:flex;gap:6px;align-items:center;background:#000a;border:1px solid #333;' +
    'padding:8px 10px;border-radius:10px;font:12px system-ui;backdrop-filter:blur(6px)';

  return (
    <>
      <Player key={`${presetKey}:${accent}`} engine={engine} />
      <div style={bar}>
        {PRESET_LIST.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              setPresetKey(p.key);
              setAccent(null);
            }}
            style={`cursor:pointer;border-radius:6px;padding:5px 9px;border:1px solid ${
              presetKey === p.key && !accent ? '#f5a623' : '#444'
            };background:#1a1b20;color:#ddd`}
          >
            {p.label}
          </button>
        ))}
        <input
          type="color"
          title="Custom accent"
          value={accent ?? '#f5a623'}
          onInput={(e) => setAccent((e.target as HTMLInputElement).value)}
          style="width:30px;height:26px;border:1px solid #444;border-radius:6px;background:#1a1b20;cursor:pointer"
        />
      </div>
    </>
  );
}

const el = document.getElementById('app');
if (el) render(<Dev />, el);
