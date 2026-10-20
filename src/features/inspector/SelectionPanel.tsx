interface Props {
  count: number;
  onUnpin(): void;
  onClear(): void;
}

/** Side panel while several points are selected. */
export function SelectionPanel({ count, onUnpin, onClear }: Props) {
  return (
    <aside className="inspector">
      <div className="inspector-kind">{count} points selected</div>
      <div className="actions">
        <button onClick={onUnpin}>📌 Unpin selected</button>
        <button onClick={onClear}>Clear selection</button>
      </div>
      <p className="hint">Drag any selected point to move them all. Shift+click adds or removes a point.</p>
    </aside>
  );
}
