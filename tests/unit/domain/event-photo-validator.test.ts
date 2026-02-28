import { describe, it, expect } from 'vitest';
import { validarVincularFoto } from '../../../src/domain/validators/event-photo-validator';
import { LinkPhotoInput } from '../../../src/domain/models/event-photo';

describe('validarVincularFoto', () => {
  const inputValido: LinkPhotoInput = {
    eventoId: 'evento-123',
    googlePhotosUrl: 'https://photos.google.com/photo/abc123',
    googlePhotosId: 'abc123',
    descripcion: 'Receta médica',
  };

  it('debe validar correctamente un input completo', () => {
    const resultado = validarVincularFoto(inputValido);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('debe rechazar eventoId vacío', () => {
    const resultado = validarVincularFoto({ ...inputValido, eventoId: '' });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContainEqual(
      expect.objectContaining({ campo: 'eventoId' })
    );
  });

  it('debe rechazar googlePhotosUrl vacío', () => {
    const resultado = validarVincularFoto({ ...inputValido, googlePhotosUrl: '' });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContainEqual(
      expect.objectContaining({ campo: 'googlePhotosUrl' })
    );
  });

  it('debe rechazar googlePhotosId vacío', () => {
    const resultado = validarVincularFoto({ ...inputValido, googlePhotosId: '' });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContainEqual(
      expect.objectContaining({ campo: 'googlePhotosId' })
    );
  });

  it('debe aceptar input sin descripción (es opcional)', () => {
    const { descripcion, ...sinDescripcion } = inputValido;
    const resultado = validarVincularFoto(sinDescripcion as LinkPhotoInput);
    expect(resultado.valido).toBe(true);
  });

  it('debe reportar múltiples errores simultáneamente', () => {
    const resultado = validarVincularFoto({
      eventoId: '',
      googlePhotosUrl: '',
      googlePhotosId: '',
    });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toHaveLength(3);
  });
});
