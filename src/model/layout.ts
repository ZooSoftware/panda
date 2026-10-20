import { visibleBranches, type Chain, type Direction, type Pin, type Tree } from './tree';

// Layout happens in grid units: `col` runs along a chain, `row` runs across
// it. A branch of the point at (c, r) always starts at (c + 1, R) with R > r.
// Two modes decide R; collapsed branches take no space in either.

export interface Cell {
  col: number;
  row: number;
}

export function layoutGrid(tree: Tree): Map<string, Cell> {
  return tree.layout === 'packed' ? shapeOf(tree.root).nodes : stacked(tree.root);
}

// Stacked: every branch gets its own band of rows below its chain. Later
// points take the nearer rows so the connector from an earlier point never
// crosses another branch. Simple and predictable, but tall.
function stacked(root: Chain): Map<string, Cell> {
  const cells = new Map<string, Cell>();

  // Places a chain at (col,row) and returns how many rows it used.
  const place = (chain: Chain, col: number, row: number): number => {
    chain.forEach((p, i) => cells.set(p.id, { col: col + i, row }));
    let cursor = row + 1;
    for (let i = chain.length - 1; i >= 0; i--) {
      for (const branch of visibleBranches(chain[i])) {
        cursor += place(branch, col + i + 1, cursor);
      }
    }
    return cursor - row;
  };

  place(root, 0, 0);
  return cells;
}

// Packed: the connector of a branch runs down the gap ("lane") between column
// c and c + 1. Branches go into the nearest rows where they hit no node and
// share no lane with another point's connector. Compact, but a point's
// branches sit under the next point of its chain.

/** A laid-out chain relative to its own origin. */
interface Shape {
  nodes: Map<string, Cell>;
  /** Occupied node cells, keyed "col,row". */
  taken: Set<string>;
  /** Lane cells (gap right of `col` at `row`) -> id of the point whose line uses it. */
  lanes: Map<string, string>;
}

const key = (col: number, row: number) => `${col},${row}`;

function shapeOf(chain: Chain): Shape {
  const shape: Shape = { nodes: new Map(), taken: new Set(), lanes: new Map() };
  chain.forEach((p, i) => {
    shape.nodes.set(p.id, { col: i, row: 0 });
    shape.taken.add(key(i, 0));
    // The chain edge to the next point crosses this lane.
    if (i < chain.length - 1) shape.lanes.set(key(i, 0), p.id);
  });

  for (let i = chain.length - 1; i >= 0; i--) {
    const owner = chain[i].id;
    for (const branch of visibleBranches(chain[i])) {
      const sub = shapeOf(branch);
      let row = 1;
      while (!fits(shape, sub, i + 1, row, i, owner)) row++;
      merge(shape, sub, i + 1, row);
      for (let r = 0; r <= row; r++) shape.lanes.set(key(i, r), owner);
    }
  }
  return shape;
}

function laneFree(shape: Shape, col: number, row: number, owner: string): boolean {
  const used = shape.lanes.get(key(col, row));
  return used === undefined || used === owner;
}

function fits(shape: Shape, sub: Shape, col: number, row: number, laneCol: number, owner: string): boolean {
  for (const k of sub.taken) {
    const [c, r] = k.split(',').map(Number);
    if (shape.taken.has(key(c + col, r + row))) return false;
  }
  for (const [k, subOwner] of sub.lanes) {
    const [c, r] = k.split(',').map(Number);
    if (!laneFree(shape, c + col, r + row, subOwner)) return false;
  }
  for (let r = 0; r <= row; r++) {
    if (!laneFree(shape, laneCol, r, owner)) return false;
  }
  return true;
}

function merge(shape: Shape, sub: Shape, col: number, row: number): void {
  for (const [id, cell] of sub.nodes) shape.nodes.set(id, { col: cell.col + col, row: cell.row + row });
  for (const k of sub.taken) {
    const [c, r] = k.split(',').map(Number);
    shape.taken.add(key(c + col, r + row));
  }
  for (const [k, owner] of sub.lanes) {
    const [c, r] = k.split(',').map(Number);
    shape.lanes.set(key(c + col, r + row), owner);
  }
}


// Pixel spacing per grid unit. Vertical flows need less room per step
// because nodes are wider than they are tall.
const SPACING: Record<Direction, { main: number; cross: number }> = {
  LR: { main: 260, cross: 140 },
  RL: { main: 260, cross: 140 },
  TB: { main: 150, cross: 250 },
  BT: { main: 150, cross: 250 },
};

export function toPixels(cell: Cell, dir: Direction): { x: number; y: number } {
  const { main, cross } = SPACING[dir];
  switch (dir) {
    case 'LR':
      return { x: cell.col * main, y: cell.row * cross };
    case 'RL':
      return { x: -cell.col * main, y: cell.row * cross };
    case 'TB':
      return { x: cell.row * cross, y: cell.col * main };
    case 'BT':
      return { x: cell.row * cross, y: -cell.col * main };
  }
}

/** Inverse of toPixels, so a dragged position can be stored as a pin. */
export function toPin(pos: { x: number; y: number }, dir: Direction): Pin {
  const { main, cross } = SPACING[dir];
  switch (dir) {
    case 'LR':
      return { col: pos.x / main, row: pos.y / cross };
    case 'RL':
      return { col: -pos.x / main, row: pos.y / cross };
    case 'TB':
      return { col: pos.y / main, row: pos.x / cross };
    case 'BT':
      return { col: -pos.y / main, row: pos.x / cross };
  }
}

export function nextDirection(dir: Direction): Direction {
  const order: Direction[] = ['LR', 'TB', 'RL', 'BT'];
  return order[(order.indexOf(dir) + 1) % order.length];
}
