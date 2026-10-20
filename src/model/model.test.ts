import { describe, expect, it } from 'vitest';
import {
  addBranch,
  addLeaf,
  addNext,
  capabilities,
  findPoint,
  makePoint,
  parseTree,
  removePoint,
  reopen,
  forwardIds,
  countLeaves,
  hasExpanded,
  setAllCollapsed,
  setCollapsed,
  setPin,
  type Tree,
} from './tree';
import { layoutGrid, toPin, toPixels } from './layout';
import { importText, toJSON, toMarkdown } from './exporters';

/** Years on the main chain, each growing `perYear` single-leaf branches. */
function yearsTree(years: number, perYear: number, layout: Tree['layout']): Tree {
  return {
    ...tree(),
    layout,
    root: Array.from({ length: years }, () =>
      makePoint({ branches: Array.from({ length: perYear }, () => [makePoint({ kind: 'leaf' })]) }),
    ),
  };
}

/** Chains, branches of branches and leaves at several depths. */
function nestedTree(layout: Tree['layout']): Tree {
  const leaf = () => makePoint({ kind: 'leaf' });
  return {
    ...tree(),
    layout,
    root: [
      makePoint(),
      makePoint({ branches: [[makePoint(), makePoint(), leaf()]] }),
      makePoint({
        branches: [[makePoint({ branches: [[leaf()]] }), makePoint()], [makePoint()]],
      }),
      makePoint(),
      leaf(),
    ],
  };
}

function tree(): Tree {
  return {
    title: 'T',
    direction: 'LR',
    edgeStyle: 'sides',
    layout: 'stacked',
    root: [
      makePoint({ id: 'a', title: 'A' }),
      makePoint({ id: 'b', title: 'B', branches: [[makePoint({ id: 'b1', title: 'B1' })]] }),
      makePoint({ id: 'c', title: 'C' }),
    ],
  };
}

describe('editing', () => {
  it('inserts next point after the given one', () => {
    const [t, id] = addNext(tree(), 'a');
    expect(t.root.map((p) => p.id)).toEqual(['a', id, 'b', 'c']);
  });

  it('grows a branch with one sub-point', () => {
    const [t, id] = addBranch(tree(), 'c');
    expect(findPoint(t, id!)?.parent?.id).toBe('c');
  });

  it('lets any point grow as many leaves as needed', () => {
    let t = tree();
    for (let i = 0; i < 3; i++) t = addLeaf(t, 'a')[0];
    const a = findPoint(t, 'a')!.point;
    expect(a.branches).toHaveLength(3);
    expect(a.branches.every((b) => b.length === 1 && b[0].kind === 'leaf')).toBe(true);
    expect(countLeaves(a)).toBe(3);
    // A point in the middle of a chain can still grow leaves; a leaf cannot.
    expect(addLeaf(t, a.branches[0][0].id)[1]).toBeNull();
  });

  it('lets nothing grow from a leaf, until it is reopened', () => {
    const [t, leafId] = addLeaf(tree(), 'c');
    expect(capabilities(t, leafId!)).toMatchObject({ addNext: false, addBranch: false, reopen: true });
    const reopened = reopen(t, leafId!);
    expect(findPoint(reopened, leafId!)?.point.kind).toBe('point');
    expect(capabilities(reopened, leafId!)).toMatchObject({ addNext: true, addBranch: true, reopen: false });
  });

  it('collapses and expands every point at once', () => {
    const t = tree();
    expect(hasExpanded(t)).toBe(true);
    const collapsed = setAllCollapsed(t, true);
    expect(hasExpanded(collapsed)).toBe(false);
    expect(findPoint(collapsed, 'a')?.point.collapsed).toBeUndefined(); // no branches, nothing to hide
    expect(hasExpanded(setAllCollapsed(collapsed, false))).toBe(true);
  });

  it('counts leaves in a point\'s branches at any depth, not in its own chain', () => {
    const p = makePoint({
      branches: [
        [makePoint(), makePoint({ kind: 'leaf' })],
        [makePoint({ branches: [[makePoint({ kind: 'leaf' })], [makePoint()]] })],
      ],
    });
    const t: Tree = { ...tree(), root: [p, makePoint({ kind: 'leaf' })] };
    expect(countLeaves(t.root[0])).toBe(2);
    expect(countLeaves(makePoint())).toBe(0);
    expect(countLeaves(yearsTree(1, 5, 'stacked').root[0])).toBe(5);
  });

  it('finds the points forward of a point, branches included', () => {
    expect(forwardIds(tree(), 'b')).toEqual(['b', 'b1', 'c']);
    expect(forwardIds(tree(), 'b1')).toEqual(['b1']);
    expect(forwardIds(tree(), 'a')).toEqual(['a', 'b', 'b1', 'c']);
  });

  it('drops a branch when its last point is removed', () => {
    const t = removePoint(tree(), 'b1');
    expect(findPoint(t, 'b')?.point.branches).toEqual([]);
  });

  it('keeps at least one point in the root chain', () => {
    const single: Tree = { title: 'T', direction: 'LR', edgeStyle: 'sides', layout: 'stacked', root: [makePoint({ id: 'x' })] };
    expect(removePoint(single, 'x').root).toHaveLength(1);
  });

  it('does not mutate the input tree', () => {
    const t = tree();
    const before = JSON.stringify(t);
    addNext(t, 'a');
    removePoint(t, 'b');
    expect(JSON.stringify(t)).toBe(before);
  });
});

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
      title: 'T',
      direction: 'LR',
      edgeStyle: 'sides',
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

describe('import / export', () => {
  it('round-trips JSON', () => {
    const t = tree();
    expect(importText(toJSON(t))).toEqual(t);
  });

  it('round-trips the README via the embedded data', () => {
    const t = tree();
    t.root[0].content = 'line one\nline "two" ✓';
    const md = toMarkdown(t);
    expect(md).toContain('```mermaid');
    expect(md).toContain('flowchart LR');
    expect(importText(md)).toEqual(t);
  });

  it('writes every pin and collapsed point into the README', () => {
    let t = setPin(tree(), 'b1', { col: 2.5, row: 1.25 });
    t = setCollapsed(t, 'b', true);
    const md = toMarkdown(t);
    expect(md).toContain('| B › B1 | col 2.50, row 1.25 | — |');
    expect(md).toContain('| B | — | collapsed (1 hidden) |');
    expect(md).toContain('**B1** _(📌 pinned)_');
    expect(md).toContain('**B** _(▸ branches collapsed)_');
    expect(importText(md)).toEqual(t);
  });

  it('adding a branch shows a collapsed point\'s branches again', () => {
    const t = setCollapsed(tree(), 'b', true);
    const [next] = addBranch(t, 'b');
    expect(findPoint(next, 'b')?.point.collapsed).toBeUndefined();
  });

  it('defaults settings for files saved before they existed', () => {
    expect(parseTree({ root: [{ title: 'x' }] }).layout).toBe('stacked');
    expect(parseTree({ root: [{ title: 'x' }] }).edgeStyle).toBe('sides');
    expect(() => parseTree({ edgeStyle: 'curvy', root: [{ title: 'x' }] })).toThrow(/edge style/);
  });

  it('rejects a leaf in the middle of a chain', () => {
    expect(() => parseTree({ root: [{ kind: 'leaf' }, { title: 'x' }] })).toThrow(/not last/);
  });
});
