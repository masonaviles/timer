# Using the Step Timer

A short guide for people *running* a timer (no code). For developer/embedding docs, see the
[README](../README.md) and [examples/astro](../examples/astro/README.md).

## Build your timer

Open the **builder** (the ✎ Build screen, or `/utilities/timer/builder` on the site).

1. **Title** — set the name shown in the header. Optionally set a **highlighted word** to
   show in your accent colour.
2. **Steps** — add a row per segment. Type a name and a duration as **`mm:ss`** (or
   `h:mm:ss` for long steps, e.g. `1:00:00` for an hour). Reorder with **↑ / ↓**, delete
   with **✕**. Durations are stored to the second.
3. **Theme** — pick a preset (Retreat Amber, Midnight, Forest, Daylight) or set a **custom
   accent** colour. The preview updates live.
4. **Options** — toggle the end-of-step **audio alert** and the **progress bar**.

## Save it

Type a name under **Saved timers** and click **Save** — it's stored in this browser. Reopen
the builder anytime to **load** or **delete** saved timers. Your in-progress edits also
autosave as a draft, so a refresh won't lose your work.

## Share it

Click **Copy share link**. The link contains the whole timer — title, steps, theme — so
anyone who opens it gets exactly your timer, no account needed.

- If a timer is very large, the link gets long; you'll be warned that such a link only works
  on **this device** (it falls back to a local copy). Trim steps for a fully portable link.
- A broken or truncated link won't error — it loads a sample with a small notice.

## Run it

Open the **player** (or the share link):

- Click a step in the list to load it, then **Start** (or press **Space**).
- **Pause** with Space again; **Reset** returns the step to full time.
- The clock and progress bar turn **amber** as time runs low and **red** when it's nearly up;
  the status label also says WARNING / URGENT, so it's not colour-only.
- At zero it flashes and beeps (if audio is on) and shows **Time's Up**.
- Press **F** for fullscreen (great for a projector), **Esc** to exit.

## Accessibility notes

- Everything is keyboard-operable with visible focus; step changes and "time's up" are
  announced to screen readers.
- If your system prefers reduced motion, the flashing is suppressed (the banner + colour
  still signal the end).
