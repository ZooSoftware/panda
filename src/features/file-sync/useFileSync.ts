import { useCallback, useEffect, useRef, useState } from 'react';
import { importText, toJSON } from '../../core/formats';
import type { Tree } from '../../core/tree';
import {
  hasPermission,
  pickFileToOpen,
  pickFileToSave,
  readFile,
  recallHandle,
  rememberHandle,
  writeFile,
} from './fileSync';

export type SyncStatus = 'synced' | 'saving' | 'needs-permission' | 'error';

export interface SyncState {
  name: string;
  status: SyncStatus;
  /** Time of the last successful read or write. */
  at?: number;
  message?: string;
}

const WRITE_DELAY = 300; // ms after the last edit

/** The tree without ids: a hand-written file without ids gets new ones on every read. */
function sameTree(a: Tree, b: Tree): boolean {
  const strip = (t: Tree) => JSON.stringify(t, (key, value) => (key === 'id' ? undefined : value));
  return strip(a) === strip(b);
}

/** The parse error, with line and column when the browser reports a position. */
function describe(e: unknown, text: string): string {
  const cause = (e as Error).cause ?? e;
  const message = (cause as Error).message ?? String(cause);
  const at = message.match(/position (\d+)/);
  if (!at) return message;
  const before = text.slice(0, Number(at[1])).split('\n');
  return `${message.replace(/\s*\(?at position \d+\)?/, '')} at line ${before.length}, column ${before[before.length - 1].length + 1}`;
}
const POLL_EVERY = 1000; // ms between checks for changes made outside the app

/**
 * Keeps the tree and one file on disk in sync: edits are written to the file
 * shortly after they happen, and changes made to the file elsewhere are loaded.
 */
export function useFileSync(tree: Tree, loadTree: (tree: Tree) => void, onError: (message: string) => void) {
  const [sync, setSync] = useState<SyncState | null>(null);
  const handle = useRef<FileSystemFileHandle | null>(null);
  // A remembered handle that still needs the user's permission.
  const pending = useRef<FileSystemFileHandle | null>(null);
  // What the file holds as far as we know, to tell our writes from outside changes.
  const known = useRef({ text: '', modified: 0 });
  // The tree last loaded from the file: never written straight back.
  const fromFile = useRef<Tree | null>(null);
  const writing = useRef(false);
  // The file on disk is invalid (e.g. saved mid-edit in a text editor): don't
  // overwrite it until it is valid again, or those edits would be lost.
  const paused = useRef(false);
  const treeRef = useRef(tree);
  treeRef.current = tree;

  const update = (patch: Partial<SyncState>) => setSync((s) => (s ? { ...s, ...patch } : s));

  /** Starts syncing with `h`: 'read' loads the file into the app, 'write' writes the app's tree to it. */
  const link = useCallback(
    async (h: FileSystemFileHandle, start: 'read' | 'write') => {
      if (start === 'read') {
        const { text, modified } = await readFile(h);
        const loaded = importText(text);
        known.current = { text, modified };
        fromFile.current = loaded;
        loadTree(loaded);
      } else {
        const text = toJSON(treeRef.current);
        known.current = { text, modified: await writeFile(h, text) };
      }
      handle.current = h;
      pending.current = null;
      paused.current = false;
      setSync({ name: h.name, status: 'synced', at: Date.now() });
      await rememberHandle(h);
    },
    [loadTree],
  );

  const run = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action();
      } catch (e) {
        if ((e as Error).name !== 'AbortError') onError((e as Error).message); // AbortError: picker cancelled
      }
    },
    [onError],
  );

  const open = useCallback(() => run(async () => link(await pickFileToOpen(), 'read')), [run, link]);
  const saveAs = useCallback(
    (suggestedName: string) => run(async () => link(await pickFileToSave(suggestedName), 'write')),
    [run, link],
  );
  const reconnect = useCallback(
    () =>
      run(async () => {
        const h = pending.current;
        if (h && (await hasPermission(h, true))) await link(h, 'read');
      }),
    [run, link],
  );
  const stop = useCallback(() => {
    handle.current = null;
    pending.current = null;
    setSync(null);
    void rememberHandle(null);
  }, []);

  // After a reload: relink the remembered file, or wait for a click if the
  // browser wants permission again.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const h = await recallHandle();
      if (!h || cancelled) return;
      if (await hasPermission(h, false)) await run(() => link(h, 'read'));
      else {
        pending.current = h;
        setSync({ name: h.name, status: 'needs-permission' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [link, run]);

  // App → file: write shortly after each edit.
  useEffect(() => {
    const h = handle.current;
    if (!h || tree === fromFile.current) return;
    const timer = setTimeout(async () => {
      if (handle.current !== h || paused.current) return;
      const text = toJSON(tree);
      if (text === known.current.text) return;
      writing.current = true;
      update({ status: 'saving' });
      try {
        known.current = { text, modified: await writeFile(h, text) };
        update({ status: 'synced', at: Date.now(), message: undefined });
      } catch (e) {
        update({ status: 'error', message: `Can't write the file: ${(e as Error).message}` });
      } finally {
        writing.current = false;
      }
    }, WRITE_DELAY);
    return () => clearTimeout(timer);
  }, [tree]);

  // File → app: load changes made outside the app.
  const active = sync !== null && sync.status !== 'needs-permission';
  useEffect(() => {
    if (!active) return;
    const id = setInterval(async () => {
      const h = handle.current;
      if (!h || writing.current) return;
      try {
        const file = await h.getFile();
        if (file.lastModified === known.current.modified) return;
        const text = await file.text();
        if (writing.current || handle.current !== h) return;
        known.current = { text, modified: file.lastModified };
        let loaded: Tree;
        try {
          loaded = importText(text);
        } catch (e) {
          paused.current = true;
          update({
            status: 'error',
            message: `Paused: the file isn't a valid tree (${describe(e, text)}). Fix it and sync resumes; edits here aren't saved until then.`,
          });
          return;
        }
        const wasPaused = paused.current;
        paused.current = false;
        // Same tree, only formatted differently (e.g. a final newline): nothing to load.
        if (!wasPaused && sameTree(loaded, treeRef.current)) return update({ status: 'synced', message: undefined });
        fromFile.current = loaded;
        loadTree(loaded);
        update({ status: 'synced', at: Date.now(), message: undefined });
      } catch (e) {
        update({ status: 'error', message: `Can't read the file: ${(e as Error).message}` });
      }
    }, POLL_EVERY);
    return () => clearInterval(id);
  }, [active, loadTree]);

  // Dev only: lets a browser test link an origin-private file without a picker.
  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { __pandaSync: { link } });
  }, [link]);

  return { sync, open, saveAs, reconnect, stop };
}
