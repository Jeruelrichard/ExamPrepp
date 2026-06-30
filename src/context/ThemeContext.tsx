import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getTheme, saveTheme } from '../services/settings';
import type { Theme } from '../services/settings';

/**
 * ThemeProvider — app-wide light/dark theme.
 *
 * localStorage is the instant cache (so there's no flash and it works before the
 * network resolves); Supabase (profiles.theme) is the synced source of truth, so
 * the preference follows the user across devices. Applies the `dark` class to
 * <html>, which flips the theme tokens defined in index.css.
 */
const LS_KEY = 'examprepp-theme';

type ThemeValue = { theme: Theme; setTheme: (t: Theme) => void; toggleTheme: () => void };

const ThemeContext = createContext<ThemeValue | null>(null);

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(LS_KEY) === 'dark' ? 'dark' : 'light'),
  );

  // Keep the <html> class in sync with state.
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // On sign-in, reconcile with the user's saved preference (source of truth).
  useEffect(() => {
    if (!user) return;
    let active = true;
    getTheme().then(({ data }) => {
      if (active && data) {
        setThemeState(data);
        localStorage.setItem(LS_KEY, data);
      }
    });
    return () => {
      active = false;
    };
  }, [user]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(LS_KEY, t);
    if (user) saveTheme(t); // fire-and-forget; non-blocking
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
