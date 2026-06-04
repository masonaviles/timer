// Preact island for the builder route. Editor-only, so client:only="preact" is fine
// (no SSR needed). "Open in player" hands off via a ?t= share link.
//
// Copy into the consuming Astro site (e.g. src/components/). Requires @astrojs/preact.

import { createSampleTimer } from '@masonaviles/cuestack/data';
import { Builder } from '@masonaviles/cuestack/builder';
import { LocalStorageRepository, buildShareUrl, loadDraft } from '@masonaviles/cuestack/persistence';

export default function BuilderIsland() {
  const repository = new LocalStorageRepository();
  const initialConfig = loadDraft() ?? createSampleTimer();

  return (
    <Builder
      initialConfig={initialConfig}
      repository={repository}
      baseUrl="/utilities/timer"
      onOpenInPlayer={(config) => {
        const { url } = buildShareUrl('/utilities/timer', config);
        window.location.href = url;
      }}
    />
  );
}
