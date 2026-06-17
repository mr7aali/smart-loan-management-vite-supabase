import { useCallback, useEffect, useState } from "react";

export const THEME_STORAGE_KEY = "lendsmart-theme";
const THEME_EVENT = "lendsmart-theme-change";

function readSavedTheme(): boolean | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "dark") return true;
    if (value === "light") return false;
  } catch {
    // ignore
  }
  return null;
}

export function getInitialDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  const saved = readSavedTheme();
  if (saved !== null) return saved;
  return Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches);
}

function applyTheme(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // theme still applies for the active session
  }
}

/**
 * Shared theme hook. Every component that calls it stays in sync because the
 * hook listens for a custom event the setters dispatch. That means toggling
 * dark mode from the marketing header header updates the in-app Settings
 * toggle (and vice-versa) without any prop drilling.
 */
export function useTheme() {
  const [darkMode, setDarkModeState] = useState<boolean>(() =>
    getInitialDarkMode(),
  );

  // Apply on mount and whenever local state changes. Also broadcast so other
  // mounted instances of the hook update their state.
  useEffect(() => {
    applyTheme(darkMode);
    window.dispatchEvent(
      new CustomEvent<boolean>(THEME_EVENT, { detail: darkMode }),
    );
  }, [darkMode]);

  // Listen for changes from other instances and from other tabs.
  useEffect(() => {
    function handleChange(event: Event) {
      const detail = (event as CustomEvent<boolean>).detail;
      if (typeof detail === "boolean") {
        setDarkModeState((current) => (current === detail ? current : detail));
      }
    }
    function handleStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY) {
        if (event.newValue === "dark") {
          setDarkModeState((current) => (current === true ? current : true));
        } else if (event.newValue === "light") {
          setDarkModeState((current) => (current === false ? current : false));
        }
      }
    }

    window.addEventListener(THEME_EVENT, handleChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, handleChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setDarkMode = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setDarkModeState((current) =>
        typeof value === "function" ? value(current) : value,
      );
    },
    [],
  );

  const toggleTheme = useCallback(() => {
    setDarkModeState((prev) => !prev);
  }, []);

  return { darkMode, setDarkMode, toggleTheme };
}
