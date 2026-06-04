# Phase 4 — Builder, Persistence & Sharing

> **Goal:** non-technical users compose/edit a timer, save it locally, and share the whole
> thing via a link — no account, no backend.

- **Depends on:** Phases 1–3.
- **Unblocks:** Phase 5 (Astro routes for player + builder).
- **Confirm before starting:** **A1** — the builder is stateful form-heavy UI; if the player
  stayed vanilla, consider Preact here. Engine/codec stay framework-free regardless.
- **Related:** [Architecture · persistence](../02-ARCHITECTURE.md#persistence-srcpersistence) · [Gherkin: Builder](../04-GHERKIN-SPEC.md#feature-builder-phase4) · [Gherkin: Share & restore](../04-GHERKIN-SPEC.md#feature-share--restore-phase4) · [Gherkin: Local saves](../04-GHERKIN-SPEC.md#feature-local-saves-phase4)

---

## Objectives

1. Builder UI: edit timer title/brand accent; add/edit/delete/reorder steps; pick theme +
   custom accent; live player preview.
2. `ConfigCodec`: lossless `encode`/`decode` of a `TimerConfig` to a compressed URL param.
3. `ConfigRepository` + `LocalStorageRepository`: named saves + autosaved working draft.
4. Share + restore flow: copy link, open in player; player reads `?t=`/`?id=` on load.
5. Migration scaffold exercised on every decode.

## Task breakdown

### Persistence
- [ ] `persistence/codec.ts`
  - `encodeConfig(c): string` → `validate` → `JSON.stringify` → LZ compress
    (`compressToEncodedURIComponent`) → URL-safe string.
  - `decodeConfig(param): TimerConfig` → decompress → `JSON.parse` → `migrate` → `validate`.
  - `MAX_URL_LENGTH` (~1800) guard; expose `willOverflow(c): boolean`.
  - Throw a typed `CodecError` on malformed input (caller recovers to default + notice).
- [ ] `persistence/repository.ts`
  - `interface ConfigRepository { list; load; save; remove }` (see Architecture).
  - `LocalStorageRepository` with namespaced keys `cuestack:save:<id>`, index `cuestack:index`,
    draft `cuestack:draft`. `save` returns a generated id; `list` returns `SavedTimerMeta`.
- [ ] `data/migrate.ts` — `migrate(raw): TimerConfig` switching on `raw.version`; v1 = identity.
      Always run before `validate` on decode.

### Builder UI
- [ ] Step editor: add row, inline edit name, duration as **mm:ss** input (convert ⇄ seconds),
      delete, reorder (drag-and-drop or up/down buttons — buttons are the a11y-safe baseline).
- [ ] Stable `Step.id` on add (nanoid) so reorder/edit don't lose the active pointer.
- [ ] Timer meta: title + optional brand accent word.
- [ ] Theme controls: preset dropdown + custom accent colour picker (reuse Phase 3 merge helper).
- [ ] Live preview: an embedded `PlayerView` bound to the working config; updates on edit.
- [ ] Validation surfaced inline: blank name rejected, `00:00`/negative duration rejected.
- [ ] Actions: **Save as…**, **Load saved**, **Delete saved**, **Copy share link**, **Open in player**.
- [ ] Autosave the working draft on change (debounced) to `cuestack:draft`; restore on load.

### Player load path
- [ ] On player boot, resolve config in priority order:
  `?t=` (decode) → `?id=` (repository load) → `cuestack:draft` → `SAMPLE_TIMER`.
- [ ] On `CodecError`/missing id: load `SAMPLE_TIMER` + show a non-blocking notice.

### Share overflow handling
- [ ] If `willOverflow`, save to a local slug and produce `?id=<slug>`; **warn the user** the
      link is local-only to this device. Never silently truncate.

## Deliverables

`persistence/codec.ts`, `persistence/repository.ts`, `data/migrate.ts`, `view/BuilderView.*`,
step-editor + theme-control subcomponents, share/restore wiring, and tests.

## Implementation notes

- The codec is the **one** place the share format is defined. Anything reading/writing links
  goes through it. Keep it small and ~100% tested — it's the compatibility boundary.
- Repository is an interface so a future `ApiRepository` swaps in unchanged (protects the
  "no backend now" decision). Don't let callers touch `localStorage` directly.
- Duration UI is mm:ss; the model is seconds. Convert at the input boundary only.
- Reorder must operate on `Step.id`, not array index, to keep the engine's active step stable.

## Testing approach

- Codec round-trip: `decode(encode(c))` deep-equals `c` for several configs incl. unicode names.
- Overflow: a large config triggers the slug fallback path.
- Migrate: a v1 blob passes through; a bumped-version fixture proves the switch is exercised.
- Repository: save→list→load→remove lifecycle; draft autosave/restore.
- Builder: add/edit/reorder/delete; validation rejections; mm:ss⇄seconds; live preview updates.

## Exit criteria

- A built, themed timer round-trips URL→player with no data loss within the size cap.
- Oversize configs fall back to a slug with a visible warning.
- Named saves + working draft persist across reloads.
- Malformed `?t=` recovers to the sample with a notice.

## Demo

Build a 3-step themed timer, copy the link, open it in a fresh tab → identical. Save it,
reload, reload the saved copy. Paste a garbage `?t=` and show graceful recovery.

## Handoff to Phase 5

Player + builder are framework-islands that read/write config via codec + repository. Phase 5
mounts them as Astro routes and resolves `?t=`/`?id=` from the request URL.
