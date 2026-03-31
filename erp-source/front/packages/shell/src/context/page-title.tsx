'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface PageTitleState {
  title: string;
  subtitle?: string;
}

const PageTitleContext = createContext<{
  state: PageTitleState;
  setPageTitle: (title: string, subtitle?: string) => void;
}>({
  state: { title: '' },
  setPageTitle: () => {},
});

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PageTitleState>({ title: '' });
  const setPageTitle = useCallback((title: string, subtitle?: string) => {
    setState({ title, subtitle });
  }, []);
  return (
    <PageTitleContext.Provider value={{ state, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

/** Call from pages to set the top-bar title. */
export function useSetPageTitle(title: string, subtitle?: string) {
  const { setPageTitle } = useContext(PageTitleContext);
  useEffect(() => {
    setPageTitle(title, subtitle);
  }, [title, subtitle, setPageTitle]);
}

/** Read current title (used by TopBar). */
export function usePageTitleState() {
  return useContext(PageTitleContext).state;
}
