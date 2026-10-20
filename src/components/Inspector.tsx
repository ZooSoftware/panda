import { PALETTE, countLeaves, type Capabilities, type Point } from '../core/tree';

interface Props {
  point: Point;
  caps: Capabilities;
  onChange(patch: Partial<Pick<Point, 'title' | 'content' | 'color'>>): void;
  onAddNext(): void;
  onAddBranch(): void;
  onAddLeaf(): void;
  onReopen(): void;
  onRemove(): void;
  onUnpin(): void;
}

export function Inspector({
  point,
  caps,
  onChange,
  onAddNext,
  onAddBranch,
  onAddLeaf,
  onReopen,
  onRemove,
  onUnpin,
}: Props) {
  return (
    <aside className="inspector">
      <div className="inspector-kind">
        {point.kind === 'leaf' ? '🍃 Leaf' : '● Point'}
        {point.branches.length > 0 && ` · ${point.branches.length} branches · 🍃 ${countLeaves(point)} leaves`}
      </div>

      <label>
        Title
        <input value={point.title} onChange={(e) => onChange({ title: e.target.value })} autoFocus />
      </label>

      <label>
        Content
        <textarea rows={8} value={point.content} onChange={(e) => onChange({ content: e.target.value })} />
      </label>

      <div className="field">
        <span>Color</span>
        <div className="swatches">
          {PALETTE.map((c) => (
            <button
              key={c}
              className={`swatch ${c === point.color ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => onChange({ color: c })}
              aria-label={`Color ${c}`}
            />
          ))}
          <input type="color" value={point.color} onChange={(e) => onChange({ color: e.target.value })} title="Custom color" />
        </div>
      </div>

      <div className="actions">
        <button disabled={!caps.addNext} onClick={onAddNext}>+ Next point</button>
        <button disabled={!caps.addBranch} onClick={onAddBranch}>⎇ New branch</button>
        <button disabled={!caps.addBranch} onClick={onAddLeaf} title="New branch that is a single leaf">
          🍃 Add leaf
        </button>
        {caps.reopen && <button onClick={onReopen}>↺ Reopen chain</button>}
        {point.pin && <button onClick={onUnpin}>📌 Unpin</button>}
        <button className="danger" disabled={!caps.remove} onClick={onRemove}>
          Delete{point.branches.length > 0 ? ' (with branches)' : ''}
        </button>
      </div>

      <p className="hint">Drag a node to pin it in place. Pins rotate with the diagram.</p>
    </aside>
  );
}
