import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNavigation } from '../../../src/ui/hooks/useNavigation';

describe('useNavigation', () => {
  it('should start on the home page', () => {
    const { result } = renderHook(() => useNavigation());
    expect(result.current.currentPage).toBe('inicio');
    expect(result.current.params).toEqual({});
  });

  it('should navigate to another page', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => {
      result.current.navigateTo('nuevo-evento');
    });
    expect(result.current.currentPage).toBe('nuevo-evento');
  });

  it('should navigate with parameters', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => {
      result.current.navigateTo('detalle-evento', { eventoId: '123' });
    });
    expect(result.current.currentPage).toBe('detalle-evento');
    expect(result.current.params).toEqual({ eventoId: '123' });
  });

  it('should go back to home with goBack', () => {
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
