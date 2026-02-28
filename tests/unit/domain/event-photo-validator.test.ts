import { describe, it, expect } from 'vitest';
import { validateLinkPhoto } from '../../../src/domain/validators/event-photo-validator';
import { LinkPhotoInput } from '../../../src/domain/models/event-photo';

describe('validateLinkPhoto', () => {
  const validInput: LinkPhotoInput = {
    eventId: 'evento-123',
    googlePhotosUrl: 'https://photos.google.com/photo/abc123',
    googlePhotosId: 'abc123',
    description: 'Receta médica',
  };

  it('should validate a complete input', () => {
    const result = validateLinkPhoto(validInput);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty eventId', () => {
    const result = validateLinkPhoto({ ...validInput, eventId: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'eventId' })
    );
  });

  it('should reject empty googlePhotosUrl', () => {
    const result = validateLinkPhoto({ ...validInput, googlePhotosUrl: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'googlePhotosUrl' })
    );
  });

  it('should reject empty googlePhotosId', () => {
    const result = validateLinkPhoto({ ...validInput, googlePhotosId: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'googlePhotosId' })
    );
  });

  it('should accept input without description (optional)', () => {
    const { description, ...withoutDescription } = validInput;
    const result = validateLinkPhoto(withoutDescription as LinkPhotoInput);
    expect(result.valid).toBe(true);
  });

  it('should report multiple errors simultaneously', () => {
    const result = validateLinkPhoto({
      eventId: '',
      googlePhotosUrl: '',
      googlePhotosId: '',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(3);
  });
});
