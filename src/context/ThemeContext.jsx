import { createContext, useCallback, useEffect, useMemo, useState } from "react";

const THEME_PREF_KEY = "stock_theme_pref";
const THEME_KEY = "stock_theme";

function resolveTheme(preference) {
  if (preference === "light" || preference === "dark") return preference;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialPreference() {
  try {
    const savedPref = localStorage.getItem(THEME_PREF_KEY);
    if (savedPref === "system" || savedPref === "light" || savedPref === "dark") return savedPref;
    const legacy = localStorage.getItem(THEME_KEY);
    if (legacy === "dark" || legacy === "light") return legacy;
  } catch {
    /* ignore */
  }
  return "system";
}

const ThemeContext = createContext(null);

function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(getInitialPreference);
  const [theme, setTheme] = useState(() => resolveTheme(getInitialPreference()));

  useEffect(() => {
    const applied = resolveTheme(preference);
    setTheme(applied);
    document.documentElement.setAttribute("data-theme", applied);
    try {
      localStorage.setItem(THEME_PREF_KEY, preference);
      localStorage.setItem(THEME_KEY, applied);
    } catch {
      /* ignore */
    }
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return undefined;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return undefined;
    const onChange = () => {
      const applied = resolveTheme("system");
      setTheme(applied);
      document.documentElement.setAttribute("data-theme", applied);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((next) => {
    if (next === "system" || next === "light" || next === "dark") {
      setPreferenceState(next);
    }
  }, []);

  const cyclePreference = useCallback(() => {
    setPreferenceState((prev) => {
      if (prev === "system") return "light";
      if (prev === "light") return "dark";
      return "system";
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferenceState((prev) => {
      const current = resolveTheme(prev);
      return current === "dark" ? "light" : "dark";
    });
  }, []);

  const value = useMemo(
    () => ({ theme, preference, setPreference, cyclePreference, toggleTheme }),
    [theme, preference, setPreference, cyclePreference, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { ThemeContext, ThemeProvider };
