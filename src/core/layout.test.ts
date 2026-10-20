import { describe, expect, it } from 'vitest';
import { makePoint, setCollapsed, type Tree } from './tree';
import { layoutGrid, toPin, toPixels } from './layout';
import { nestedTree, tree, yearsTree } from './fixtures';

describe('layout', () => {
  it('stacked: gives every branch its own rows, later points nearest', () => {
    const t = tree();
    t.root[2].branches.push([makePoint({ id: 'c1' })]);
    const grid = layoutGrid(t);
    expect(grid.get('c')).toEqual({ col: 2, row: 0 });
    expect(grid.get('c1')).toEqual({ col: 3, row: 1 });
    expect(grid.get('b1')).toEqual({ col: 2, row: 2 });
  });

  it('packed: lets branches in different columns share rows', () => {
    const t = { ...tree(), layout: 'packed' as const };
    t.root[2].branches.push([makePoint({ id: 'c1' })]);
    const grid = layoutGrid(t);
    expect(grid.get('c1')).toEqual({ col: 3, row: 1 });
    expect(grid.get('b1')).toEqual({ col: 2, row: 1 });
  });

  it('gives collapsed branches no space', () => {
    const t = tree();
    t.root[2].branches.push([makePoint({ id: 'c1' })]);
    const collapsed = setCollapsed(t, 'c', true);
    const grid = layoutGrid(collapsed);
    expect(grid.has('c1')).toBe(false);
    expect(grid.get('b1')).toEqual({ col: 2, row: 1 });
  });

  it('never overlaps nodes, even with nested branches', () => {
    for (const t of [nestedTree('stacked'), nestedTree('packed'), yearsTree(12, 5, 'stacked'), yearsTree(12, 5, 'packed')]) {
      const cells = [...layoutGrid(t).values()].map((c) => `${c.col},${c.row}`);
      expect(new Set(cells).size).toBe(cells.length);
    }
  });

  it('keeps connectors from different points out of the same gap', () => {
    // p and q both sit in column 1 and both grow a branch, so each runs a line
    // down the gap after column 1. q at row 2 would merge into p's line.
    const t: Tree = {
      ...tree(),
      layout: 'packed',
      root: [
        makePoint({
          id: 'a',
          branches: [
            [makePoint({ id: 'p', branches: [[makePoint({ id: 'p1' })]] })],
            [makePoint({ id: 'q', branches: [[makePoint({ id: 'q1' })]] })],
          ],
        }),
      ],
    };
    const grid = layoutGrid(t);
    expect(grid.get('p')).toEqual({ col: 1, row: 1 });
    expect(grid.get('p1')).toEqual({ col: 2, row: 2 });
    expect(grid.get('q')).toEqual({ col: 1, row: 3 });
  });

  it('packs many single-leaf branches into a few rows', () => {
    // 12 points with 5 leaves each: stacked needs a row per leaf, packed only 5.
    const maxRow = (t: Tree) => Math.max(...[...layoutGrid(t).values()].map((c) => c.row));
    expect(maxRow(yearsTree(12, 5, 'stacked'))).toBe(60);
    expect(maxRow(yearsTree(12, 5, 'packed'))).toBe(5);
  });

  it('round-trips pins through every direction', () => {
    for (const dir of ['LR', 'TB', 'RL', 'BT'] as const) {
      const pin = toPin(toPixels({ col: 1.5, row: -2 }, dir), dir);
      expect(pin.col).toBeCloseTo(1.5);
      expect(pin.row).toBeCloseTo(-2);
    }
  });
});
