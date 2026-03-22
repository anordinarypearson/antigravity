"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

const ACCENT_COLOR_KEY = 'accent-color';

type ThemeContextType = {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [accentColor, setAccentColorState] = React.useState<string>('gray');

  React.useEffect(() => {
    const savedAccent = localStorage.getItem(ACCENT_COLOR_KEY) || 'gray';
    setAccentColorState(savedAccent);
    document.documentElement.setAttribute('data-accent', savedAccent);
  }, []);

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    localStorage.setItem(ACCENT_COLOR_KEY, color);
    document.documentElement.setAttribute('data-accent', color);
  };

  return (
    <NextThemesProvider {...props}>
      <ThemeContext.Provider value={{ accentColor, setAccentColor } as any}>
        <ThemeChildWrapper setAccentColor={setAccentColor} accentColor={accentColor}>
            {children}
        </ThemeChildWrapper>
      </ThemeContext.Provider>
    </NextThemesProvider>
  )
}

function ThemeChildWrapper({ children, accentColor, setAccentColor }: any) {
    const nextTheme = useNextTheme();
    return (
        <ThemeContext.Provider value={{ ...nextTheme, accentColor, setAccentColor } as any}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = React.useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within ThemeProvider");
    return context;
};
