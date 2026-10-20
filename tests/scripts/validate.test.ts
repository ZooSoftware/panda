import { describe, expect, it } from 'vitest';
import { validateText } from '../../scripts/validate';
import { importText, toJSON } from '../../src/core/formats';
import { setCollapsed, setPin } from '../../src/core/tree';
import { nestedTree, tree, yearsTree } from '../fixtures';

const problems = (text: string) =>
  validateText(text).diagnostics.map((d) => `${d.line}:${d.col} ${d.severity} ${d.path}: ${d.message}`);

describe('check: valid files', () => {
  it('passes every tree panda saves, with pins, collapsed points and settings', () => {
    let t = setPin(tree(), 'b1', { col: 2.5, row: -1 });
    t = setCollapsed(t, 'b', true);
    for (const saved of [t, nestedTree('packed'), yearsTree(3, 2, 'stacked')]) {
      const result = validateText(toJSON(saved));
      expect(result.diagnostics).toEqual([]);
      expect(result.tree).toEqual(saved);
    }
  });

  it('passes a short hand-written file and loads it the way the app does', () => {
    const text = '{ "title": "Plan", "root": [ { "title": "A", "branches": [[ { "kind": "leaf", "title": "Done" } ]] }, { "title": "B" } ] }';
    const result = validateText(text);
    expect(result.diagnostics).toEqual([]);
    expect({ ...result.tree, root: undefined }).toEqual({ ...importText(text), root: undefined });
    expect(result.tree!.root.map((p) => p.title)).toEqual(['A', 'B']);
  });
});

describe('check: mistakes, with line and column', () => {
  it('explains schema problems in plain words', () => {
    const text = [
      '{',
      '  "layout": "diagonal",',
      '  "root": [',
      '    { "titel": "A" },',
      '    { "title": "B", "color": "yellow", "collapsed": false },',
      '    { "kind": "leaf", "title": "C", "branches": [ [ { "title": "x" } ] ] }',
      '  ]',
      '}',
    ].join('\n');
    expect(problems(text)).toEqual([
      '2:13 error layout: "layout" must be one of stacked, packed',
      '4:5 error root[0]: missing "title"',
      '4:7 error root[0].titel: unknown field "titel" (did you mean "title"?); allowed: id, kind, title, content, color, pin, collapsed, branches',
      '5:30 error root[1].color: "color" must be a hex color like "#fde68a"',
      '5:53 error root[1].collapsed: "collapsed" must be true, or left out',
      '6:49 error root[2].branches: a leaf can\'t have branches: make it a "point", or remove its branches',
    ]);
  });

  it('reports a leaf that is not last, even alongside schema errors', () => {
    expect(problems('{ "root": [ { "kind": "leaf", "title": "End" }, { "title": "After", "color": 3 } ] }')).toEqual([
      '1:23 error root[0].kind: leaf "End" must be the last point of its chain; nothing can follow a leaf (for a side ending, put it in its own branch)',
      '1:78 error root[1].color: "color" must be a string',
    ]);
  });

  it('reports empty chains and a missing root', () => {
    expect(problems('{ "root": [] }')).toEqual(['1:11 error root: a chain needs at least one point; remove the empty list']);
    expect(problems('{ "title": "T" }')).toEqual(['1:1 error : missing "root"']);
  });

  it('points at JSON syntax mistakes agents often make', () => {
    expect(problems('{\n  "root": [\n    { "title": "A", },\n  ]\n}')).toEqual(['3:21 error : trailing comma before "}"']);
    expect(problems('{ // notes\n "root": [] }')).toEqual(['1:3 error : comments are not allowed in JSON']);
    expect(problems("{ 'root': [] }")).toEqual(['1:3 error : strings and keys need double quotes (") in JSON']);
    expect(problems('{ "root": [ { "title": "A\nB" } ] }')).toEqual([
      "1:24 error : a string can't span lines: use \\n for a new line",
    ]);
    expect(problems('{ "root": [ { "title": "A" } ] } }')).toEqual(['1:34 error : unexpected "}" after the end of the tree']);
  });

  it('rejects Markdown and other non-JSON files with a clear message', () => {
    expect(problems('# My tree\n\n1. **A**')).toEqual([
      '1:1 error : this looks like Markdown: panda trees are JSON files (see docs/reference/json-format.md)',
    ]);
  });

  it('warns about duplicate ids and errors on duplicate keys', () => {
    expect(problems('{ "root": [ { "id": "x", "title": "A" }, { "id": "x", "title": "B" } ] }')).toEqual([
      '1:50 warning root[1].id: duplicate id "x" (also at root[0]); this point gets a new id',
    ]);
    expect(problems('{ "root": [ { "title": "A", "title": "B" } ] }')).toEqual(['1:29 error : "title" appears twice in the same object']);
  });
});
