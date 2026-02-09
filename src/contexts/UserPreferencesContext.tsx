import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UIDensity = 'compact' | 'comfortable';

interface UserPreferences {
  reducedMotion: boolean;
  uiDensity: UIDensity;
  collapsedSidebar: boolean;
}

interface UserPreferencesContextType extends UserPreferences {
  setReducedMotion: (value: boolean) => void;
  setUIDensity: (value: UIDensity) => void;
  setCollapsedSidebar: (value: boolean) => void;
}

const STORAGE_KEY = 'enseinotes-user-preferences';

const defaultPreferences: UserPreferences = {
  reducedMotion: false,
  uiDensity: 'comfortable',
  collapsedSidebar: false,
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return defaultPreferences;
}

function savePreferences(prefs: UserPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);

  // Respect system prefers-reduced-motion on first load if user hasn't set preference
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setPreferences(prev => ({ ...prev, reducedMotion: true }));
      }
    }
  }, []);

  // Persist preferences
  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  // Apply reduced motion class to html element
  useEffect(() => {
    const html = document.documentElement;
    if (preferences.reducedMotion) {
      html.classList.add('reduce-motion');
    } else {
      html.classList.remove('reduce-motion');
    }
  }, [preferences.reducedMotion]);

  // Apply density class to html element
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('density-compact', 'density-comfortable');
    html.classList.add(`density-${preferences.uiDensity}`);
  }, [preferences.uiDensity]);

  const setReducedMotion = (value: boolean) => {
    setPreferences(prev => ({ ...prev, reducedMotion: value }));
  };

  const setUIDensity = (value: UIDensity) => {
    setPreferences(prev => ({ ...prev, uiDensity: value }));
  };

  const setCollapsedSidebar = (value: boolean) => {
    setPreferences(prev => ({ ...prev, collapsedSidebar: value }));
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        ...preferences,
        setReducedMotion,
        setUIDensity,
        setCollapsedSidebar,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};
