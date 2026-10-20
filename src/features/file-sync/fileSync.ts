// Live link to a file on disk through the File System Access API (Chrome,
// Edge). No server: the browser holds the file handle. The handle is kept in
// IndexedDB so the link survives a reload; the browser asks for permission
// again after a reload, which needs a click.


// Parts of the API that TypeScript's DOM types don't include yet.
type Permission = 'granted' | 'denied' | 'prompt';
interface PickerOptions {
  types?: { description: string; accept: Record<string, string[]> }[];
  suggestedName?: string;
  excludeAcceptAllOption?: boolean;
}
interface PermissionHandle {
  queryPermission?(o: { mode: 'readwrite' }): Promise<Permission>;
  requestPermission?(o: { mode: 'readwrite' }): Promise<Permission>;
}
declare global {
  interface Window {
    showOpenFilePicker?(o?: PickerOptions): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?(o?: PickerOptions): Promise<FileSystemFileHandle>;
  }
}

export const fileSyncSupported = typeof window !== 'undefined' && 'showOpenFilePicker' in window;

const TYPES = [{ description: 'Panda tree (JSON)', accept: { 'application/json': ['.json'] } }];

export async function pickFileToOpen(): Promise<FileSystemFileHandle> {
  const [handle] = await window.showOpenFilePicker!({ types: TYPES });
  return handle;
}

export async function pickFileToSave(suggestedName: string): Promise<FileSystemFileHandle> {
  return window.showSaveFilePicker!({ types: TYPES, suggestedName });
}

/** True when we may read and write; asks the user only if `ask` (needs a click). */
export async function hasPermission(handle: FileSystemFileHandle, ask: boolean): Promise<boolean> {
  const h = handle as FileSystemFileHandle & PermissionHandle;
  if (!h.queryPermission) return true; // e.g. origin-private files: always allowed
  if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
  return ask && (await h.requestPermission!({ mode: 'readwrite' })) === 'granted';
}

export async function readFile(handle: FileSystemFileHandle): Promise<{ text: string; modified: number }> {
  const file = await handle.getFile();
  return { text: await file.text(), modified: file.lastModified };
}

/** Writes the whole file and returns its new modification time. */
export async function writeFile(handle: FileSystemFileHandle, text: string): Promise<number> {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
  return (await handle.getFile()).lastModified;
}

// --- Remembering the linked file across reloads (IndexedDB holds handles). ---

const DB = 'panda';
const STORE = 'handles';
const KEY = 'linked-file';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function rememberHandle(handle: FileSystemFileHandle | null): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    if (handle) tx.objectStore(STORE).put(handle, KEY);
    else tx.objectStore(STORE).delete(KEY);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Storage unavailable (private mode): the link just won't survive a reload.
  }
}

export async function recallHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDb();
    const req = db.transaction(STORE).objectStore(STORE).get(KEY);
    return await new Promise((resolve) => {
      req.onsuccess = () => resolve((req.result as FileSystemFileHandle | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
