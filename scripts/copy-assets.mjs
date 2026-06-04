// Copy non-TS assets (CSS) from src/ into dist/, preserving paths.
// tsc emits .js/.d.ts but leaves `import './styles.css'` statements pointing at files it
// doesn't copy; this fills that gap so the published package ships its stylesheet.

import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const SRC = 'src';
const DIST = 'dist';

/** @param {string} dir */
function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let copied = 0;
for (const file of walk(SRC)) {
  if (!file.endsWith('.css')) continue;
  const dest = join(DIST, relative(SRC, file));
  if (!existsSync(dirname(dest))) mkdirSync(dirname(dest), { recursive: true });
  cpSync(file, dest);
  copied++;
}
console.log(`copy-assets: copied ${copied} css file(s) to ${DIST}/`);
