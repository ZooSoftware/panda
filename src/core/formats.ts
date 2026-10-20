import { countDescendants, parseTree, TreeFormatError, type Chain, type Point, type Tree } from './tree';

export const FORMAT = 'panda-tree';
export const FORMAT_VERSION = 1;

export function toJSON(tree: Tree): string {
  return JSON.stringify({ format: FORMAT, version: FORMAT_VERSION, ...tree }, null, 2);
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

/** Escapes a content line that Markdown would otherwise render as a list item. */
function escapeContentLine(line: string): string {
  return line.replace(/^(\d+)([.)])(\s)/, '$1\\$2$3').replace(/^([-*+])(\s)/, '\\$1$2');
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

/** A README to read the tree on GitHub. One-way: panda opens only JSON (docs/decisions/0017). */
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
  ].join('\n');
}

/** Reads a saved tree (JSON). Missing fields get their defaults; see parseTree. */
export function importText(text: string): Tree {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new TreeFormatError('not a panda tree: the file is not valid JSON (run `bun run check` on it for details)', {
      cause: e,
    });
  }
  return parseTree(data);
}
