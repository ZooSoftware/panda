#!/usr/bin/env bun
// Checks panda tree files the way the app reads them: an outline written by a
// person or an AI agent, an exported README, or JSON. Rules:
// docs/reference/outline-format.md
//
//   bun run check tree.md other.md       one line per problem, then a summary
//   bun run check tree.md --json         machine-readable, for agents
//
// Exit code: 0 when every file loads, 1 when any file has errors, 2 on bad usage.

import { analyzeText, type Analysis } from '../src/core/formats';
import { countLeaves, type Chain, type Tree } from '../src/core/tree';

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

const SOURCE: Record<NonNullable<Analysis['source']>, string> = {
  json: 'JSON',
  embedded: 'embedded data',
  outline: 'outline',
  'outline+embedded': 'edited outline, pins and colors kept from embedded data',
};

const args = process.argv.slice(2);
const json = args.includes('--json');
const files = args.filter((a) => !a.startsWith('--'));
if (files.length === 0) {
  console.error('usage: bun run check <file.md|file.json>... [--json]');
  process.exit(2);
}

let failed = false;
const report = [];
for (const file of files) {
  const f = Bun.file(file);
  if (!(await f.exists())) {
    failed = true;
    report.push({ file, ok: false, diagnostics: [{ line: 0, severity: 'error', message: 'file not found' }] });
    if (!json) console.log(`${file}: error: file not found`);
    continue;
  }
  const { tree, source, diagnostics } = analyzeText(await f.text());
  const errors = diagnostics.filter((d) => d.severity === 'error').length;
  const warnings = diagnostics.length - errors;
  if (errors > 0) failed = true;

  if (json) {
    report.push({ file, ok: errors === 0, source, title: tree?.title, stats: tree ? stats(tree) : undefined, diagnostics });
    continue;
  }
  for (const d of diagnostics) console.log(`${file}:${d.line}: ${d.severity}: ${d.message}`);
  if (errors > 0) {
    const fallback = tree ? ' (the app would open the embedded data instead, losing the outline edits)' : '';
    console.log(`${file}: ${errors} error${errors > 1 ? 's' : ''}, ${warnings} warning${warnings === 1 ? '' : 's'}${fallback}`);
  } else if (tree) {
    const s = stats(tree);
    console.log(
      `${file}: ok · "${tree.title}" · ${s.points} points, ${s.leaves} leaves, ${s.branches} branches · from ${SOURCE[source!]}` +
        (warnings ? ` · ${warnings} warning${warnings > 1 ? 's' : ''}` : ''),
    );
  }
}
if (json) console.log(JSON.stringify(report, null, 2));
process.exit(failed ? 1 : 0);
