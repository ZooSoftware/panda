import type { ReactNode, SyntheticEvent } from 'react';

export type PanelPosition = 'left' | 'right' | 'top' | 'bottom';
export const PANEL_POSITIONS: PanelPosition[] = ['left', 'right', 'top', 'bottom'];

export interface PanelGroup {
  id: string;
  label: string;
  content: ReactNode;
}

interface Props {
  position: PanelPosition;
  title: string;
  onTitleChange(title: string): void;
  groups: PanelGroup[];
  activeTab: string;
  onTabChange(id: string): void;
  /** Small indicator next to the title, e.g. the live file link. */
  status?: ReactNode;
}

/**
 * The app's controls, in a few groups. On the left or right the groups are
 * tabs; on the top or bottom they are a menu bar whose menus open on hover
 * (or keyboard focus).
 */
export function ControlPanel({ position, title, onTitleChange, groups, activeTab, onTabChange, status }: Props) {
  const head = (
    <div className="panel-head">
      <span className="logo">🐼</span>
      <input className="tree-title" value={title} onChange={(e) => onTitleChange(e.target.value)} aria-label="Tree title" />
      {status}
    </div>
  );

  if (position === 'left' || position === 'right') {
    const active = groups.find((g) => g.id === activeTab) ?? groups[0];
    return (
      <aside className={`control-panel side ${position}`}>
        {head}
        <div className="tabs" role="tablist">
          {groups.map((g) => (
            <button
              key={g.id}
              role="tab"
              aria-selected={g.id === active.id}
              className={g.id === active.id ? 'active' : ''}
              onClick={() => onTabChange(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="tab-body" role="tabpanel">
          {active.content}
        </div>
      </aside>
    );
  }

  // A menu stays open while it has focus, so a native select can be used. Drop
  // focus after a choice so the menu closes once the pointer leaves.
  // (A click on a select only opens it, so clicks release buttons only.)
  const release = (tag: string) => (e: SyntheticEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === tag) target.blur();
  };

  return (
    <header className={`control-panel bar ${position}`}>
      {head}
      <nav className="menus">
        {groups.map((g) => (
          <div key={g.id} className="menu">
            <button className="menu-trigger" aria-haspopup="true">
              {g.label} ▾
            </button>
            <div className="dropdown" onChangeCapture={release('SELECT')} onClickCapture={release('BUTTON')}>
              {g.content}
            </div>
          </div>
        ))}
      </nav>
    </header>
  );
}
