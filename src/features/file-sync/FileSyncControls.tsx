import { fileSyncSupported } from './fileSync';
import type { SyncState, useFileSync } from './useFileSync';

type FileSync = ReturnType<typeof useFileSync>;

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

/** Open / save a linked file, or the linked file's state with Reconnect and Stop. */
export function FileSyncControls({ fileSync, suggestedName }: { fileSync: FileSync; suggestedName: string }) {
  const { sync } = fileSync;
  if (!fileSyncSupported) return <p className="hint">Live file sync needs Chrome or Edge.</p>;
  if (sync) {
    return (
      <div className={`sync-box ${sync.status}`}>
        <div className="sync-name" title={sync.name}>
          🔗 {sync.name}
        </div>
        <div className="sync-state">{syncLabel(sync)}</div>
        {sync.status === 'needs-permission' && <button onClick={fileSync.reconnect}>Reconnect</button>}
        <button onClick={fileSync.stop}>Stop sync</button>
      </div>
    );
  }
  return (
    <>
      <button onClick={fileSync.open} title="Open a panda .json file and keep it in sync while you edit">
        🔗 Open file (live sync)…
      </button>
      <button
        onClick={() => fileSync.saveAs(suggestedName)}
        title="Save this tree to a new file and keep it in sync while you edit"
      >
        🔗 Save to file (live sync)…
      </button>
    </>
  );
}

/** The 🔗 next to the title while a file is linked. */
export function SyncChip({ sync }: { sync: SyncState | null }) {
  if (!sync) return null;
  return (
    <span className={`sync-chip ${sync.status}`} title={`${sync.name}: ${syncLabel(sync)}`}>
      🔗
    </span>
  );
}
