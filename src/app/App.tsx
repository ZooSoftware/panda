import { useCallback, useMemo, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { capabilities, findPoint, makeTree, visiblePoints, type Tree } from '../core/tree';
import { importText, toJSON, toMarkdown } from '../core/formats';
import { download, slug } from '../shared/download';
import { useTreeEditor } from '../features/editor/useTreeEditor';
import { Canvas } from '../features/canvas/Canvas';
import { useFit } from '../features/canvas/useFit';
import type { NodeActions } from '../features/canvas/PointNode';
import { Inspector } from '../features/inspector/Inspector';
import { SelectionPanel } from '../features/inspector/SelectionPanel';
import { ControlPanel } from '../features/panel/ControlPanel';
import { useFileSync } from '../features/file-sync/useFileSync';
import { FileSyncControls, SyncChip } from '../features/file-sync/FileSyncControls';
import { useImageExport } from '../features/image-export/useImageExport';
import { ImageExportButtons } from '../features/image-export/ImageExportButtons';
import { usePreferences } from './usePreferences';
import { FileGroup } from './FileGroup';
import { ViewGroup } from './ViewGroup';
import { ArrangeGroup } from './ArrangeGroup';

/** Puts the features together; the logic lives in them. */
function Editor() {
  const { tree, selectedIds, select, actions, edit, replace } = useTreeEditor();
  const [prefs, setPrefs] = usePreferences();
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const refit = useFit();

  // A tree from outside the editor: new, imported, or from the linked file.
  const loadTree = useCallback(
    (next: Tree) => {
      replace(next);
      setError(null);
      refit();
    },
    [replace, refit],
  );
  const fileSync = useFileSync(tree, loadTree, setError);
  const exportImage = useImageExport(tree.title, setError);

  const onImport = async (file: File) => {
    // Replacing the tree must never overwrite the linked file.
    fileSync.stop();
    try {
      loadTree(importText(await file.text()));
    } catch (e) {
      setError(`Import failed: ${(e as Error).message}`);
    }
  };

  const nodeActions: NodeActions = useMemo(
    () => ({
      addNext: actions.addNext,
      addBranch: actions.addBranch,
      addLeaf: actions.addLeaf,
      unpin: (id) => actions.unpin([id]),
      toggleCollapsed: actions.toggleCollapsed,
    }),
    [actions],
  );

  // Points hidden by collapsing their owner don't count as selected.
  const visibleIds = useMemo(() => new Set(visiblePoints(tree).map((p) => p.id)), [tree]);
  const visibleSelection = selectedIds.filter((id) => visibleIds.has(id));
  const selected = visibleSelection.length === 1 ? findPoint(tree, visibleSelection[0]) : null;

  return (
    <div className={`app panel-${prefs.panel}`}>
      <ControlPanel
        position={prefs.panel}
        title={tree.title}
        onTitleChange={(title) => edit((t) => ({ ...t, title }))}
        groups={[
          {
            id: 'file',
            label: 'File',
            content: (
              <FileGroup
                sync={<FileSyncControls fileSync={fileSync} suggestedName={`${slug(tree.title)}.json`} />}
                image={<ImageExportButtons onExport={exportImage} />}
                onNew={() => {
                  fileSync.stop();
                  loadTree(makeTree());
                }}
                onImport={() => fileInput.current?.click()}
                onExportJson={() => download(`${slug(tree.title)}.json`, toJSON(tree), 'application/json')}
                onExportReadme={() => download('README.md', toMarkdown(tree), 'text/markdown')}
              />
            ),
          },
          {
            id: 'view',
            label: 'View',
            content: <ViewGroup tree={tree} edit={edit} refit={refit} prefs={prefs} setPrefs={setPrefs} />,
          },
          { id: 'arrange', label: 'Arrange', content: <ArrangeGroup tree={tree} edit={edit} /> },
        ]}
        activeTab={prefs.tab}
        onTabChange={(tab) => setPrefs((p) => ({ ...p, tab }))}
        status={<SyncChip sync={fileSync.sync} />}
      />
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImport(file);
          e.target.value = '';
        }}
      />

      <div className="main">
        {error && (
          <div className="error" role="alert">
            {error} <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* The point panel sits opposite a side control panel. */}
        <main className={`workspace ${prefs.panel === 'right' ? 'inspector-left' : ''}`}>
          <Canvas
            tree={tree}
            selectedIds={selectedIds}
            onSelect={select}
            onPin={actions.pin}
            actions={nodeActions}
            colorMode={prefs.theme}
          />
          {selected && (
            <Inspector
              key={selected.point.id}
              point={selected.point}
              caps={capabilities(tree, selected.point.id)}
              onChange={(patch) => actions.update(selected.point.id, patch)}
              onAddNext={() => actions.addNext(selected.point.id)}
              onAddBranch={() => actions.addBranch(selected.point.id)}
              onAddLeaf={() => actions.addLeaf(selected.point.id)}
              onReopen={() => actions.reopen(selected.point.id)}
              onRemove={() => actions.remove(selected.point.id)}
              onUnpin={() => actions.unpin([selected.point.id])}
            />
          )}
          {visibleSelection.length > 1 && (
            <SelectionPanel
              count={visibleSelection.length}
              onUnpin={() => actions.unpin(visibleSelection)}
              onClear={() => select([])}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}
