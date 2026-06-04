import { beforeEach, describe, expect, it } from 'vitest';
import { createSampleTimer } from '../src/data/presets.js';
import { encodeConfig } from '../src/persistence/codec.js';
import { LocalStorageRepository, saveDraft } from '../src/persistence/repository.js';
import { resolvePlayerConfig } from '../src/persistence/resolve.js';

const fallback = () => createSampleTimer();

beforeEach(() => {
  localStorage.clear();
});

describe('resolvePlayerConfig', () => {
  it('decodes a ?t= share link', async () => {
    const c = createSampleTimer();
    c.title = 'Shared Timer';
    const res = await resolvePlayerConfig({ search: `?t=${encodeConfig(c)}`, fallback });
    expect(res.source).toBe('link');
    expect(res.config.title).toBe('Shared Timer');
    expect(res.notice).toBeUndefined();
  });

  it('recovers from a malformed ?t= with a notice', async () => {
    const res = await resolvePlayerConfig({ search: '?t=garbage!!!', fallback });
    expect(res.source).toBe('fallback');
    expect(res.notice).toBeTruthy();
    expect(res.config.title).toBe('Sample Retreat');
  });

  it('loads a ?id= slug from the repository', async () => {
    const repository = new LocalStorageRepository();
    const c = createSampleTimer();
    c.title = 'Slug Timer';
    const id = await repository.save('slug', c);
    const res = await resolvePlayerConfig({ search: `?id=${id}`, repository, fallback });
    expect(res.source).toBe('id');
    expect(res.config.title).toBe('Slug Timer');
  });

  it('notes a missing ?id= and falls back', async () => {
    const repository = new LocalStorageRepository();
    const res = await resolvePlayerConfig({ search: '?id=nope', repository, fallback });
    expect(res.source).toBe('fallback');
    expect(res.notice).toBeTruthy();
  });

  it('uses the draft when no params are present', async () => {
    const c = createSampleTimer();
    c.title = 'Draft Timer';
    saveDraft(c);
    const res = await resolvePlayerConfig({ search: '', fallback });
    expect(res.source).toBe('draft');
    expect(res.config.title).toBe('Draft Timer');
  });

  it('falls back to the sample when nothing resolves', async () => {
    const res = await resolvePlayerConfig({ search: '', fallback });
    expect(res.source).toBe('fallback');
    expect(res.config.title).toBe('Sample Retreat');
  });
});
