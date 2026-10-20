import { describe, expect, it } from 'vitest';
import { setCollapsed, setPin } from '../../src/core/tree';
import { importText, toJSON, toMarkdown } from '../../src/core/formats';
import { tree } from '../fixtures';

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
});
