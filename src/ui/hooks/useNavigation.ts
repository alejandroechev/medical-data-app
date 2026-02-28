import { useState, useCallback } from 'react';

export type Page = 'inicio' | 'nuevo-evento' | 'detalle-evento' | 'historial';

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
    setState({ page: 'inicio', params: {} });
  }, []);

  return {
    currentPage: state.page,
    params: state.params,
    navigateTo,
    goBack,
  };
}
