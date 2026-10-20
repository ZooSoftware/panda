// The outline: a tree written as a Markdown numbered list, the same form the
// README export writes. People and AI agents can write it by hand; the format
// is specified in docs/reference/outline-format.md.
//
//   # Title
//
//   1. **Point**
//      Content, one or more lines.
//      - ⎇ Branch 1
//        1. **Sub point**
//        2. 🍃 **Leaf**
//   2. **Next point** {#fde68a}

import {
  DIRECTIONS,
  EDGE_STYLES,
  LAYOUTS,
  PALETTE,
  makePoint,
  type Chain,
  type Direction,
  type EdgeStyle,
  type LayoutMode,
  type Point,
  type Tree,
} from './tree';

export interface Diagnostic {
  /** 1-based line in the input. */
  line: number;
  severity: 'error' | 'warning';
  message: string;
}

export interface OutlineResult {
  /** Null when there are errors. */
  tree: Tree | null;
  diagnostics: Diagnostic[];
  /** Settings written in the front matter (the rest are defaults). */
  settings: Partial<Pick<Tree, 'direction' | 'edgeStyle' | 'layout'>>;
}

const ITEM = /^(\s*)(\d+[.)])(\s+)(.*)$/;
const BULLET = /^(\s*)([-*+])(\s+)(.*)$/;
const HEADING = /^#\s+(.*?)\s*#*\s*$/;
const FENCE = /^\s*(```|~~~)/;
const COLOR = /\s*\{\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\s*\}\s*$/;
const FLAGS = /\s*_\([^)]*\)_\s*$/;
const LEAF_MARK = '🍃';

/** Branch lines are bullets starting with ⎇ or the word "Branch". */
function isBranchLine(text: string): boolean {
  return text.startsWith('⎇') || /^branch\b/i.test(text);
}

// Markdown escapes the export uses for content that would read as a list item.
function unescape(text: string): string {
  return text.replace(/\\([\\`*_{}[\]()#+\-.!|])/g, '$1');
}

/** Escapes a content line that would otherwise read as a list item. */
export function escapeContentLine(line: string): string {
  return line.replace(/^(\d+)([.)])(\s)/, '$1\\$2$3').replace(/^([-*+])(\s)/, '\\$1$2');
}

interface ParsedItem {
  kind: 'point' | 'leaf';
  title: string;
  color?: string;
  /** Text after the bold title, which is ignored. */
  extra?: string;
}

function parseItem(raw: string): ParsedItem {
  let text = raw.replace(/\s+$/, '').replace(/\\$/, '');
  let kind: ParsedItem['kind'] = 'point';
  if (text.startsWith(LEAF_MARK)) {
    kind = 'leaf';
    text = text.slice(LEAF_MARK.length).trimStart();
  }
  let color: string | undefined;
  const c = text.match(COLOR);
  if (c) {
    color = c[1].toLowerCase();
    text = text.slice(0, c.index);
  }
  text = text.replace(FLAGS, '');
  const bold = text.match(/^\*\*(.+?)\*\*(.*)$/);
  if (bold) {
    const extra = bold[2].trim();
    return { kind, title: unescape(bold[1].trim()), color, extra: extra || undefined };
  }
  return { kind, title: unescape(text.trim()), color };
}

interface Frame {
  /** Column of this chain's list markers. */
  indent: number;
  chain: Chain;
}

interface Settings {
  direction?: Direction;
  edgeStyle?: EdgeStyle;
  layout?: LayoutMode;
}

function readFrontMatter(lines: string[], diagnostics: Diagnostic[]): { settings: Settings; next: number } {
  const settings: Settings = {};
  if (lines[0]?.trim() !== '---') return { settings, next: 0 };
  let i = 1;
  for (; i < lines.length && lines[i].trim() !== '---'; i++) {
    const m = lines[i].match(/^\s*([A-Za-z]+)\s*:\s*(.*?)\s*$/);
    if (!m) continue;
    const [, key, value] = m;
    const line = i + 1;
    const bad = (allowed: readonly string[]) =>
      diagnostics.push({ line, severity: 'error', message: `${key} must be one of ${allowed.join(', ')} (got "${value}")` });
    if (key === 'direction') {
      if (DIRECTIONS.includes(value as Direction)) settings.direction = value as Direction;
      else bad(DIRECTIONS);
    } else if (key === 'lines') {
      if (EDGE_STYLES.includes(value as EdgeStyle)) settings.edgeStyle = value as EdgeStyle;
      else bad(EDGE_STYLES);
    } else if (key === 'layout') {
      if (LAYOUTS.includes(value as LayoutMode)) settings.layout = value as LayoutMode;
      else bad(LAYOUTS);
    } else {
      diagnostics.push({ line, severity: 'warning', message: `unknown setting "${key}" is ignored (use direction, lines, layout)` });
    }
  }
  if (i >= lines.length) {
    diagnostics.push({ line: 1, severity: 'error', message: 'front matter starts with --- but is never closed' });
    return { settings, next: lines.length };
  }
  return { settings, next: i + 1 };
}

/** Reads a tree from an outline. Lines before the first numbered list and after it are ignored. */
export function parseOutline(text: string): OutlineResult {
  const lines = text.split(/\r?\n/);
  const diagnostics: Diagnostic[] = [];
  const error = (line: number, message: string) => diagnostics.push({ line, severity: 'error', message });
  const warn = (line: number, message: string) => diagnostics.push({ line, severity: 'warning', message });

  const { settings, next } = readFrontMatter(lines, diagnostics);

  // Title and the start of the list, skipping code blocks (e.g. the Mermaid diagram).
  let title: string | undefined;
  let start = -1;
  let inFence = false;
  for (let i = next; i < lines.length; i++) {
    if (FENCE.test(lines[i])) inFence = !inFence;
    if (inFence) continue;
    const h = lines[i].match(HEADING);
    if (h && title === undefined) title = h[1];
    if (ITEM.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start < 0) {
    error(1, 'no tree found: write the points as a numbered list, e.g. "1. **Start**"');
    return { tree: null, diagnostics, settings };
  }
  if (title === undefined) warn(1, 'no "# Title" heading before the list; the tree is called "Untitled tree"');

  const rootIndent = lines[start].match(ITEM)![1].length;
  const stack: Frame[] = [];
  const contentCol = new Map<Point, number>();
  const lineOf = new Map<Point, number>();
  const content = new Map<Point, string[]>();
  let pending: { owner: Point; col: number; line: number } | null = null;
  let root: Chain | null = null;

  const lastOf = (frame: Frame) => frame.chain[frame.chain.length - 1];

  for (let i = start; i < lines.length; i++) {
    const line = i + 1;
    const raw = lines[i];
    if (!raw.trim()) continue;
    const indent = raw.length - raw.trimStart().length;

    const item = raw.match(ITEM);
    if (item) {
      const parsed = parseItem(item[4]);
      if (!parsed.title) error(line, 'a point needs a title, e.g. "1. **Start**"');
      if (parsed.extra) warn(line, `text after the title is ignored ("${parsed.extra}"): put content on the next line, indented`);
      const point = makePoint({
        kind: parsed.kind,
        title: parsed.title,
        color: parsed.color ?? (parsed.kind === 'leaf' ? PALETTE[2] : PALETTE[0]),
      });
      lineOf.set(point, line);
      contentCol.set(point, item[1].length + item[2].length + item[3].length);

      // A point left of the branch's owner text is not meant for the branch: the branch is empty.
      if (pending && indent < contentCol.get(pending.owner)!) {
        error(pending.line, 'empty branch: put numbered points under it');
        pending = null;
      }
      if (!root) {
        root = [point];
        stack.push({ indent, chain: root });
      } else if (pending) {
        if (indent < pending.col) {
          error(line, `indent this point at least ${pending.col} spaces to put it in the branch on line ${pending.line}`);
          continue;
        }
        const chain = [point];
        pending.owner.branches.push(chain);
        stack.push({ indent, chain });
        pending = null;
      } else {
        while (stack.length > 1 && stack[stack.length - 1].indent > indent) stack.pop();
        const top = stack[stack.length - 1];
        if (indent === top.indent) top.chain.push(point);
        else if (indent > top.indent) {
          // A list nested right under a point, without a branch line, is a branch too.
          const owner = lastOf(top);
          const col = contentCol.get(owner)!;
          if (indent < col) {
            error(
              line,
              `indentation is between two levels: use ${top.indent} spaces to continue the chain, or at least ${col} to branch from "${owner.title}"`,
            );
            continue;
          }
          const chain = [point];
          owner.branches.push(chain);
          stack.push({ indent, chain });
        } else {
          error(line, `indentation (${indent}) doesn't match any open list; the main chain starts at ${rootIndent}`);
          continue;
        }
      }
      continue;
    }

    const bullet = raw.match(BULLET);
    if (bullet && isBranchLine(bullet[4])) {
      if (pending) error(pending.line, 'empty branch: put numbered points under it');
      // Branches have no names; a label here would be silently lost.
      const label = bullet[4].replace(/^⎇\s*/, '').trim();
      if (label && !/^branch(\s+\d+)?$/i.test(label))
        warn(line, `branch name "${label}" is not kept (branches have no names): to show it, make it the branch's first point, "1. **${label}**"`);
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
      const owner = lastOf(stack[stack.length - 1]);
      const col = contentCol.get(owner)!;
      if (indent < col) {
        error(line, `indent the branch line at least ${col} spaces to branch from "${owner.title}"`);
        continue;
      }
      pending = { owner, col: indent + bullet[2].length + bullet[3].length, line };
      continue;
    }

    // Anything else at the main chain's indent (a heading, a paragraph) ends the tree.
    if (indent <= rootIndent) break;

    if (pending) {
      error(line, `a branch line (line ${pending.line}) must be followed by numbered points`);
      pending = null;
    }
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    const target = lastOf(stack[stack.length - 1]);
    const text = unescape(raw.trim().replace(/\\$/, ''));
    content.set(target, [...(content.get(target) ?? []), text]);
  }
  if (pending) error(pending.line, 'empty branch: put numbered points under it');

  for (const [point, textLines] of content) point.content = textLines.join('\n');

  // Leaf rules (docs/decisions/0002).
  const check = (chain: Chain) =>
    chain.forEach((p, i) => {
      if (p.kind === 'leaf' && i < chain.length - 1)
        error(lineOf.get(p)!, `leaf "${p.title}" must be the last point of its chain; nothing can follow a leaf`);
      if (p.kind === 'leaf' && p.branches.length > 0) error(lineOf.get(p)!, `leaf "${p.title}" can't have branches`);
      p.branches.forEach(check);
    });
  check(root!);

  diagnostics.sort((a, b) => a.line - b.line);
  if (diagnostics.some((d) => d.severity === 'error')) return { tree: null, diagnostics, settings };
  return {
    tree: {
      title: title ?? 'Untitled tree',
      direction: settings.direction ?? 'LR',
      edgeStyle: settings.edgeStyle ?? 'sides',
      layout: settings.layout ?? 'stacked',
      root: root!,
    },
    diagnostics,
    settings,
  };
}
