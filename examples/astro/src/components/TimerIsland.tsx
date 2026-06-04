// Preact island for the player route. Resolves the config (?t= / ?id= / draft / sample)
// then renders the Player. Hydrate with client:load.
//
// Copy into the consuming Astro site (e.g. src/components/). Requires @astrojs/preact.

import { useEffect, useState } from 'preact/hooks';
import { createSampleTimer } from '@masonaviles/cuestack/data';
import { TimerEngine } from '@masonaviles/cuestack/engine';
import { LocalStorageRepository, resolvePlayerConfig } from '@masonaviles/cuestack/persistence';
import { Player } from '@masonaviles/cuestack/player';

interface Props {
  /** Pass Astro.url.search so SSR and client agree on which timer to load. */
  search?: string;
}

export default function TimerIsland({ search = '' }: Props) {
  const [engine, setEngine] = useState<TimerEngine | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const repository = new LocalStorageRepository();
    resolvePlayerConfig({
      search: search || location.search,
      repository,
      fallback: createSampleTimer,
    }).then((res) => {
      setNotice(res.notice ?? null);
      setEngine(new TimerEngine(res.config));
    });
  }, [search]);

  if (!engine) return null;
  return (
    <>
      <Player engine={engine} />
      {notice && (
        <p role="status" style="position:fixed;bottom:1rem;left:50%;transform:translateX(-50%)">
          {notice}
        </p>
      )}
    </>
  );
}
