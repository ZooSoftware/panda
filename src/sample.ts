import { PALETTE, makePoint, type Tree } from './model/tree';

/** Starter tree shown on first launch so the chain/branch/leaf idea is visible. */
export function sampleTree(): Tree {
  return {
    title: 'Learn web development',
    direction: 'LR',
    edgeStyle: 'sides',
    layout: 'stacked',
    root: [
      makePoint({ title: 'Start', content: 'Pick a goal and set up an editor.', color: PALETTE[1] }),
      makePoint({
        title: 'HTML & CSS',
        content: 'Structure and style pages.',
        branches: [
          [
            makePoint({ title: 'Flexbox', color: PALETTE[3] }),
            makePoint({ title: 'Grid', color: PALETTE[3] }),
            makePoint({ kind: 'leaf', title: 'Build a landing page', color: PALETTE[2] }),
          ],
        ],
      }),
      makePoint({
        title: 'JavaScript',
        content: 'Make pages interactive.',
        branches: [
          [
            makePoint({
              title: 'DOM',
              color: PALETTE[4],
              branches: [[makePoint({ kind: 'leaf', title: 'Todo app', color: PALETTE[2] })]],
            }),
            makePoint({ title: 'Fetch API', color: PALETTE[4] }),
          ],
          [makePoint({ title: 'TypeScript', color: PALETTE[5] })],
        ],
      }),
      makePoint({ title: 'A framework', content: 'React, Vue or Svelte.' }),
      makePoint({ kind: 'leaf', title: 'Ship a project', color: PALETTE[2] }),
    ],
  };
}
