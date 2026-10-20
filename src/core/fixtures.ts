// Trees shared by the core tests. Not used by the app.

import { makePoint, type Tree } from './tree';

/** A ─ B ─ C, where B grows one branch holding B1. */
export function tree(): Tree {
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

/** Years on the main chain, each growing `perYear` single-leaf branches. */
export function yearsTree(years: number, perYear: number, layout: Tree['layout']): Tree {
  return {
    ...tree(),
    layout,
    root: Array.from({ length: years }, () =>
      makePoint({ branches: Array.from({ length: perYear }, () => [makePoint({ kind: 'leaf' })]) }),
    ),
  };
}

/** Chains, branches of branches and leaves at several depths. */
export function nestedTree(layout: Tree['layout']): Tree {
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
