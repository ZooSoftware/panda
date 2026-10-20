// Enforces the folder boundaries in src/ (docs/decisions/0015):
//   core/      imports only core/, and no packages: pure TypeScript
//   shared/    imports core/ and shared/
//   features/x imports core/, shared/ and its own folder, never another feature
//   app/       may import anything

import { describe, expect, it } from 'vitest';

// Keys look like '../src/core/tree.ts'.
const sources = import.meta.glob(['../src/**/*.ts', '../src/**/*.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

type Layer = 'core' | 'shared' | 'app' | `feature:${string}` | 'root';

function layerOf(path: string): Layer {
  const [top, sub] = path.replace(/^\.\.\/src\//, '').split('/');
  if (top === 'core' || top === 'shared' || top === 'app') return top;
  if (top === 'features') return `feature:${sub}`;
  return 'root';
}

/** Resolves `../x/y` against the importing file's folder, like a bundler would. */
function resolve(from: string, spec: string): string {
  const parts = from.split('/').slice(0, -1);
  for (const seg of spec.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

function importsOf(source: string): string[] {
  return [...source.matchAll(/(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g)].map(
    (m) => m[1] ?? m[2] ?? m[3],
  );
}

function allowed(from: Layer, to: Layer): boolean {
  if (from === 'app' || from === 'root') return true;
  if (to === 'core') return true;
  if (from === 'core') return false;
  if (to === 'shared') return true;
  if (from === 'shared') return false;
  return to === from; // a feature, inside its own folder
}

describe('architecture', () => {
  it('finds the source files', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(10);
  });

  it('keeps every import inside its allowed layers', () => {
    const violations: string[] = [];
    for (const [file, source] of Object.entries(sources)) {
      const from = layerOf(file);
      for (const spec of importsOf(source)) {
        if (!spec.startsWith('.')) continue;
        const to = layerOf(resolve(file, spec));
        if (!allowed(from, to)) violations.push(`${file} (${from}) imports ${spec} (${to})`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('keeps core free of packages (no React, React Flow or DOM libraries)', () => {
    const packages = Object.entries(sources)
      .filter(([file]) => layerOf(file) === 'core')
      .flatMap(([file, source]) => importsOf(source).filter((s) => !s.startsWith('.')).map((s) => `${file} imports ${s}`));
    expect(packages).toEqual([]);
  });
});
