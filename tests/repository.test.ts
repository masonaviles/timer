import { beforeEach, describe, expect, it } from 'vitest';
import { createSampleTimer } from '../src/data/presets.js';
import {
  LocalStorageRepository,
  clearDraft,
  loadDraft,
  saveDraft,
} from '../src/persistence/repository.js';

beforeEach(() => {
  localStorage.clear();
});

function repo(now = () => 1000) {
  return new LocalStorageRepository({ now });
}

describe('LocalStorageRepository', () => {
  it('saves, lists, loads, and removes a config', async () => {
    const r = repo();
    const id = await r.save('Morning Retreat', createSampleTimer());

    const list = await r.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe('Morning Retreat');
    expect(list[0]?.updatedAt).toBe(1000);

    const loaded = await r.load(id);
    expect(loaded?.steps).toHaveLength(19);

    await r.remove(id);
    expect(await r.list()).toHaveLength(0);
    expect(await r.load(id)).toBeNull();
  });

  it('persists across repository instances (same storage)', async () => {
    const id = await repo().save('Keep', createSampleTimer());
    const fresh = repo();
    expect((await fresh.list()).map((m) => m.id)).toContain(id);
    expect(await fresh.load(id)).not.toBeNull();
  });

  it('lists most-recent first', async () => {
    let t = 0;
    const r = new LocalStorageRepository({
      now: () => {
        t += 1000;
        return t;
      },
    });
    await r.save('first', createSampleTimer());
    await r.save('second', createSampleTimer());
    const list = await r.list();
    expect(list[0]?.name).toBe('second');
    expect(list[1]?.name).toBe('first');
  });

  it('returns null for an unknown id', async () => {
    expect(await repo().load('missing')).toBeNull();
  });
});

describe('working draft', () => {
  it('saves, loads, and clears the draft', () => {
    expect(loadDraft()).toBeNull();
    const c = createSampleTimer();
    c.title = 'Draft In Progress';
    saveDraft(c);
    expect(loadDraft()?.title).toBe('Draft In Progress');
    clearDraft();
    expect(loadDraft()).toBeNull();
  });
});
