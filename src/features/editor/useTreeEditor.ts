import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addBranch,
  addLeaf,
  addNext,
  findPoint,
  makeTree,
  removePoint,
  reopen,
  setCollapsed,
  setPin,
  setPins,
  updatePoint,
  type Pin,
  type Point,
  type Tree,
} from '../../core/tree';
import { importText, toJSON } from '../../core/formats';

const STORAGE_KEY = 'panda-tree';

function loadSaved(): Tree {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return importText(raw);
  } catch {
    // Unreadable storage or stale data: start a new tree.
  }
  return makeTree();
}

export type PointPatch = Partial<Pick<Point, 'title' | 'content' | 'color'>>;

/**
 * The tree being edited and the selection: every change to the tree goes
 * through here. The tree is saved to the browser after each change.
 */
export function useTreeEditor() {
  const [tree, setTree] = useState<Tree>(loadSaved);
  const [selectedIds, select] = useState<string[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, toJSON(tree));
    } catch {
      // Storage may be unavailable (private mode); editing still works.
    }
  }, [tree]);

  // Run an edit that may create a point, then select the new point.
  const grow = useCallback(
    (op: (t: Tree, id: string) => [Tree, string | null], id: string) => {
      const [next, newId] = op(tree, id);
      if (!newId) return;
      setTree(next);
      select([newId]);
    },
    [tree],
  );

  const actions = useMemo(
    () => ({
      addNext: (id: string) => grow(addNext, id),
      addBranch: (id: string) => grow(addBranch, id),
      addLeaf: (id: string) => grow(addLeaf, id),
      update: (id: string, patch: PointPatch) => setTree((t) => updatePoint(t, id, patch)),
      reopen: (id: string) => setTree((t) => reopen(t, id)),
      toggleCollapsed: (id: string) => setTree((t) => setCollapsed(t, id, !findPoint(t, id)?.point.collapsed)),
      pin: (pins: Map<string, Pin>) => setTree((t) => setPins(t, pins)),
      unpin: (ids: string[]) => setTree((t) => ids.reduce((acc, id) => setPin(acc, id, undefined), t)),
      remove: (id: string) => {
        setTree((t) => removePoint(t, id));
        select([]);
      },
    }),
    [grow],
  );

  /** A change to the whole tree: settings, collapse all, unpin all. */
  const edit = useCallback((fn: (t: Tree) => Tree) => setTree(fn), []);

  /** Swap in another tree (new, imported, loaded from a file); clears the selection. */
  const replace = useCallback((next: Tree) => {
    setTree(next);
    select([]);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' && selectedIds.length === 1) actions.remove(selectedIds[0]);
      if (e.key === 'Escape') select([]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds, actions]);

  return { tree, selectedIds, select, actions, edit, replace };
}

export type TreeActions = ReturnType<typeof useTreeEditor>['actions'];
