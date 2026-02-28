import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventPhotoStore } from '../../../src/infra/memory/event-photo-store';

describe('InMemoryEventPhotoStore', () => {
  let store: InMemoryEventPhotoStore;

  beforeEach(() => {
    store = new InMemoryEventPhotoStore();
  });

  it('should link a photo and return it with ID', async () => {
    const photo = await store.link({
      eventId: 'ev-1',
      googlePhotosUrl: 'https://photos.google.com/photo/abc',
      googlePhotosId: 'abc',
      description: 'Receta',
    });
    expect(photo.id).toBeDefined();
    expect(photo.eventId).toBe('ev-1');
    expect(photo.googlePhotosUrl).toBe('https://photos.google.com/photo/abc');
    expect(photo.description).toBe('Receta');
  });

  it('should list photos by event', async () => {
    await store.link({ eventId: 'ev-1', googlePhotosUrl: 'url1', googlePhotosId: 'id1' });
    await store.link({ eventId: 'ev-1', googlePhotosUrl: 'url2', googlePhotosId: 'id2' });
    await store.link({ eventId: 'ev-2', googlePhotosUrl: 'url3', googlePhotosId: 'id3' });

    const photos = await store.listByEvent('ev-1');
    expect(photos).toHaveLength(2);
    expect(photos.every((f) => f.eventId === 'ev-1')).toBe(true);
  });

  it('should return empty list for event without photos', async () => {
    const photos = await store.listByEvent('no-existe');
    expect(photos).toEqual([]);
  });

  it('should unlink a photo by ID', async () => {
    const photo = await store.link({ eventId: 'ev-1', googlePhotosUrl: 'url1', googlePhotosId: 'id1' });
    await store.unlink(photo.id);
    const photos = await store.listByEvent('ev-1');
    expect(photos).toHaveLength(0);
  });
});
