import { useCallback, useEffect, useRef, useState } from 'react';
import { importText } from '../../core/formats';
import type { Tree } from '../../core/tree';
import {
  hasPermission,
  pickFileToOpen,
  pickFileToSave,
  readFile,
  recallHandle,
  rememberHandle,
  serializeFor,
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
        const text = serializeFor(h.name, treeRef.current);
        known.current = { text, modified: await writeFile(h, text) };
      }
      handle.current = h;
      pending.current = null;
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
      if (handle.current !== h) return;
      const text = serializeFor(h.name, tree);
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
        if (text === serializeFor(h.name, treeRef.current)) return;
        const loaded = importText(text);
        fromFile.current = loaded;
        loadTree(loaded);
        update({ status: 'synced', at: Date.now(), message: undefined });
      } catch (e) {
        update({ status: 'error', message: `The file changed but can't be read: ${(e as Error).message}` });
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
