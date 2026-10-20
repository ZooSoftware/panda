import type { ReactNode } from 'react';

interface Props {
  /** Live file sync controls. */
  sync: ReactNode;
  /** Image export buttons. */
  image: ReactNode;
  onNew(): void;
  onImport(): void;
  onExportJson(): void;
  onExportReadme(): void;
}

export function FileGroup({ sync, image, onNew, onImport, onExportJson, onExportReadme }: Props) {
  return (
    <div className="group-body">
      {sync}
      <button onClick={onNew}>New tree</button>
      <button onClick={onImport}>Import JSON…</button>
      <button onClick={onExportJson}>Export JSON</button>
      <button onClick={onExportReadme} title="A README to read on GitHub; panda can't open it again">
        Export README (view only)
      </button>
      {image}
    </div>
  );
}
