// Core data model.
//
// A tree is a root chain. A chain is an ordered list of points: prev/next are
// implied by array position. Any point can grow branches; each branch is
// another chain. A leaf is a point that ends its chain: it must be last and
// has no branches.

export type Direction = 'LR' | 'TB' | 'RL' | 'BT';
export type PointKind = 'point' | 'leaf';
/** 'sides': lines attach to fixed sides by direction. 'shortest': straight line between nearest borders. */
export type EdgeStyle = 'sides' | 'shortest';
/** 'stacked': every branch gets its own rows. 'packed': branches share rows where nothing collides. */
export type LayoutMode = 'stacked' | 'packed';

/** Pinned position in layout grid units (col = along chain, row = across). */
export interface Pin {
  col: number;
  row: number;
}

export interface Point {
  id: string;
  kind: PointKind;
  title: string;
  content: string;
  color: string;
  pin?: Pin;
  /** Branches hidden in the view. Saved with the tree like a pin. */
  collapsed?: boolean;
  branches: Chain[];
}

export type Chain = Point[];

export interface Tree {
  title: string;
  direction: Direction;
  edgeStyle: EdgeStyle;
  layout: LayoutMode;
  root: Chain;
}

export const DIRECTIONS: Direction[] = ['LR', 'TB', 'RL', 'BT'];
export const EDGE_STYLES: EdgeStyle[] = ['sides', 'shortest'];
export const LAYOUTS: LayoutMode[] = ['stacked', 'packed'];

export const PALETTE = [
  '#ffffff',
  '#fde68a',
  '#bbf7d0',
  '#bfdbfe',
  '#fbcfe8',
  '#ddd6fe',
  '#fed7aa',
  '#e5e7eb',
];

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function makePoint(partial: Partial<Point> = {}): Point {
  return {
    id: newId(),
    kind: 'point',
    title: 'New point',
    content: '',
    color: PALETTE[0],
    branches: [],
    ...partial,
  };
}

export function makeTree(): Tree {
  return {
    title: 'Untitled tree',
    direction: 'LR',
    edgeStyle: 'sides',
    layout: 'stacked',
    root: [makePoint({ title: 'Start' })],
  };
}

export interface Location {
  point: Point;
  chain: Chain;
  index: number;
  /** Point that owns `chain` as a branch; null for the root chain. */
  parent: Point | null;
}

export function findPoint(tree: Tree, id: string): Location | null {
  const walk = (chain: Chain, parent: Point | null): Location | null => {
    for (let index = 0; index < chain.length; index++) {
      const point = chain[index];
      if (point.id === id) return { point, chain, index, parent };
      for (const branch of point.branches) {
        const found = walk(branch, point);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(tree.root, null);
}

export function forEachPoint(tree: Tree, fn: (p: Point) => void): void {
  const walk = (chain: Chain) =>
    chain.forEach((p) => {
      fn(p);
      p.branches.forEach(walk);
    });
  walk(tree.root);
}

/** Branches of a point that are shown: none while it is collapsed. */
export function visibleBranches(point: Point): Chain[] {
  return point.collapsed ? [] : point.branches;
}

/** Number of points inside a point's branches, at any depth. */
export function countDescendants(point: Point): number {
  return point.branches.reduce((sum, chain) => sum + chain.reduce((n, p) => n + 1 + countDescendants(p), 0), 0);
}

/** Leaves inside a point's branches, at any depth. Points after it in its own chain don't count. */
export function countLeaves(point: Point): number {
  return point.branches.reduce(
    (sum, chain) => sum + chain.reduce((n, p) => n + (p.kind === 'leaf' ? 1 : 0) + countLeaves(p), 0),
    0,
  );
}

export interface Capabilities {
  addNext: boolean;
  addBranch: boolean;
  reopen: boolean;
  remove: boolean;
}

export function capabilities(tree: Tree, id: string): Capabilities {
  const loc = findPoint(tree, id);
  if (!loc) return { addNext: false, addBranch: false, reopen: false, remove: false };
  const isLeaf = loc.point.kind === 'leaf';
  const onlyRootPoint = loc.parent === null && loc.chain.length === 1;
  return {
    addNext: !isLeaf,
    addBranch: !isLeaf,
    reopen: isLeaf,
    remove: !onlyRootPoint,
  };
}

// All edits return a new tree and leave the input untouched.
function edit(tree: Tree, id: string, fn: (loc: Location) => void): Tree {
  const next = structuredClone(tree);
  const loc = findPoint(next, id);
  if (loc) fn(loc);
  return next;
}

export function updatePoint(tree: Tree, id: string, patch: Partial<Omit<Point, 'id' | 'branches' | 'kind'>>): Tree {
  return edit(tree, id, ({ point }) => Object.assign(point, patch));
}

/** Insert a new point right after `id` in the same chain. Returns the new id. */
export function addNext(tree: Tree, id: string): [Tree, string | null] {
  if (!capabilities(tree, id).addNext) return [tree, null];
  const point = makePoint({ title: 'Next point' });
  return [edit(tree, id, ({ chain, index }) => chain.splice(index + 1, 0, point)), point.id];
}

function growBranch(tree: Tree, id: string, first: Point): [Tree, string | null] {
  if (!capabilities(tree, id).addBranch) return [tree, null];
  return [
    edit(tree, id, ({ point: owner }) => {
      owner.branches.push([first]);
      // Show the new branch even if the others were hidden.
      delete owner.collapsed;
    }),
    first.id,
  ];
}

/** Grow a new branch from `id`, starting with one sub-point. Returns the new id. */
export function addBranch(tree: Tree, id: string): [Tree, string | null] {
  return growBranch(tree, id, makePoint({ title: 'Sub point' }));
}

/** Grow a new branch from `id` that is just a leaf. A point can have any number. */
export function addLeaf(tree: Tree, id: string): [Tree, string | null] {
  return growBranch(tree, id, makePoint({ kind: 'leaf', title: 'Leaf', color: PALETTE[2] }));
}

/** Turn a leaf back into a regular point so its chain can continue. */
export function reopen(tree: Tree, id: string): Tree {
  if (!capabilities(tree, id).reopen) return tree;
  return edit(tree, id, ({ point }) => {
    point.kind = 'point';
  });
}

/** Remove a point and everything branching from it. Neighbours re-link. */
export function removePoint(tree: Tree, id: string): Tree {
  if (!capabilities(tree, id).remove) return tree;
  return edit(tree, id, ({ chain, index, parent }) => {
    chain.splice(index, 1);
    if (chain.length === 0 && parent) {
      parent.branches = parent.branches.filter((b) => b !== chain);
    }
  });
}

export function setPin(tree: Tree, id: string, pin: Pin | undefined): Tree {
  return edit(tree, id, ({ point }) => {
    if (pin) point.pin = pin;
    else delete point.pin;
  });
}

export function setCollapsed(tree: Tree, id: string, collapsed: boolean): Tree {
  return edit(tree, id, ({ point }) => {
    if (collapsed && point.branches.length > 0) point.collapsed = true;
    else delete point.collapsed;
  });
}

/** True while any point with branches still shows them. */
export function hasExpanded(tree: Tree): boolean {
  let found = false;
  forEachPoint(tree, (p) => {
    if (p.branches.length > 0 && !p.collapsed) found = true;
  });
  return found;
}

export function setAllCollapsed(tree: Tree, collapsed: boolean): Tree {
  const next = structuredClone(tree);
  forEachPoint(next, (p) => {
    if (collapsed && p.branches.length > 0) p.collapsed = true;
    else delete p.collapsed;
  });
  return next;
}

/** The point, every later point in its chain, and everything branching from those. */
export function forwardIds(tree: Tree, id: string): string[] {
  const loc = findPoint(tree, id);
  if (!loc) return [];
  const ids: string[] = [];
  const walk = (chain: Chain) =>
    chain.forEach((p) => {
      ids.push(p.id);
      p.branches.forEach(walk);
    });
  walk(loc.chain.slice(loc.index));
  return ids;
}

export function setPins(tree: Tree, pins: Map<string, Pin>): Tree {
  const next = structuredClone(tree);
  forEachPoint(next, (p) => {
    const pin = pins.get(p.id);
    if (pin) p.pin = pin;
  });
  return next;
}

export function clearPins(tree: Tree): Tree {
  const next = structuredClone(tree);
  forEachPoint(next, (p) => delete p.pin);
  return next;
}

// ---------------------------------------------------------------------------
// Validation for imported data.

export class TreeFormatError extends Error {}

function fail(msg: string): never {
  throw new TreeFormatError(msg);
}

export function parseTree(data: unknown): Tree {
  if (typeof data !== 'object' || data === null) fail('Tree must be an object');
  const raw = data as Record<string, unknown>;
  const direction = (raw.direction ?? 'LR') as Direction;
  if (!DIRECTIONS.includes(direction)) fail(`Unknown direction "${String(raw.direction)}"`);
  const edgeStyle = (raw.edgeStyle ?? 'sides') as EdgeStyle;
  if (!EDGE_STYLES.includes(edgeStyle)) fail(`Unknown edge style "${String(raw.edgeStyle)}"`);
  const layout = (raw.layout ?? 'stacked') as LayoutMode;
  if (!LAYOUTS.includes(layout)) fail(`Unknown layout "${String(raw.layout)}"`);
  const seen = new Set<string>();

  const parseChain = (value: unknown, path: string): Chain => {
    if (!Array.isArray(value) || value.length === 0) fail(`${path} must be a non-empty array of points`);
    return value.map((item, i) => {
      const at = `${path}[${i}]`;
      if (typeof item !== 'object' || item === null) fail(`${at} must be an object`);
      const p = item as Record<string, unknown>;
      let id = typeof p.id === 'string' && p.id ? p.id : newId();
      if (seen.has(id)) id = newId();
      seen.add(id);
      const kind = (p.kind ?? 'point') as PointKind;
      if (kind !== 'point' && kind !== 'leaf') fail(`${at}.kind must be "point" or "leaf"`);
      const branches = p.branches === undefined ? [] : p.branches;
      if (!Array.isArray(branches)) fail(`${at}.branches must be an array`);
      if (kind === 'leaf' && branches.length > 0) fail(`${at} is a leaf and cannot have branches`);
      if (kind === 'leaf' && i !== value.length - 1) fail(`${at} is a leaf but is not last in its chain`);
      const pin = p.pin as Pin | undefined;
      const validPin = pin && typeof pin.col === 'number' && typeof pin.row === 'number';
      const collapsed = p.collapsed === true && branches.length > 0;
      return {
        id,
        kind,
        title: String(p.title ?? ''),
        content: String(p.content ?? ''),
        color: typeof p.color === 'string' ? p.color : PALETTE[0],
        ...(validPin ? { pin: { col: pin.col, row: pin.row } } : {}),
        ...(collapsed ? { collapsed } : {}),
        branches: branches.map((b, j) => parseChain(b, `${at}.branches[${j}]`)),
      };
    });
  };

  return {
    title: String(raw.title ?? 'Untitled tree'),
    direction,
    edgeStyle,
    layout,
    root: parseChain(raw.root, 'root'),
  };
}
