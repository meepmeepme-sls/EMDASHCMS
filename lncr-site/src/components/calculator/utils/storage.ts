/**
 * Late Night Combat Robotics Calculator Suite - Session Storage Utility
 * Provides safe, versioned persistence for all calculator parameters and preferences.
 */

import { GlobalAppState, parseStateFromUrl } from './urlState';

const SESSION_STORAGE_KEY = 'lncr_session_v1';

/**
 * Saves current app state to localStorage.
 */
export function saveSessionState(state: GlobalAppState): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = JSON.stringify({
      version: 1,
      timestamp: Date.now(),
      state,
    });
    localStorage.setItem(SESSION_STORAGE_KEY, payload);
    if (state.theme) {
      localStorage.setItem('lnc_theme', state.theme);
    }
  } catch (err) {
    // Gracefully handle storage quota exceeded or private browsing restrictions
    console.warn('Could not save session to localStorage:', err);
  }
}

/**
 * Returns the persisted theme preference, checking direct theme storage, session state, or system preference.
 */
export function getSavedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try {
    const direct = localStorage.getItem('lnc_theme');
    if (direct === 'dark' || direct === 'light') return direct;
    const session = loadSessionState();
    if (session?.theme === 'dark' || session?.theme === 'light') return session.theme;
  } catch {
    // ignore
  }
  return 'light';
}

/**
 * Persists theme preference directly to localStorage.
 */
export function saveTheme(theme: 'light' | 'dark'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('lnc_theme', theme);
  } catch {
    // ignore
  }
}

/**
 * Loads session state from localStorage if valid.
 */
export function loadSessionState(): GlobalAppState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && parsed.state && typeof parsed.state === 'object') {
      return parsed.state as GlobalAppState;
    }
  } catch (err) {
    console.warn('Could not parse saved session from localStorage:', err);
  }
  return null;
}

/**
 * Clears saved session from localStorage.
 */
export function clearSessionState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Hydrates initial app state respecting the priority hierarchy:
 * 1. URL Query parameters (shared links take top precedence)
 * 2. Saved session in localStorage (restores user's latest session)
 * 3. Fallback INITIAL_STATE (clean baseline defaults)
 */
export function loadInitialAppState(search: string, fallback: GlobalAppState): GlobalAppState {
  // Priority 1: If URL has query parameters, parse and prioritize them
  if (search && search.length > 1) {
    return parseStateFromUrl(search, fallback);
  }

  // Priority 2: If no query string, attempt to restore previous local session
  const saved = loadSessionState();
  if (saved) {
    // Merge with fallback to ensure any newly added fields or schema updates exist
    return {
      ...fallback,
      ...saved,
      drivetrain: { ...fallback.drivetrain, ...saved.drivetrain },
      weapon: { ...fallback.weapon, ...saved.weapon },
      spinup: { ...fallback.spinup, ...saved.spinup },
      capacitance: { ...fallback.capacitance, ...saved.capacitance },
      centerDistance: { ...fallback.centerDistance, ...saved.centerDistance },
      batteryRuntime: { ...fallback.batteryRuntime, ...saved.batteryRuntime },
    };
  }

  // Priority 3: Default baseline state
  return fallback;
}
