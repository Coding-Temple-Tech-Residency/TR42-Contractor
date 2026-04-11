import { createContext, useContext, useState, useCallback, FC, ReactNode } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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

// useFocusEffect fires every time the screen comes into focus (including back navigation)
// useCallback with no deps ensures the callback reference is stable
export const useSetNavigationUI = (config: NavigationUIConfig) => {
  const { setConfig } = useNavigationUI();
  useFocusEffect(
    useCallback(() => {
      setConfig(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(config)])
  );
};
