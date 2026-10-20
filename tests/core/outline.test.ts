import { describe, expect, it } from 'vitest';
import { parseOutline } from '../../src/core/outline';
import { analyzeText, importText, toMarkdown } from '../../src/core/formats';
import { makePoint, setCollapsed, setPin, type Chain, type Tree } from '../../src/core/tree';
import { nestedTree, tree } from '../fixtures';

/** Kind, title, content and nesting: everything the outline carries. */
function shape(chain: Chain): unknown {
  return chain.map((p) => [p.kind, p.title, p.content, p.branches.map(shape)]);
}

const errorsOf = (text: string) =>
  parseOutline(text)
    .diagnostics.filter((d) => d.severity === 'error')
    .map((d) => `${d.line}: ${d.message}`);

describe('outline', () => {
  it('reads a hand-written outline', () => {
    const { tree: t, diagnostics } = parseOutline(
      [
        '---',
        'direction: TB',
        'layout: packed',
        '---',
        '# Learn web development',
        '',
        '1. **Start** {#fde68a}',
        '   Pick a goal.',
        '   Set up an editor.',
        '2. **HTML & CSS**',
        '   - ⎇ Branch 1',
        '     1. **Flexbox**',
        '     2. 🍃 **Landing page**',
        '   - Branch',
        '     1. 🍃 Grid',
        '3. **JavaScript**',
        '   1. **DOM**', // nested without a branch line: still a branch
        '4. 🍃 **Ship it**',
      ].join('\n'),
    );
    expect(diagnostics).toEqual([]);
    expect(t!.title).toBe('Learn web development');
    expect([t!.direction, t!.layout, t!.edgeStyle]).toEqual(['TB', 'packed', 'sides']);
    expect(t!.root[0].color).toBe('#fde68a');
    expect(shape(t!.root)).toEqual([
      ['point', 'Start', 'Pick a goal.\nSet up an editor.', []],
      ['point', 'HTML & CSS', '', [[['point', 'Flexbox', '', []], ['leaf', 'Landing page', '', []]], [['leaf', 'Grid', '', []]]]],
      ['point', 'JavaScript', '', [[['point', 'DOM', '', []]]]],
      ['leaf', 'Ship it', '', []],
    ]);
  });

  it('reads back the outline of an exported README, without the embedded data', () => {
    for (const t of [tree(), nestedTree('stacked')]) {
      t.root[0].content = 'first line\n1. looks like a list item\n- and a bullet';
      const md = toMarkdown(t).replace(/<!-- panda-tree:v1 .*-->/, '');
      const parsed = parseOutline(md);
      expect(parsed.diagnostics).toEqual([]);
      expect(shape(parsed.tree!.root)).toEqual(shape(t.root));
    }
  });

  it('reports mistakes with their line', () => {
    expect(errorsOf('# T\n1. 🍃 **End**\n2. **After**')).toEqual([
      '2: leaf "End" must be the last point of its chain; nothing can follow a leaf',
    ]);
    expect(errorsOf('# T\n1. 🍃 **End**\n   - ⎇ Branch\n     1. **Sub**')).toEqual(["2: leaf \"End\" can't have branches"]);
    expect(errorsOf('# T\n1. **A**\n   - ⎇ Branch 1\n2. **B**')).toEqual(['3: empty branch: put numbered points under it']);
    expect(errorsOf('# T\n1. **A**\n  1. **B**')).toEqual([
      '3: indentation is between two levels: use 0 spaces to continue the chain, or at least 3 to branch from "A"',
    ]);
    expect(errorsOf('# Just a title\n\nSome text.')).toEqual([
      '1: no tree found: write the points as a numbered list, e.g. "1. **Start**"',
    ]);
    expect(errorsOf('---\nlayout: diagonal\n---\n# T\n1. **A**')).toEqual(['2: layout must be one of stacked, packed (got "diagonal")']);
  });

  it('warns that a named branch line loses its name', () => {
    const { tree: t, diagnostics } = parseOutline('# T\n1. **A**\n   - ⎇ Backend\n     1. **API**\n   - ⎇ Branch 2\n     1. **B**');
    expect(t!.root[0].branches).toHaveLength(2);
    expect(diagnostics.map((d) => `${d.line}: ${d.message}`)).toEqual([
      '3: branch name "Backend" is not kept (branches have no names): to show it, make it the branch\'s first point, "1. **Backend**"',
    ]);
  });

  it('warns about text after a title, and a missing title', () => {
    const { tree: t, diagnostics } = parseOutline('1. **A** some notes');
    expect(t!.root[0].title).toBe('A');
    expect(diagnostics.map((d) => d.message)).toEqual([
      'no "# Title" heading before the list; the tree is called "Untitled tree"',
      'text after the title is ignored ("some notes"): put content on the next line, indented',
    ]);
  });
});

describe('import with embedded data', () => {
  function exported(): { t: Tree; md: string } {
    let t = setPin(tree(), 'b1', { col: 2.5, row: 1 });
    t = setCollapsed(t, 'b', true);
    t.root[0].color = '#fde68a';
    t.direction = 'TB';
    return { t, md: toMarkdown(t) };
  }

  it('uses the embedded tree as is while the outline is unchanged', () => {
    const { t, md } = exported();
    expect(analyzeText(md)).toMatchObject({ source: 'embedded', tree: t });
  });

  it('loads an edited outline, keeping pins, colors and ids of the points still there', () => {
    const { md } = exported();
    const edited = md.replace('1. **A**', '1. **A**  \n   new content').replace('3. **C**', '3. **C renamed**\n4. **D**');
    const { tree: t, source } = analyzeText(edited);
    expect(source).toBe('outline+embedded');
    expect(t!.direction).toBe('TB');
    expect(t!.root.map((p) => [p.id.length > 0, p.title])).toEqual([
      [true, 'A'],
      [true, 'B'],
      [true, 'C renamed'],
      [true, 'D'],
    ]);
    expect(t!.root[0]).toMatchObject({ id: 'a', color: '#fde68a', content: 'new content' });
    expect(t!.root[1]).toMatchObject({ id: 'b', collapsed: true });
    expect(t!.root[1].branches[0][0]).toMatchObject({ id: 'b1', pin: { col: 2.5, row: 1 } });
    expect(t!.root[2].id).not.toBe('c'); // renamed: a new point
  });

  it('falls back to the embedded tree when the outline is broken, but reports it', () => {
    const { t, md } = exported();
    const broken = md.replace('3. **C**', '3. 🍃 **C**\n4. **After a leaf**');
    const { tree: loaded, diagnostics } = analyzeText(broken);
    expect(loaded).toEqual(t);
    expect(diagnostics.some((d) => d.severity === 'error')).toBe(true);
  });

  it('imports a hand-written outline in the app', () => {
    const t = importText('# Plan\n1. **Idea**\n2. 🍃 **Done**');
    expect(t.root.map((p) => p.title)).toEqual(['Idea', 'Done']);
    expect(() => importText('# Plan\n\nNo list here')).toThrow(/line 1: no tree found/);
  });

  it('still makes fresh points from the outline when nothing matches', () => {
    const md = toMarkdown({ ...tree(), root: [makePoint({ id: 'x', title: 'Only' })] });
    const t = importText(md.replace('**Only**', '**Other**'));
    expect(t.root[0]).toMatchObject({ title: 'Other' });
    expect(t.root[0].id).not.toBe('x');
  });
});
