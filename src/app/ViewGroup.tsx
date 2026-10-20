import type { Dispatch, SetStateAction } from 'react';
import { DIRECTIONS, EDGE_STYLES, LAYOUTS, type Direction, type EdgeStyle, type LayoutMode, type Tree } from '../core/tree';
import { nextDirection } from '../core/layout';
import { PANEL_POSITIONS, type PanelPosition } from '../features/panel/ControlPanel';
import { THEMES, type Preferences, type Theme } from './usePreferences';

interface Props {
  tree: Tree;
  edit(fn: (t: Tree) => Tree): void;
  refit(): void;
  prefs: Preferences;
  setPrefs: Dispatch<SetStateAction<Preferences>>;
}

export function ViewGroup({ tree, edit, refit, prefs, setPrefs }: Props) {
  const setDirection = (direction: Direction) => {
    edit((t) => ({ ...t, direction }));
    refit();
  };

  return (
    <div className="group-body">
      <div className="field-inline">
        <button onClick={() => setDirection(nextDirection(tree.direction))} title="Rotate 90°">
          ↻ Rotate
        </button>
        <button onClick={refit}>Fit</button>
      </div>
      <label className="field">
        Direction
        <select value={tree.direction} onChange={(e) => setDirection(e.target.value as Direction)}>
          {DIRECTIONS.map((d) => (
            <option key={d} value={d}>
              {{ LR: 'Left → Right', TB: 'Top → Bottom', RL: 'Right → Left', BT: 'Bottom → Top' }[d]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Lines
        <select value={tree.edgeStyle} onChange={(e) => edit((t) => ({ ...t, edgeStyle: e.target.value as EdgeStyle }))}>
          {EDGE_STYLES.map((s) => (
            <option key={s} value={s}>
              {{ sides: 'Fixed sides', shortest: 'Shortest path' }[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Layout
        <select
          value={tree.layout}
          onChange={(e) => {
            edit((t) => ({ ...t, layout: e.target.value as LayoutMode }));
            refit();
          }}
        >
          {LAYOUTS.map((l) => (
            <option key={l} value={l}>
              {{ stacked: 'Stacked', packed: 'Packed' }[l]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Panel position
        <select value={prefs.panel} onChange={(e) => setPrefs((p) => ({ ...p, panel: e.target.value as PanelPosition }))}>
          {PANEL_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {{ left: 'Left', right: 'Right', top: 'Top', bottom: 'Bottom' }[p]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Theme
        <select value={prefs.theme} onChange={(e) => setPrefs((p) => ({ ...p, theme: e.target.value as Theme }))}>
          {THEMES.map((t) => (
            <option key={t} value={t}>
              {{ system: 'System', light: 'Light', dark: 'Dark' }[t]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
