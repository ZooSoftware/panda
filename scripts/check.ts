#!/usr/bin/env bun
// Checks panda tree files like a compiler: JSON syntax, the JSON Schema
// (src/core/panda-tree.schema.json), and the rules a schema can't express.
// Guide: docs/reference/json-format.md
//
//   bun run check tree.json other.json     one line per problem, then a summary
//   bun run check tree.json --json         machine-readable, for agents
//
// Exit code: 0 when every file opens in panda, 1 when any file has errors, 2 on bad usage.

import { countLeaves, type Chain, type Tree } from '../src/core/tree';
import { validateText } from './validate';

interface Stats {
  points: number;
  leaves: number;
  branches: number;
}

function stats(tree: Tree): Stats {
  const s: Stats = { points: 0, leaves: 0, branches: 0 };
  const walk = (chain: Chain) =>
    chain.forEach((p) => {
      s.points++;
      s.branches += p.branches.length;
      p.branches.forEach(walk);
    });
  walk(tree.root);
  s.leaves = tree.root.reduce((n, p) => n + (p.kind === 'leaf' ? 1 : 0) + countLeaves(p), 0);
  return s;
}

const args = process.argv.slice(2);
const json = args.includes('--json');
const files = args.filter((a) => !a.startsWith('--'));
if (files.length === 0) {
  console.error('usage: bun run check <file.json>... [--json]');
  process.exit(2);
}

let failed = false;
const report = [];
for (const file of files) {
  const f = Bun.file(file);
  if (!(await f.exists())) {
    failed = true;
    const diagnostics = [{ line: 0, col: 0, severity: 'error', path: '', message: 'file not found' }];
    if (json) report.push({ file, ok: false, diagnostics });
    else console.log(`${file}: error: file not found`);
    continue;
  }
  const { tree, diagnostics } = validateText(await f.text());
  const errors = diagnostics.filter((d) => d.severity === 'error').length;
  const warnings = diagnostics.length - errors;
  if (errors > 0) failed = true;

  if (json) {
    report.push({ file, ok: errors === 0, title: tree?.title, stats: tree ? stats(tree) : undefined, diagnostics });
    continue;
  }
  for (const d of diagnostics) {
    console.log(`${file}:${d.line}:${d.col}: ${d.severity}${d.path ? ` at ${d.path}` : ''}: ${d.message}`);
  }
  if (errors > 0) {
    console.log(`${file}: ${errors} error${errors > 1 ? 's' : ''}, ${warnings} warning${warnings === 1 ? '' : 's'}`);
  } else if (tree) {
    const s = stats(tree);
    console.log(
      `${file}: ok · "${tree.title}" · ${s.points} points, ${s.leaves} leaves, ${s.branches} branches` +
        (warnings ? ` · ${warnings} warning${warnings > 1 ? 's' : ''}` : ''),
    );
  }
}
if (json) console.log(JSON.stringify(report, null, 2));
process.exit(failed ? 1 : 0);
