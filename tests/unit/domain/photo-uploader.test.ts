import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPhotoUploader } from '../../../src/infra/memory/photo-uploader';

describe('InMemoryPhotoUploader', () => {
  let uploader: InMemoryPhotoUploader;

  beforeEach(() => {
    uploader = new InMemoryPhotoUploader();
  });

  it('should upload a file and return a public URL', async () => {
    const file = new File(['test-content'], 'receta.jpg', { type: 'image/jpeg' });
    const result = await uploader.upload('event-123', file);

    expect(result.url).toContain('receta.jpg');
    expect(result.url).toContain('event-123');
    expect(result.fileName).toBe('receta.jpg');
  });

  it('should generate unique URLs for different uploads', async () => {
    const file1 = new File(['a'], 'photo1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['b'], 'photo2.jpg', { type: 'image/jpeg' });

    const r1 = await uploader.upload('event-1', file1);
    const r2 = await uploader.upload('event-1', file2);

    expect(r1.url).not.toBe(r2.url);
  });

  it('should delete an uploaded file', async () => {
    const file = new File(['test'], 'doc.jpg', { type: 'image/jpeg' });
    const { url } = await uploader.upload('event-1', file);

    await expect(uploader.delete(url)).resolves.not.toThrow();
  });
});
