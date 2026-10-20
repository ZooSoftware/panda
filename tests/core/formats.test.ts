import { describe, expect, it } from 'vitest';
import { setCollapsed, setPin } from '../../src/core/tree';
import { importText, toJSON, toMarkdown } from '../../src/core/formats';
import { tree } from '../fixtures';

describe('JSON', () => {
  it('round-trips', () => {
    const t = tree();
    t.root[0].content = 'line one\nline "two" ✓';
    expect(importText(toJSON(t))).toEqual(t);
  });

  it('fills defaults for a short hand-written file', () => {
    const t = importText('{ "root": [ { "title": "A" }, { "kind": "leaf", "title": "End" } ] }');
    expect(t).toMatchObject({ title: 'Untitled tree', direction: 'LR', layout: 'stacked', edgeStyle: 'sides' });
    expect(t.root.map((p) => [p.kind, p.title, p.content, p.color])).toEqual([
      ['point', 'A', '', '#ffffff'],
      ['leaf', 'End', '', '#ffffff'],
    ]);
  });

  it('refuses anything that is not JSON, including a README', () => {
    expect(() => importText(toMarkdown(tree()))).toThrow(/not valid JSON/);
  });
});

describe('README view', () => {
  it('shows the diagram, the outline and every pin, with no hidden data', () => {
    let t = setPin(tree(), 'b1', { col: 2.5, row: 1.25 });
    t = setCollapsed(t, 'b', true);
    t.root[0].content = '1. looks like a list item';
    const md = toMarkdown(t);
    expect(md).toContain('```mermaid');
    expect(md).toContain('flowchart LR');
    expect(md).toContain('| B › B1 | col 2.50, row 1.25 | — |');
    expect(md).toContain('| B | — | collapsed (1 hidden) |');
    expect(md).toContain('**B1** _(📌 pinned)_');
    expect(md).toContain('1\\. looks like a list item'); // not rendered as a list
    expect(md).not.toContain('panda-tree:v1');
  });
});
