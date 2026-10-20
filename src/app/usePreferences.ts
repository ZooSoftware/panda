import { useEffect, useState } from 'react';
import { PANEL_POSITIONS, type PanelPosition } from '../features/panel/ControlPanel';

// Per-browser UI preferences; not part of the tree, so not exported (0011).
const UI_KEY = 'panda-ui';

export type Theme = 'system' | 'light' | 'dark';
export const THEMES: Theme[] = ['system', 'light', 'dark'];

export interface Preferences {
  panel: PanelPosition;
  tab: string;
  theme: Theme;
}

function load(): Preferences {
  const defaults: Preferences = { panel: 'left', tab: 'file', theme: 'system' };
  try {
    const raw = JSON.parse(localStorage.getItem(UI_KEY) ?? '{}');
    return {
      panel: PANEL_POSITIONS.includes(raw.panel) ? raw.panel : defaults.panel,
      tab: typeof raw.tab === 'string' ? raw.tab : defaults.tab,
      theme: THEMES.includes(raw.theme) ? raw.theme : defaults.theme,
    };
  } catch {
    return defaults;
  }
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(load);

  useEffect(() => {
    try {
      localStorage.setItem(UI_KEY, JSON.stringify(prefs));
    } catch {
      // Storage may be unavailable; the defaults apply next time.
    }
  }, [prefs]);

  // 'system' leaves the attribute off so the CSS media query decides.
  useEffect(() => {
    const root = document.documentElement;
    if (prefs.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = prefs.theme;
  }, [prefs.theme]);

  return [prefs, setPrefs] as const;
}
