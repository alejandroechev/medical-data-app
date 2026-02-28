import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventPhotoStore } from '../../../src/infra/memory/event-photo-store';

describe('InMemoryEventPhotoStore', () => {
  let store: InMemoryEventPhotoStore;

  beforeEach(() => {
    store = new InMemoryEventPhotoStore();
  });

  it('debe vincular una foto y retornarla con ID', async () => {
    const foto = await store.vincular({
      eventoId: 'ev-1',
      googlePhotosUrl: 'https://photos.google.com/photo/abc',
      googlePhotosId: 'abc',
      descripcion: 'Receta',
    });
    expect(foto.id).toBeDefined();
    expect(foto.eventoId).toBe('ev-1');
    expect(foto.googlePhotosUrl).toBe('https://photos.google.com/photo/abc');
    expect(foto.descripcion).toBe('Receta');
  });

  it('debe listar fotos por evento', async () => {
    await store.vincular({ eventoId: 'ev-1', googlePhotosUrl: 'url1', googlePhotosId: 'id1' });
    await store.vincular({ eventoId: 'ev-1', googlePhotosUrl: 'url2', googlePhotosId: 'id2' });
    await store.vincular({ eventoId: 'ev-2', googlePhotosUrl: 'url3', googlePhotosId: 'id3' });

    const fotos = await store.listarPorEvento('ev-1');
    expect(fotos).toHaveLength(2);
    expect(fotos.every((f) => f.eventoId === 'ev-1')).toBe(true);
  });

  it('debe retornar lista vacía para evento sin fotos', async () => {
    const fotos = await store.listarPorEvento('no-existe');
    expect(fotos).toEqual([]);
  });

  it('debe desvincular una foto por ID', async () => {
    const foto = await store.vincular({ eventoId: 'ev-1', googlePhotosUrl: 'url1', googlePhotosId: 'id1' });
    await store.desvincular(foto.id);
    const fotos = await store.listarPorEvento('ev-1');
    expect(fotos).toHaveLength(0);
  });
});
