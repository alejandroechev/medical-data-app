import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNavigation } from '../../../src/ui/hooks/useNavigation';

describe('useNavigation', () => {
  it('debe iniciar en la página de inicio', () => {
    const { result } = renderHook(() => useNavigation());
    expect(result.current.currentPage).toBe('inicio');
    expect(result.current.params).toEqual({});
  });

  it('debe navegar a otra página', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => {
      result.current.navigateTo('nuevo-evento');
    });
    expect(result.current.currentPage).toBe('nuevo-evento');
  });

  it('debe navegar con parámetros', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => {
      result.current.navigateTo('detalle-evento', { eventoId: '123' });
    });
    expect(result.current.currentPage).toBe('detalle-evento');
    expect(result.current.params).toEqual({ eventoId: '123' });
  });

  it('debe volver a inicio con goBack', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => {
      result.current.navigateTo('historial');
    });
    expect(result.current.currentPage).toBe('historial');

    act(() => {
      result.current.goBack();
    });
    expect(result.current.currentPage).toBe('inicio');
    expect(result.current.params).toEqual({});
  });
});
