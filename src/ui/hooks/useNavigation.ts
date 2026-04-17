import { useState, useCallback } from 'react';

export type Page = 'inicio' | 'eventos' | 'nuevo-evento' | 'detalle-evento' | 'tratamientos' | 'nuevo-tratamiento' | 'detalle-tratamiento';

interface NavigationState {
  page: Page;
  params: Record<string, string>;
}

export function useNavigation() {
  const [state, setState] = useState<NavigationState>({
    page: 'inicio',
    params: {},
  });

  const navigateTo = useCallback((page: Page, params: Record<string, string> = {}) => {
    setState({ page, params });
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      // From detail/nuevo-evento, go back to eventos; otherwise go to inicio
      if (prev.page === 'detalle-evento' || prev.page === 'nuevo-evento') {
        return { page: 'eventos', params: {} };
      }
      if (prev.page === 'detalle-tratamiento' || prev.page === 'nuevo-tratamiento') {
        return { page: 'tratamientos', params: {} };
      }
      return { page: 'inicio', params: {} };
    });
  }, []);

  return {
    currentPage: state.page,
    params: state.params,
    navigateTo,
    goBack,
  };
}
