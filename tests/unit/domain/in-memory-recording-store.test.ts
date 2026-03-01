import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecordingStore } from '../../../src/infra/memory/recording-store';

describe('InMemoryRecordingStore', () => {
  let store: InMemoryRecordingStore;

  beforeEach(() => {
    store = new InMemoryRecordingStore();
  });

  it('should save a recording and return it with ID', async () => {
    const recording = await store.create({
      eventId: 'ev-1',
      recordingUrl: 'memory://recordings/test.webm',
      fileName: 'recording.webm',
      durationSeconds: 45,
      description: 'Doctor instructions',
    });
    expect(recording.id).toBeDefined();
    expect(recording.eventId).toBe('ev-1');
    expect(recording.fileName).toBe('recording.webm');
    expect(recording.durationSeconds).toBe(45);
  });

  it('should list recordings by event', async () => {
    await store.create({ eventId: 'ev-1', recordingUrl: 'url1', fileName: 'a.webm' });
    await store.create({ eventId: 'ev-1', recordingUrl: 'url2', fileName: 'b.webm' });
    await store.create({ eventId: 'ev-2', recordingUrl: 'url3', fileName: 'c.webm' });

    const list = await store.listByEvent('ev-1');
    expect(list).toHaveLength(2);
    expect(list.every((r) => r.eventId === 'ev-1')).toBe(true);
  });

  it('should return empty list for event with no recordings', async () => {
    const list = await store.listByEvent('no-existe');
    expect(list).toEqual([]);
  });

  it('should delete a recording', async () => {
    const recording = await store.create({ eventId: 'ev-1', recordingUrl: 'url', fileName: 'a.webm' });
    await store.delete(recording.id);
    const list = await store.listByEvent('ev-1');
    expect(list).toHaveLength(0);
  });
});
