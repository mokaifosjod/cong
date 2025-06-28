import { useState, useEffect } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/hooks/useAuth';

export function useTheme() {
  const { isAuthenticated } = useAuth();
  const { preferences, updatePreferences } = useUserPreferences();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setIsDarkMode(JSON.parse(saved));
    }
  }, []);

  // Sync with server preferences when available
  useEffect(() => {
    if (isAuthenticated && preferences?.darkMode !== undefined) {
      setIsDarkMode(preferences.darkMode);
      localStorage.setItem('darkMode', JSON.stringify(preferences.darkMode));
    }
  }, [isAuthenticated, preferences?.darkMode]);

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    localStorage.setItem('darkMode', JSON.stringify(newValue));

    // Sync with server if authenticated
    if (isAuthenticated) {
      try {
        await updatePreferences({ darkMode: newValue });
      } catch {
        // Ignore server sync errors
      }
    }
  };

  return { isDarkMode, toggleDarkMode };
}