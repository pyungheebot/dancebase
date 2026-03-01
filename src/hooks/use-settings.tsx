"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Theme = "light" | "dark" | "high-contrast";

type Settings = {
  theme: Theme;
  fontScale: number; // 0.75 ~ 1.25
};

type SettingsContextType = Settings & {
  setTheme: (theme: Theme) => void;
  setFontScale: (scale: number) => void;
};

const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  fontScale: 1,
};

const SettingsContext = createContext<SettingsContextType>({
  ...DEFAULT_SETTINGS,
  setTheme: () => {},
  setFontScale: () => {},
});

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "high-contrast");
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "high-contrast") {
    root.classList.add("dark", "high-contrast");
  }
}

function applyFontScale(scale: number) {
  // 기본 16px 기준으로 스케일 적용
  document.documentElement.style.fontSize = `${scale * 16}px`;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_SETTINGS.theme);
  const [fontScale, setFontScaleState] = useState<number>(DEFAULT_SETTINGS.fontScale);
  const [mounted, setMounted] = useState(false);

  // 초기 로드: localStorage에서 읽기


  const persist = useCallback((updates: Partial<Settings>) => {
    try {
      const saved = localStorage.getItem("groop-settings");
      const current = saved ? JSON.parse(saved) : {};
      localStorage.setItem(
        "groop-settings",
        JSON.stringify({ ...current, ...updates })
      );
    } catch {
      // ignore
    }
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      applyTheme(t);
      persist({ theme: t });
    },
    [persist]
  );

  const setFontScale = useCallback(
    (s: number) => {
      const clamped = Math.min(1.25, Math.max(0.75, s));
      setFontScaleState(clamped);
      applyFontScale(clamped);
      persist({ fontScale: clamped });
    },
    [persist]
  );

  // hydration 전에는 children만 렌더 (깜빡임 방지)
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SettingsContext.Provider value={{ theme, fontScale, setTheme, setFontScale }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
