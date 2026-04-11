// NavigationUIContext.tsx
// Controls what the persistent header and footer show.
// Each screen calls useSetNavigationUI() on mount to configure the chrome.
// Auth screens don't call it — the default is 'none' so nothing shows.

import { createContext, useContext, useState, useEffect, FC, ReactNode } from 'react';
import { HeaderVariant } from '../components/Header';
import { MenuOptions } from '../components/Menu';
import { Menus } from '../constants/Menus';

export type NavigationUIConfig = {
  header:     HeaderVariant;
  headerMenu: MenuOptions;
  footerMenu: MenuOptions;
};

const defaultConfig: NavigationUIConfig = {
  header:     'none',
  headerMenu: ['none'],
  footerMenu: ['none'],
};

// Standard configs for reuse
export const UI = {
  none: defaultConfig,

  main: {
    header:     'home' as HeaderVariant,
    headerMenu: ['Menu1', Menus.Main] as MenuOptions,
    footerMenu: ['Menu3', Menus.Footer] as MenuOptions,
  },

  back: (title: string): NavigationUIConfig => ({
    header:     'home',
    headerMenu: ['Menu2', [title]] as MenuOptions,
    footerMenu: ['Menu3', Menus.Footer] as MenuOptions,
  }),
};

type ContextValue = {
  config:    NavigationUIConfig;
  setConfig: (c: NavigationUIConfig) => void;
};

const NavigationUIContext = createContext<ContextValue>({
  config:    defaultConfig,
  setConfig: () => {},
});

export const NavigationUIProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<NavigationUIConfig>(defaultConfig);
  return (
    <NavigationUIContext.Provider value={{ config, setConfig }}>
      {children}
    </NavigationUIContext.Provider>
  );
};

export const useNavigationUI = () => useContext(NavigationUIContext);

// Convenience hook — call this at the top of any screen component.
// It sets the header/footer config when the screen mounts and focused,
// and resets to none when it unmounts.
export const useSetNavigationUI = (config: NavigationUIConfig) => {
  const { setConfig } = useNavigationUI();
  useEffect(() => {
    setConfig(config);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
