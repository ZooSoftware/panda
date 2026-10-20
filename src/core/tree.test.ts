import { describe, expect, it } from 'vitest';
import {
  addBranch,
  addLeaf,
  addNext,
  capabilities,
  countLeaves,
  findPoint,
  forwardIds,
  hasExpanded,
  makePoint,
  parseTree,
  removePoint,
  reopen,
  setAllCollapsed,
  setCollapsed,
  visiblePoints,
  type Tree,
} from './tree';
import { tree, yearsTree } from './fixtures';

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

  it('adding a branch shows a collapsed point\'s branches again', () => {
    const t = setCollapsed(tree(), 'b', true);
    const [next] = addBranch(t, 'b');
    expect(findPoint(next, 'b')?.point.collapsed).toBeUndefined();
  });

  it('drops a branch when its last point is removed', () => {
    const t = removePoint(tree(), 'b1');
    expect(findPoint(t, 'b')?.point.branches).toEqual([]);
  });

  it('keeps at least one point in the root chain', () => {
    const single: Tree = { ...tree(), root: [makePoint({ id: 'x' })] };
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

describe('queries', () => {
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

  it('lists visible points, skipping collapsed branches', () => {
    expect(visiblePoints(tree()).map((p) => p.id)).toEqual(['a', 'b', 'b1', 'c']);
    expect(visiblePoints(setCollapsed(tree(), 'b', true)).map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('finds the points forward of a point, branches included', () => {
    expect(forwardIds(tree(), 'b')).toEqual(['b', 'b1', 'c']);
    expect(forwardIds(tree(), 'b1')).toEqual(['b1']);
    expect(forwardIds(tree(), 'a')).toEqual(['a', 'b', 'b1', 'c']);
  });
});

describe('import validation', () => {
  it('defaults settings for files saved before they existed', () => {
    expect(parseTree({ root: [{ title: 'x' }] }).layout).toBe('stacked');
    expect(parseTree({ root: [{ title: 'x' }] }).edgeStyle).toBe('sides');
    expect(() => parseTree({ edgeStyle: 'curvy', root: [{ title: 'x' }] })).toThrow(/edge style/);
  });

  it('rejects a leaf in the middle of a chain', () => {
    expect(() => parseTree({ root: [{ kind: 'leaf' }, { title: 'x' }] })).toThrow(/not last/);
  });
});
