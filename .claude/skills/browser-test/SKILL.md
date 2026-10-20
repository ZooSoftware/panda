---
name: browser-test
description: Test the panda editor end to end in Chrome (claude-in-chrome), backing up and restoring the user's own tree. Use after any change to src/app/, src/features/ or src/shared/, or to core code the UI shows.
---

# Browser test of the editor

1. Start the dev server in the background if it isn't running:
   `bun run dev --port 5199 --strictPort`. Vite hot-reloads; reload the tab after model changes.
2. Load the browser tools in one ToolSearch call, get tab context, use a new tab, open
   `http://localhost:5199`.
3. **Back up the user's tree first.** The user works in the same browser profile; their tree
   lives in `localStorage['panda-tree']`:
   ```js
   localStorage.setItem('panda-tree-before-test', localStorage.getItem('panda-tree'))
   ```
4. Check results in the saved data, not only in screenshots, e.g.
   `JSON.parse(localStorage.getItem('panda-tree')).root.find(p => p.title === '2020').pin`.
   Count rendered nodes with `document.querySelectorAll('.react-flow__node').length`.
5. Known quirks of the automation (not app bugs):
   - The user may be moving things in the same tab: re-screenshot before clicking coordinates.
   - Clicks land better through `find` refs than through coordinates.
   - The tool can't hold Ctrl during a drag: dispatch `mousedown` on the node, then `mousemove`
     and `mouseup` on `window`, all with `ctrlKey: true, view: window, buttons: 1`.
   - `window.confirm` (loading an example) blocks the extension: set `window.confirm = () => true`
     first, then change the select with the native value setter and a `change` event.
   - The export buttons download files: don't click them without the user's OK. Test the text
     exporters in `tests/core/formats.test.ts`; test images in the page with
     `await import('/src/features/image-export/exportImage.ts')` (nodes rebuilt from `.react-flow__node` transforms),
     then decode the data URL. Don't print data URLs: the tool blocks them as query data.
   - Also back up and restore `localStorage['panda-ui']` when the test changes the panel or theme.
   - Live file sync: the system file picker can't be automated. Link an origin-private file
     instead: `const fh = await (await navigator.storage.getDirectory()).getFileHandle('t.md',
     { create: true }); await window.__pandaSync.link(fh, 'write')` (dev only). Afterwards click
     Stop sync (clears the remembered handle in IndexedDB, or the user's next reload relinks the
     test file) and `removeEntry('t.md')`.
6. **Restore** the user's tree, reload, and close your tab:
   ```js
   localStorage.setItem('panda-tree', localStorage.getItem('panda-tree-before-test'));
   localStorage.removeItem('panda-tree-before-test')
   ```
