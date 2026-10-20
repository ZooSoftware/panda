import { clearPins, hasExpanded, setAllCollapsed, type Tree } from '../core/tree';

interface Props {
  tree: Tree;
  edit(fn: (t: Tree) => Tree): void;
}

export function ArrangeGroup({ tree, edit }: Props) {
  const anyExpanded = hasExpanded(tree);
  return (
    <div className="group-body">
      <button onClick={() => edit((t) => setAllCollapsed(t, anyExpanded))}>
        {anyExpanded ? '▸ Collapse all' : '▾ Expand all'}
      </button>
      <button onClick={() => edit(clearPins)}>📌 Unpin all</button>
      <p className="hint">
        Drag on empty canvas to select · Shift+click adds a point · Drag to pin · Ctrl+drag moves a point with
        everything after it · Right-drag or scroll to pan
      </p>
    </div>
  );
}
