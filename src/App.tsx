import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  applyNodeChanges,
  useReactFlow,
  type Edge,
  type NodeChange,
  type OnNodeDrag,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  DIRECTIONS,
  EDGE_STYLES,
  LAYOUTS,
  addBranch,
  addLeaf,
  addNext,
  capabilities,
  clearPins,
  countDescendants,
  countLeaves,
  findPoint,
  forwardIds,
  hasExpanded,
  makeTree,
  removePoint,
  reopen,
  setAllCollapsed,
  setCollapsed,
  setPin,
  setPins,
  updatePoint,
  visibleBranches,
  type Chain,
  type Direction,
  type EdgeStyle,
  type LayoutMode,
  type Pin,
  type Point,
  type Tree,
} from './model/tree';
import { layoutGrid, nextDirection, toPin, toPixels } from './model/layout';
import { importText, toJSON, toMarkdown } from './model/exporters';
import { NodeActionsContext, PointNode, type NodeActions, type PointNodeType } from './components/PointNode';
import { Inspector } from './components/Inspector';
import { FloatingEdge } from './components/FloatingEdge';
import { ControlPanel, PANEL_POSITIONS, type PanelPosition } from './components/ControlPanel';
import { IMAGE_FORMATS, renderDiagramImage, type ImageFormat } from './exportImage';
import { fileSyncSupported } from './fileSync';
import { useFileSync, type SyncState } from './useFileSync';
import { sampleTree } from './sample';
import { literatureReviewTree } from './examples/literatureReview';

const STORAGE_KEY = 'panda-tree';
// Per-browser UI preferences; not part of the tree, so not exported.
const UI_KEY = 'panda-ui';
const nodeTypes = { point: PointNode };
const edgeTypes = { floating: FloatingEdge };
const EXAMPLES: Record<string, () => Tree> = {
  'Learn web development': sampleTree,
  'Literature review (60 papers)': literatureReviewTree,
};

function loadSaved(): Tree {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return importText(raw);
  } catch {
    // Unreadable storage or stale data: fall back to the sample.
  }
  return sampleTree();
}

type Theme = 'system' | 'light' | 'dark';
const THEMES: Theme[] = ['system', 'light', 'dark'];

interface UiPrefs {
  panel: PanelPosition;
  tab: string;
  theme: Theme;
}

function loadUi(): UiPrefs {
  const defaults: UiPrefs = { panel: 'left', tab: 'file', theme: 'system' };
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

function saveUrl(name: string, url: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
}

function syncLabel(sync: SyncState): string {
  switch (sync.status) {
    case 'synced':
      return `synced ${new Date(sync.at ?? Date.now()).toLocaleTimeString()}`;
    case 'saving':
      return 'saving…';
    case 'needs-permission':
      return 'click Reconnect to resume';
    case 'error':
      return sync.message ?? 'error';
  }
}

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  saveUrl(name, url);
  URL.revokeObjectURL(url);
}

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tree';
}

/** Every point not hidden inside a collapsed branch. */
function visiblePoints(tree: Tree): Point[] {
  const out: Point[] = [];
  const walk = (chain: Chain) =>
    chain.forEach((p) => {
      out.push(p);
      visibleBranches(p).forEach(walk);
    });
  walk(tree.root);
  return out;
}

function buildNodes(tree: Tree): PointNodeType[] {
  const grid = layoutGrid(tree);
  return visiblePoints(tree).map((point) => ({
    id: point.id,
    type: 'point',
    position: toPixels(point.pin ?? grid.get(point.id)!, tree.direction),
    data: {
      point,
      direction: tree.direction,
      layout: tree.layout,
      caps: capabilities(tree, point.id),
      descendants: countDescendants(point),
      leaves: countLeaves(point),
    },
  }));
}

function buildEdges(tree: Tree): Edge[] {
  const edges: Edge[] = [];
  const type = tree.edgeStyle === 'shortest' ? 'floating' : 'smoothstep';
  const walk = (chain: Chain) => {
    chain.forEach((p, i) => {
      if (i > 0) {
        edges.push({
          id: `c-${p.id}`,
          source: chain[i - 1].id,
          target: p.id,
          sourceHandle: 'out',
          targetHandle: 'in',
          type,
          className: 'edge-chain',
        });
      }
      visibleBranches(p).forEach((branch) => {
        edges.push({
          id: `b-${branch[0].id}`,
          source: p.id,
          target: branch[0].id,
          sourceHandle: 'branch',
          targetHandle: 'in',
          type,
          className: 'edge-branch',
        });
        walk(branch);
      });
    });
  };
  walk(tree.root);
  return edges;
}

function Editor() {
  const [tree, setTree] = useState<Tree>(loadSaved);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ui, setUi] = useState<UiPrefs>(loadUi);
  const fileInput = useRef<HTMLInputElement>(null);
  const { fitView, getNodes } = useReactFlow();

  const derivedNodes = useMemo(() => buildNodes(tree), [tree]);
  const edges = useMemo(() => buildEdges(tree), [tree]);
  // Local copy so React Flow can move nodes during a drag; the tree is only
  // updated (as pins) when the drag ends. Selection lives in `selectedIds` and
  // is copied onto the nodes whenever they are rebuilt.
  const [nodes, setNodes] = useState(derivedNodes);
  const selectedRef = useRef(selectedIds);
  selectedRef.current = selectedIds;
  useEffect(() => {
    setNodes(derivedNodes.map((n) => ({ ...n, selected: selectedRef.current.includes(n.id) })));
  }, [derivedNodes]);

  const select = useCallback((ids: string[]) => {
    setSelectedIds(ids);
    setNodes((ns) => ns.map((n) => ({ ...n, selected: ids.includes(n.id) })));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, toJSON(tree));
    } catch {
      // Storage may be unavailable (private mode); editing still works.
    }
  }, [tree]);

  // 'system' leaves the attribute off so the CSS media query decides.
  useEffect(() => {
    const root = document.documentElement;
    if (ui.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = ui.theme;
  }, [ui.theme]);

  const exportImage = useCallback(
    async (format: ImageFormat) => {
      try {
        const background = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
        const url = await renderDiagramImage(format, getNodes(), background);
        saveUrl(`${slug(tree.title)}.${format}`, url);
      } catch (e) {
        setError(`Image export failed: ${(e as Error).message}`);
      }
    },
    [getNodes, tree.title],
  );

  useEffect(() => {
    try {
      localStorage.setItem(UI_KEY, JSON.stringify(ui));
    } catch {
      // Storage may be unavailable; the defaults apply next time.
    }
  }, [ui]);

  const refit = useCallback(() => {
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
  }, [fitView]);

  // Run an edit that may create a point, then select the new point.
  const grow = useCallback(
    (op: (t: Tree, id: string) => [Tree, string | null], id: string) => {
      const [next, newId] = op(tree, id);
      if (!newId) return;
      setTree(next);
      select([newId]);
    },
    [tree, select],
  );

  const actions: NodeActions = useMemo(
    () => ({
      addNext: (id) => grow(addNext, id),
      addBranch: (id) => grow(addBranch, id),
      addLeaf: (id) => grow(addLeaf, id),
      unpin: (id) => setTree((t) => setPin(t, id, undefined)),
      toggleCollapsed: (id) => setTree((t) => setCollapsed(t, id, !findPoint(t, id)?.point.collapsed)),
    }),
    [grow],
  );

  const remove = useCallback(
    (id: string) => {
      setTree((t) => removePoint(t, id));
      select([]);
    },
    [select],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' && selectedIds.length === 1) remove(selectedIds[0]);
      if (e.key === 'Escape') select([]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds, remove, select]);

  const onNodesChange = useCallback((changes: NodeChange<PointNodeType>[]) => {
    const selects = changes.filter((c) => c.type === 'select');
    if (selects.length > 0) {
      setSelectedIds((ids) => {
        const next = new Set(ids);
        for (const c of selects) {
          if (c.selected) next.add(c.id);
          else next.delete(c.id);
        }
        return [...next];
      });
    }
    setNodes((ns) => applyNodeChanges(changes, ns));
  }, []);

  // Ctrl+drag: points forward of the dragged one follow it. Holds their
  // start positions and the dragged node's start, for the offset.
  const follow = useRef<{ anchor: { x: number; y: number }; starts: Map<string, { x: number; y: number }> } | null>(null);

  const onNodeDragStart: OnNodeDrag<PointNodeType> = (e, node, dragged) => {
    follow.current = null;
    if (!(e.ctrlKey || e.metaKey)) return;
    const draggedIds = new Set(dragged.map((n) => n.id));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const starts = new Map<string, { x: number; y: number }>();
    for (const id of forwardIds(tree, node.id)) {
      const n = byId.get(id);
      if (n && !draggedIds.has(id)) starts.set(id, n.position);
    }
    follow.current = { anchor: byId.get(node.id)?.position ?? node.position, starts };
  };

  const onNodeDrag: OnNodeDrag<PointNodeType> = (_, node) => {
    const f = follow.current;
    if (!f) return;
    const dx = node.position.x - f.anchor.x;
    const dy = node.position.y - f.anchor.y;
    setNodes((ns) =>
      ns.map((n) => {
        const start = f.starts.get(n.id);
        return start ? { ...n, position: { x: start.x + dx, y: start.y + dy } } : n;
      }),
    );
  };

  const onNodeDragStop: OnNodeDrag<PointNodeType> = (_, node, dragged) => {
    const moved = new Map<string, { x: number; y: number }>(dragged.map((n) => [n.id, n.position]));
    const f = follow.current;
    if (f) {
      const dx = node.position.x - f.anchor.x;
      const dy = node.position.y - f.anchor.y;
      for (const [id, start] of f.starts) moved.set(id, { x: start.x + dx, y: start.y + dy });
    }
    follow.current = null;

    // A click can register as a zero-length drag; only real moves pin.
    const pins = new Map<string, Pin>();
    for (const [id, pos] of moved) {
      const from = derivedNodes.find((n) => n.id === id)?.position;
      if (from && Math.hypot(pos.x - from.x, pos.y - from.y) < 3) continue;
      pins.set(id, toPin(pos, tree.direction));
    }
    if (pins.size > 0) setTree((t) => setPins(t, pins));
  };

  const setDirection = (direction: Direction) => {
    setTree((t) => ({ ...t, direction }));
    refit();
  };

  // A tree loaded from the linked file (on open, reconnect, or an outside change).
  const loadTree = useCallback(
    (next: Tree) => {
      setTree(next);
      select([]);
      setError(null);
      refit();
    },
    [select, refit],
  );
  const fileSync = useFileSync(tree, loadTree, setError);

  const onImport = async (file: File) => {
    // Replacing the tree must never overwrite the linked file.
    fileSync.stop();
    try {
      const imported = importText(await file.text());
      setTree(imported);
      select([]);
      setError(null);
      refit();
    } catch (e) {
      setError(`Import failed: ${(e as Error).message}`);
    }
  };

  // Points hidden by collapsing their owner don't count as selected.
  const visibleSelection = selectedIds.filter((id) => derivedNodes.some((n) => n.id === id));
  const selected = visibleSelection.length === 1 ? findPoint(tree, visibleSelection[0]) : null;
  const anyExpanded = hasExpanded(tree);

  const sync = fileSync.sync;
  const fileGroup = (
    <div className="group-body">
      {!fileSyncSupported ? (
        <p className="hint">Live file sync needs Chrome or Edge.</p>
      ) : sync ? (
        <div className={`sync-box ${sync.status}`}>
          <div className="sync-name" title={sync.name}>
            🔗 {sync.name}
          </div>
          <div className="sync-state">{syncLabel(sync)}</div>
          {sync.status === 'needs-permission' && <button onClick={fileSync.reconnect}>Reconnect</button>}
          <button onClick={fileSync.stop}>Stop sync</button>
        </div>
      ) : (
        <>
          <button onClick={fileSync.open} title="Open a .md or .json file and keep it in sync while you edit">
            🔗 Open file (live sync)…
          </button>
          <button
            onClick={() => fileSync.saveAs(`${slug(tree.title)}.md`)}
            title="Save this tree to a new file and keep it in sync while you edit"
          >
            🔗 Save to file (live sync)…
          </button>
        </>
      )}
      <button
        onClick={() => {
          fileSync.stop();
          setTree(makeTree());
          select([]);
          refit();
        }}
      >
        New tree
      </button>
      <button onClick={() => fileInput.current?.click()}>Import JSON or README…</button>
      <button onClick={() => download(`${slug(tree.title)}.json`, toJSON(tree), 'application/json')}>Export JSON</button>
      <button onClick={() => download('README.md', toMarkdown(tree), 'text/markdown')}>Export README</button>
      <div className="field">
        Export image
        <div className="field-inline">
          {IMAGE_FORMATS.map((f) => (
            <button key={f} onClick={() => exportImage(f)} title={`The whole diagram as drawn now, as ${f.toUpperCase()}`}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        Load example
        <select
          value=""
          onChange={(e) => {
            const make = EXAMPLES[e.target.value];
            if (make && window.confirm('Replace the current tree with this example?')) {
              fileSync.stop();
              setTree(make());
              select([]);
              refit();
            }
          }}
        >
          <option value="" disabled>
            Choose…
          </option>
          {Object.keys(EXAMPLES).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  const viewGroup = (
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
        <select value={tree.edgeStyle} onChange={(e) => setTree((t) => ({ ...t, edgeStyle: e.target.value as EdgeStyle }))}>
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
            setTree((t) => ({ ...t, layout: e.target.value as LayoutMode }));
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
        <select value={ui.panel} onChange={(e) => setUi((u) => ({ ...u, panel: e.target.value as PanelPosition }))}>
          {PANEL_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {{ left: 'Left', right: 'Right', top: 'Top', bottom: 'Bottom' }[p]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Theme
        <select value={ui.theme} onChange={(e) => setUi((u) => ({ ...u, theme: e.target.value as Theme }))}>
          {THEMES.map((t) => (
            <option key={t} value={t}>
              {{ system: 'System', light: 'Light', dark: 'Dark' }[t]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  const arrangeGroup = (
    <div className="group-body">
      <button onClick={() => setTree((t) => setAllCollapsed(t, anyExpanded))}>
        {anyExpanded ? '▸ Collapse all' : '▾ Expand all'}
      </button>
      <button onClick={() => setTree(clearPins)}>📌 Unpin all</button>
      <p className="hint">
        Drag on empty canvas to select · Shift+click adds a point · Drag to pin · Ctrl+drag moves a point with
        everything after it · Right-drag or scroll to pan
      </p>
    </div>
  );

  return (
    <NodeActionsContext.Provider value={actions}>
      <div className={`app panel-${ui.panel}`}>
        <ControlPanel
          position={ui.panel}
          title={tree.title}
          onTitleChange={(title) => setTree((t) => ({ ...t, title }))}
          groups={[
            { id: 'file', label: 'File', content: fileGroup },
            { id: 'view', label: 'View', content: viewGroup },
            { id: 'arrange', label: 'Arrange', content: arrangeGroup },
          ]}
          activeTab={ui.tab}
          status={
            sync && (
              <span className={`sync-chip ${sync.status}`} title={`${sync.name}: ${syncLabel(sync)}`}>
                🔗
              </span>
            )
          }
          onTabChange={(tab) => setUi((u) => ({ ...u, tab }))}
        />
        <input
          ref={fileInput}
          type="file"
          accept=".json,.md,application/json,text/markdown"
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
          <main className={`workspace ${ui.panel === 'right' ? 'inspector-left' : ''}`}>
            <div className="canvas">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onNodeDragStart={onNodeDragStart}
                onNodeDrag={onNodeDrag}
                onNodeDragStop={onNodeDragStop}
                // Left-drag on the pane draws a selection box; pan with the
                // middle/right button, Space+drag, or the scroll wheel.
                selectionOnDrag
                selectionMode={SelectionMode.Partial}
                panOnDrag={[1, 2]}
                panOnScroll
                zoomOnScroll={false}
                onPaneContextMenu={(e) => e.preventDefault()}
                // Ctrl is taken by "drag with forward points"; Shift+click adds to the selection.
                multiSelectionKeyCode="Shift"
                nodesConnectable={false}
                deleteKeyCode={null}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                colorMode={ui.theme}
              >
                <Background gap={20} />
                <Controls showInteractive={false} />
                <MiniMap pannable zoomable nodeColor={(n) => (n.data as PointNodeType['data']).point.color} />
              </ReactFlow>
            </div>
            {selected && (
              <Inspector
                key={selected.point.id}
                point={selected.point}
                caps={capabilities(tree, selected.point.id)}
                onChange={(patch) => setTree((t) => updatePoint(t, selected.point.id, patch))}
                onAddNext={() => actions.addNext(selected.point.id)}
                onAddBranch={() => actions.addBranch(selected.point.id)}
                onAddLeaf={() => actions.addLeaf(selected.point.id)}
                onReopen={() => setTree((t) => reopen(t, selected.point.id))}
                onRemove={() => remove(selected.point.id)}
                onUnpin={() => actions.unpin(selected.point.id)}
              />
            )}
            {visibleSelection.length > 1 && (
              <aside className="inspector">
                <div className="inspector-kind">{visibleSelection.length} points selected</div>
                <div className="actions">
                  <button
                    onClick={() =>
                      setTree((t) => visibleSelection.reduce((acc, id) => setPin(acc, id, undefined), t))
                    }
                  >
                    📌 Unpin selected
                  </button>
                  <button onClick={() => select([])}>Clear selection</button>
                </div>
                <p className="hint">Drag any selected point to move them all. Shift+click adds or removes a point.</p>
              </aside>
            )}
          </main>
        </div>
      </div>
    </NodeActionsContext.Provider>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}
