// View layer — the builder. Compose/edit a timer, theme it, save it locally, and share it.
// Holds the working config in state; a live Player preview reflects every edit. All durable
// concerns (validation, codec, storage) live in the framework-free layers below.

import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { PRESET_LIST, clonePreset, withAccent } from '../data/presets.js';
import type { Step, TimerConfig } from '../data/schema.js';
import { validateConfig } from '../data/validate.js';
import { TimerEngine } from '../engine/TimerEngine.js';
import { parseDuration, toDurationInput } from '../engine/format.js';
import {
  type ConfigRepository,
  LocalStorageRepository,
  type SavedTimerMeta,
  buildShareUrl,
  saveDraft,
} from '../persistence/index.js';
import { Player } from './Player.js';
import { applyTheme } from './theme.js';
import './styles.css';

export interface BuilderProps {
  initialConfig: TimerConfig;
  repository?: ConfigRepository;
  /** Base URL for share links (defaults to current origin + path). */
  baseUrl?: string;
  /** Called when the user clicks "Open in player" with a validated config. */
  onOpenInPlayer?: (config: TimerConfig) => void;
}

export function Builder(props: BuilderProps) {
  const repo = useMemo(() => props.repository ?? new LocalStorageRepository(), [props.repository]);
  const [config, setConfig] = useState<TimerConfig>(() => structuredClone(props.initialConfig));
  const [saves, setSaves] = useState<SavedTimerMeta[]>([]);
  const [saveName, setSaveName] = useState('');
  const [durDrafts, setDurDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const refreshSaves = useCallback(() => {
    repo.list().then(setSaves);
  }, [repo]);
  useEffect(() => {
    refreshSaves();
  }, [refreshSaves]);

  // Autosave the working draft (debounced).
  useEffect(() => {
    const id = setTimeout(() => saveDraft(config), 400);
    return () => clearTimeout(id);
  }, [config]);

  // Theme the builder chrome to match the timer being edited.
  useEffect(() => {
    if (rootRef.current) applyTheme(rootRef.current, config.theme);
  }, [config.theme]);

  // Live preview: one engine, reloaded with the working config on every edit.
  // biome-ignore lint/correctness/useExhaustiveDependencies: engine is created once; config drives load() below
  const previewEngine = useMemo(() => new TimerEngine(structuredClone(config)), []);
  useEffect(() => {
    previewEngine.load(structuredClone(config));
  }, [config, previewEngine]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  // ---- immutable config mutators ----
  const patch = (p: Partial<TimerConfig>) => setConfig((c) => ({ ...c, ...p }));
  const patchStep = (i: number, p: Partial<Step>) =>
    setConfig((c) => ({ ...c, steps: c.steps.map((s, j) => (j === i ? { ...s, ...p } : s)) }));
  const addStep = () =>
    setConfig((c) => ({
      ...c,
      steps: [
        ...c.steps,
        { id: crypto.randomUUID().slice(0, 8), name: 'New step', durationSecs: 300 },
      ],
    }));
  const removeStep = (i: number) =>
    setConfig((c) => ({ ...c, steps: c.steps.filter((_, j) => j !== i) }));
  const moveStep = (i: number, dir: -1 | 1) =>
    setConfig((c) => {
      const j = i + dir;
      const a = c.steps[i];
      const b = c.steps[j];
      if (!a || !b) return c;
      const steps = [...c.steps];
      steps[i] = b;
      steps[j] = a;
      return { ...c, steps };
    });
  const setOption = (k: keyof TimerConfig['options'], v: boolean) =>
    setConfig((c) => ({ ...c, options: { ...c.options, [k]: v } }));

  // ---- duration editing (drafts allow partial typing) ----
  const durValue = (s: Step) => durDrafts[s.id] ?? toDurationInput(s.durationSecs);
  const durError = (s: Step) => {
    const d = durDrafts[s.id];
    if (d === undefined) return null;
    const secs = parseDuration(d);
    return secs === null || secs <= 0 ? 'mm:ss > 0' : null;
  };
  const onDurInput = (i: number, id: string, value: string) => {
    setDurDrafts((d) => ({ ...d, [id]: value }));
    const secs = parseDuration(value);
    if (secs !== null && secs > 0) patchStep(i, { durationSecs: secs });
  };

  // ---- theme ----
  const setPreset = (key: string) => patch({ theme: clonePreset(key) });
  const setAccent = (hex: string) => patch({ theme: withAccent(config.theme, hex) });

  // ---- save / load / share ----
  const onSave = async () => {
    const name = saveName.trim() || config.title.trim() || 'Untitled Timer';
    await repo.save(name, config);
    setSaveName('');
    refreshSaves();
    showToast(`Saved "${name}"`);
  };
  const onLoad = async (id: string) => {
    const c = await repo.load(id);
    if (c) {
      setConfig(c);
      setDurDrafts({});
      showToast('Loaded');
    }
  };
  const onDelete = async (id: string) => {
    await repo.remove(id);
    refreshSaves();
  };
  const onCopyLink = async () => {
    const base =
      props.baseUrl ?? (typeof location !== 'undefined' ? location.origin + location.pathname : '');
    const link = buildShareUrl(base, config);
    let url = link.url;
    let msg = 'Share link copied';
    if (link.overflow) {
      const id = await repo.save(`${config.title} (shared)`, config);
      url = `${base}?id=${id}`;
      refreshSaves();
      msg = 'Link is large — saved locally; opens on this device only';
    }
    try {
      await navigator.clipboard?.writeText(url);
    } catch {
      // clipboard blocked — toast still informs the user
    }
    showToast(msg);
  };
  const onOpen = () => props.onOpenInPlayer?.(validateConfig(config));

  const invalidCount = config.steps.filter((s) => s.name.trim() === '').length;

  return (
    <div class="cs-builder cuestack" ref={rootRef}>
      <div class="cs-builder-form">
        <div class="cs-builder-head">
          <h2>Build Timer</h2>
        </div>

        <div class="cs-builder-body">
          <div class="cs-field">
            <label for="cs-b-title">Timer title</label>
            <input
              id="cs-b-title"
              class="cs-input"
              value={config.title}
              onInput={(e) => patch({ title: (e.target as HTMLInputElement).value })}
              placeholder="e.g. Morning Workshop"
            />
          </div>
          <div class="cs-field">
            <label for="cs-b-accentword">Highlighted word (optional)</label>
            <input
              id="cs-b-accentword"
              class="cs-input"
              value={config.brandAccent ?? ''}
              onInput={(e) => patch({ brandAccent: (e.target as HTMLInputElement).value })}
              placeholder="e.g. your brand"
            />
          </div>

          <div class="cs-section">Steps</div>
          {config.steps.map((s, i) => (
            <div class="cs-step-row" key={s.id}>
              <div class="cs-step-n">{i + 1}</div>
              <div class="cs-step-fields">
                <input
                  class="cs-input"
                  aria-label={`Step ${i + 1} name`}
                  value={s.name}
                  onInput={(e) => patchStep(i, { name: (e.target as HTMLInputElement).value })}
                  placeholder="Step name"
                />
                <input
                  class={`cs-input cs-dur ${durError(s) ? 'cs-invalid' : ''}`}
                  aria-label={`Step ${i + 1} duration`}
                  value={durValue(s)}
                  onInput={(e) => onDurInput(i, s.id, (e.target as HTMLInputElement).value)}
                  placeholder="mm:ss"
                />
              </div>
              <div class="cs-row-btns">
                <button
                  type="button"
                  class="cs-mini"
                  title="Move up"
                  disabled={i === 0}
                  onClick={() => moveStep(i, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  class="cs-mini"
                  title="Move down"
                  disabled={i === config.steps.length - 1}
                  onClick={() => moveStep(i, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  class="cs-mini cs-del"
                  title="Delete"
                  onClick={() => removeStep(i)}
                >
                  ✕
                </button>
              </div>
              {(durError(s) || s.name.trim() === '') && (
                <div class="cs-error">{s.name.trim() === '' ? 'Name required' : durError(s)}</div>
              )}
            </div>
          ))}
          <button type="button" class="cs-add-step" onClick={addStep}>
            + Add step
          </button>

          <div class="cs-section">Theme</div>
          <div class="cs-preset-grid">
            {PRESET_LIST.map((p) => (
              <button
                type="button"
                key={p.key}
                class={`cs-preset ${config.theme.preset === p.key ? 'sel' : ''}`}
                onClick={() => setPreset(p.key)}
              >
                <span class="cs-swatch" style={{ background: clonePreset(p.key).colors.accent }} />
                {p.label}
              </button>
            ))}
          </div>
          <div class="cs-field cs-accent-field">
            <label for="cs-b-accent">Custom accent</label>
            <input
              id="cs-b-accent"
              type="color"
              value={config.theme.colors.accent}
              onInput={(e) => setAccent((e.target as HTMLInputElement).value)}
            />
          </div>

          <div class="cs-section">Options</div>
          <label class="cs-check">
            <input
              type="checkbox"
              checked={config.options.audioAlert}
              onChange={(e) => setOption('audioAlert', (e.target as HTMLInputElement).checked)}
            />
            <span>Audio alert at step end</span>
          </label>
          <label class="cs-check">
            <input
              type="checkbox"
              checked={config.options.showProgressBar}
              onChange={(e) => setOption('showProgressBar', (e.target as HTMLInputElement).checked)}
            />
            <span>Show progress bar</span>
          </label>

          <div class="cs-section">Saved timers</div>
          <div class="cs-save-row">
            <input
              class="cs-input"
              aria-label="Name this timer"
              value={saveName}
              onInput={(e) => setSaveName((e.target as HTMLInputElement).value)}
              placeholder="Name this timer"
            />
            <button type="button" class="cs-hbtn" onClick={onSave}>
              Save
            </button>
          </div>
          {saves.map((m) => (
            <div class="cs-saved" key={m.id}>
              <button type="button" class="cs-saved-load" onClick={() => onLoad(m.id)}>
                {m.name}
              </button>
              <button
                type="button"
                class="cs-mini cs-del"
                title="Delete"
                onClick={() => onDelete(m.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div class="cs-builder-actions">
          {invalidCount > 0 && (
            <div class="cs-error">{invalidCount} step(s) need a name and will be skipped.</div>
          )}
          <div class="cs-builder-actions-row">
            <button type="button" class="cs-hbtn" onClick={onCopyLink}>
              ↗ Copy share link
            </button>
            <button type="button" class="cs-hbtn primary" onClick={onOpen}>
              ▶ Open in player
            </button>
          </div>
        </div>
      </div>

      <div class="cs-builder-preview">
        <Player engine={previewEngine} />
      </div>

      {toast && <div class="cs-toast show">{toast}</div>}
    </div>
  );
}
