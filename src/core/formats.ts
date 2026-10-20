import { PALETTE, countDescendants, parseTree, TreeFormatError, type Chain, type Point, type Tree } from './tree';
import { escapeContentLine, parseOutline, type Diagnostic } from './outline';

export const FORMAT = 'panda-tree';
export const FORMAT_VERSION = 1;

export function toJSON(tree: Tree): string {
  return JSON.stringify({ format: FORMAT, version: FORMAT_VERSION, ...tree }, null, 2);
}

// The README embeds the full tree as base64 JSON in an HTML comment, which is
// invisible on GitHub but lets the same file be imported back losslessly.
const EMBED_RE = /<!--\s*panda-tree:v1\s+([A-Za-z0-9+/=]+)\s*-->/;

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function decodeBase64(b64: string): string {
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function mermaidLabel(text: string): string {
  const clean = (text || ' ').replace(/"/g, '#quot;').replace(/\r?\n/g, ' ');
  return `"${clean}"`;
}

export function toMermaid(tree: Tree): string {
  const lines = [`flowchart ${tree.direction}`];
  const styles: string[] = [];
  let counter = 0;
  const ids = new Map<string, string>();
  const idFor = (id: string) => {
    if (!ids.has(id)) ids.set(id, `n${counter++}`);
    return ids.get(id)!;
  };

  const walk = (chain: Chain) => {
    chain.forEach((p, i) => {
      const id = idFor(p.id);
      const label = mermaidLabel(p.title);
      lines.push(p.kind === 'leaf' ? `  ${id}([${label}])` : `  ${id}[${label}]`);
      styles.push(`  style ${id} fill:${p.color},stroke:#555,color:#111`);
      if (i > 0) lines.push(`  ${idFor(chain[i - 1].id)} --> ${id}`);
      for (const branch of p.branches) {
        walk(branch);
        lines.push(`  ${id} -.-> ${idFor(branch[0].id)}`);
      }
    });
  };
  walk(tree.root);
  return [...lines, ...styles].join('\n');
}

export function toOutline(tree: Tree): string {
  const out: string[] = [];

  const writeChain = (chain: Chain, indent: string) => {
    chain.forEach((p, i) => {
      const marker = `${i + 1}. `;
      const inner = indent + ' '.repeat(marker.length);
      const icon = p.kind === 'leaf' ? '🍃 ' : '';
      const contentLines = p.content.trim() ? p.content.trim().split(/\r?\n/) : [];
      const title = `**${p.title || 'Untitled'}**`;
      const flags = [p.pin ? '📌 pinned' : '', p.collapsed ? '▸ branches collapsed' : ''].filter(Boolean);
      const suffix = flags.length ? ` _(${flags.join(', ')})_` : '';
      // Two trailing spaces force a line break inside the list item.
      out.push(`${indent}${marker}${icon}${title}${suffix}${contentLines.length ? '  ' : ''}`);
      contentLines.forEach((line, j) => {
        out.push(`${inner}${escapeContentLine(line)}${j < contentLines.length - 1 ? '  ' : ''}`);
      });
      p.branches.forEach((branch, b) => {
        out.push(`${inner}- ⎇ Branch ${b + 1}`);
        writeChain(branch, inner + '  ');
      });
    });
  };
  writeChain(tree.root, '');
  return out.join('\n');
}

const DIRECTION_LABEL = { LR: 'left → right', TB: 'top → bottom', RL: 'right → left', BT: 'bottom → top' };

function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/** View settings plus every pinned or collapsed point, as a readable table. */
export function toPins(tree: Tree): string {
  const rows: string[] = [];
  const walk = (chain: Chain, path: string[]) =>
    chain.forEach((p: Point) => {
      const here = [...path, p.title || 'Untitled'];
      if (p.pin || p.collapsed) {
        const pos = p.pin ? `col ${p.pin.col.toFixed(2)}, row ${p.pin.row.toFixed(2)}` : '—';
        const branches = p.collapsed ? `collapsed (${countDescendants(p)} hidden)` : '—';
        rows.push(`| ${cell(here.join(' › '))} | ${pos} | ${branches} |`);
      }
      p.branches.forEach((b) => walk(b, here));
    });
  walk(tree.root, []);

  const settings = `Direction: ${DIRECTION_LABEL[tree.direction]} · Lines: ${
    tree.edgeStyle === 'shortest' ? 'shortest path' : 'fixed sides'
  } · Layout: ${tree.layout}`;
  if (rows.length === 0) return `${settings}\n\nNo points are pinned or collapsed.`;
  return [
    settings,
    '',
    'Positions are in layout grid units: `col` runs along a chain, `row` across it.',
    '',
    '| Point | Pinned position | Branches |',
    '| --- | --- | --- |',
    ...rows,
  ].join('\n');
}

export function toMarkdown(tree: Tree): string {
  return [
    `# ${tree.title}`,
    '',
    '```mermaid',
    toMermaid(tree),
    '```',
    '',
    '## Outline',
    '',
    toOutline(tree),
    '',
    '## Pins',
    '',
    toPins(tree),
    '',
    `<!-- panda-tree:v1 ${encodeBase64(JSON.stringify(tree))} -->`,
    '',
  ].join('\n');
}

export type Source = 'json' | 'embedded' | 'outline' | 'outline+embedded';

export interface Analysis {
  /** Null when the file can't be loaded. */
  tree: Tree | null;
  /** Where the tree came from. */
  source?: Source;
  diagnostics: Diagnostic[];
}

/** Structure and text only: what the outline can express (no ids, colors, pins). */
function fingerprint(tree: Tree): string {
  const chain = (c: Chain): unknown => c.map((p) => [p.kind, p.title, p.content, p.branches.map(chain)]);
  return JSON.stringify([tree.title, chain(tree.root)]);
}

/** Every point keyed by the titles on its path from the main chain; repeats get a counter. */
function byTitlePath(tree: Tree): Map<string, Point> {
  const keys = new Map<string, Point>();
  const walk = (chain: Chain, path: string) =>
    chain.forEach((p) => {
      let key = `${path}\u001f${p.title}`;
      for (let n = 2; keys.has(key); n++) key = `${path}\u001f${p.title}#${n}`;
      keys.set(key, p);
      p.branches.forEach((b) => walk(b, key));
    });
  walk(tree.root, '');
  return keys;
}

/**
 * An outline edited after export: take its structure and text, and keep ids,
 * colors, pins and collapsed state from the embedded tree for every point that
 * is still at the same title path. Settings come from the embedded tree unless
 * the outline's front matter sets them.
 */
function mergeOutline(outline: Tree, embedded: Tree, explicit: Partial<Tree>): Tree {
  const previous = byTitlePath(embedded);
  const used = new Set<string>();
  for (const [key, p] of byTitlePath(outline)) {
    const old = previous.get(key);
    if (!old || old.kind !== p.kind || used.has(old.id)) continue;
    used.add(old.id);
    p.id = old.id;
    if (p.color === (p.kind === 'leaf' ? PALETTE[2] : PALETTE[0])) p.color = old.color;
    if (old.pin) p.pin = old.pin;
    if (old.collapsed && p.branches.length > 0) p.collapsed = true;
  }
  return {
    ...outline,
    direction: explicit.direction ?? embedded.direction,
    edgeStyle: explicit.edgeStyle ?? embedded.edgeStyle,
    layout: explicit.layout ?? embedded.layout,
  };
}

/**
 * Reads a JSON file, an exported README or a hand-written outline, and reports
 * every problem with its line. Used by the app's import and by `bun run check`.
 */
export function analyzeText(text: string): Analysis {
  if (text.trimStart().startsWith('{')) {
    try {
      return { tree: parseTree(JSON.parse(text)), source: 'json', diagnostics: [] };
    } catch (e) {
      return { tree: null, diagnostics: [{ line: 1, severity: 'error', message: `invalid panda-tree JSON: ${(e as Error).message}` }] };
    }
  }

  const outline = parseOutline(text);
  const embedded = text.match(EMBED_RE);
  if (!embedded) return { tree: outline.tree, source: outline.tree ? 'outline' : undefined, diagnostics: outline.diagnostics };

  let saved: Tree;
  try {
    saved = parseTree(JSON.parse(decodeBase64(embedded[1])));
  } catch {
    const line = text.slice(0, embedded.index).split('\n').length;
    return {
      tree: outline.tree,
      source: outline.tree ? 'outline' : undefined,
      diagnostics: [...outline.diagnostics, { line, severity: 'warning', message: 'the embedded tree data is corrupted and was ignored' }],
    };
  }
  // A broken outline can't be read, so the app falls back to the embedded tree;
  // the errors stay, because edits made to the outline would be lost.
  if (!outline.tree) return { tree: saved, source: 'embedded', diagnostics: outline.diagnostics };
  if (fingerprint(outline.tree) === fingerprint(saved)) return { tree: saved, source: 'embedded', diagnostics: outline.diagnostics };
  return {
    tree: mergeOutline(outline.tree, saved, outline.settings),
    source: 'outline+embedded',
    diagnostics: outline.diagnostics,
  };
}

/** Accepts a JSON file, an exported README or a hand-written outline. */
export function importText(text: string): Tree {
  const { tree, diagnostics } = analyzeText(text);
  if (tree) return tree;
  const errors = diagnostics.filter((d) => d.severity === 'error').slice(0, 3);
  throw new TreeFormatError(errors.map((d) => `line ${d.line}: ${d.message}`).join('; '));
}
