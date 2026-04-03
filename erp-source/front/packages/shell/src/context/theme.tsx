"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { Toaster } from "sonner";

interface ThemeContextType {
  theme: string;
  setTheme: (t: string) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  compactMode: boolean;
  setCompactMode: (v: boolean) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (v: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => { },
  accentColor: "blue",
  setAccentColor: () => { },
  compactMode: false,
  setCompactMode: () => { },
  fontSize: 14,
  setFontSize: () => { },
  animationsEnabled: true,
  setAnimationsEnabled: () => { },
  reducedMotion: false,
  setReducedMotion: () => { },
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeToDOM(theme: string) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

const PALETTES: Record<string, Record<string, string>> = {
  blue: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a" },
  indigo: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81" },
  purple: { 50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87" },
  pink: { 50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4", 400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d", 800: "#9d174d", 900: "#831843" },
  red: { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d" },
  orange: { 50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12" },
  amber: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f" },
  emerald: { 50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b" },
  teal: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a" },
  cyan: { 50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63" },
};

function applyAccentToDOM(key: string) {
  const p = PALETTES[key] || PALETTES.blue;
  const s = document.documentElement.style;
  for (const [shade, hex] of Object.entries(p)) {
    s.setProperty(`--accent-${shade}`, hex);
  }
}

function applyLayoutToDOM({
  compactMode,
  fontSize,
  animationsEnabled,
  reducedMotion,
}: {
  compactMode: boolean;
  fontSize: number;
  animationsEnabled: boolean;
  reducedMotion: boolean;
}) {
  const el = document.documentElement;
  el.classList.toggle("compact", compactMode);
  el.style.setProperty("--base-font-size", `${fontSize}px`);
  el.classList.toggle("no-animations", !animationsEnabled);
  el.classList.toggle("reduced-motion", reducedMotion);
}

function ls<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* noop */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "light";
    try {
      return localStorage.getItem("theme") || "light";
    } catch {
      return "light";
    }
  });

  const [accentColor, setAccentState] = useState(() => {
    if (typeof window === "undefined") return "blue";
    return ls("accentColor", "blue");
  });

  const [compactMode, setCompactState] = useState(() => ls("compactMode", false));
  const [fontSize, setFontSizeState] = useState(() => ls("fontSize", 14));
  const [animationsEnabled, setAnimState] = useState(() => ls("animationsEnabled", true));
  const [reducedMotion, setReducedState] = useState(() => ls("reducedMotion", false));

  const setTheme = useCallback((t: string) => {
    setThemeState(t);
    try { localStorage.setItem("theme", t); } catch { /* noop */ }
    applyThemeToDOM(t);
  }, []);

  const setAccentColor = useCallback((c: string) => {
    setAccentState(c);
    lsSet("accentColor", c);
    applyAccentToDOM(c);
  }, []);

  const setCompactMode = useCallback((v: boolean) => {
    setCompactState(v);
    lsSet("compactMode", v);
    applyLayoutToDOM({ compactMode: v, fontSize, animationsEnabled, reducedMotion });
  }, [fontSize, animationsEnabled, reducedMotion]);

  const setFontSize = useCallback((v: number) => {
    setFontSizeState(v);
    lsSet("fontSize", v);
    applyLayoutToDOM({ compactMode, fontSize: v, animationsEnabled, reducedMotion });
  }, [compactMode, animationsEnabled, reducedMotion]);

  const setAnimationsEnabled = useCallback((v: boolean) => {
    setAnimState(v);
    lsSet("animationsEnabled", v);
    applyLayoutToDOM({ compactMode, fontSize, animationsEnabled: v, reducedMotion });
  }, [compactMode, fontSize, reducedMotion]);

  const setReducedMotion = useCallback((v: boolean) => {
    setReducedState(v);
    lsSet("reducedMotion", v);
    applyLayoutToDOM({ compactMode, fontSize, animationsEnabled, reducedMotion: v });
  }, [compactMode, fontSize, animationsEnabled]);

  useEffect(() => {
    applyThemeToDOM(theme);
    applyAccentToDOM(accentColor);
    applyLayoutToDOM({ compactMode, fontSize, animationsEnabled, reducedMotion });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "accentColor" && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          setAccentState(parsed);
          applyAccentToDOM(parsed);
        } catch { /* noop */ }
      }
      if (e.key === "theme" && e.newValue !== null) {
        setThemeState(e.newValue);
        applyThemeToDOM(e.newValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyThemeToDOM("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        accentColor,
        setAccentColor,
        compactMode,
        setCompactMode,
        fontSize,
        setFontSize,
        animationsEnabled,
        setAnimationsEnabled,
        reducedMotion,
        setReducedMotion,
      }}
    >
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
        toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }}
      />
    </ThemeContext.Provider>
  );
}
