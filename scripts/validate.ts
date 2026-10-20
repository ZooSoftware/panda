// Compiler-style checking of a panda tree JSON file: syntax with line and
// column, then the JSON Schema (src/core/panda-tree.schema.json), then the rules
// a schema can't express. If this passes, the app opens the file.

import Ajv2020, { type ErrorObject } from 'ajv/dist/2020';
import schema from '../src/core/panda-tree.schema.json';
import { parseTree, type Tree } from '../src/core/tree';

export interface Diagnostic {
  line: number;
  col: number;
  severity: 'error' | 'warning';
  /** Where in the tree, e.g. root[1].branches[0][2].kind; empty for the file itself. */
  path: string;
  message: string;
}

export interface Validation {
  /** The tree as the app will load it; null when there are errors. */
  tree: Tree | null;
  diagnostics: Diagnostic[];
}

interface Pos {
  line: number;
  col: number;
}

// --- 1. JSON with positions -------------------------------------------------
// JSON.parse doesn't report where an error is (in Bun), and we also want the
// position of every value to point schema errors at a line.

class SyntaxProblem extends Error {
  constructor(
    message: string,
    readonly offset: number,
  ) {
    super(message);
  }
}

/** Parses JSON, recording the position of every value (and of every key) by JSON pointer. */
function parseJson(text: string): { value: unknown; at: Map<string, number>; duplicates: [string, number][] } {
  const at = new Map<string, number>();
  const duplicates: [string, number][] = [];
  let i = 0;

  const fail = (message: string, offset = i): never => {
    throw new SyntaxProblem(message, offset);
  };
  const space = () => {
    while (i < text.length && ' \t\n\r'.includes(text[i])) i++;
    if (text.startsWith('//', i) || text.startsWith('/*', i)) fail('comments are not allowed in JSON');
  };
  const describe = (c: string | undefined) => (c === undefined ? 'end of file' : `"${c}"`);

  const string = (): string => {
    if (text[i] === "'") fail('strings and keys need double quotes (") in JSON');
    if (text[i] !== '"') fail(`expected a string, found ${describe(text[i])}`);
    const start = i++;
    let out = '';
    while (i < text.length && text[i] !== '"') {
      const c = text[i];
      if (c === '\n') fail('a string can\'t span lines: use \\n for a new line', start);
      if (c === '\\') {
        const e = text[i + 1];
        const simple: Record<string, string> = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
        if (e in simple) {
          out += simple[e];
          i += 2;
        } else if (e === 'u' && /^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) {
          out += String.fromCharCode(parseInt(text.slice(i + 2, i + 6), 16));
          i += 6;
        } else fail(`invalid escape "\\${e ?? ''}" in a string`);
      } else {
        out += c;
        i++;
      }
    }
    if (i >= text.length) fail('a string is never closed', start);
    i++;
    return out;
  };

  const value = (pointer: string): unknown => {
    space();
    at.set(pointer, i);
    const c = text[i];
    if (c === '{') {
      i++;
      const obj: Record<string, unknown> = {};
      space();
      if (text[i] === '}') {
        i++;
        return obj;
      }
      for (;;) {
        space();
        if (text[i] === '}') fail('trailing comma before "}"');
        const keyAt = i;
        const key = string();
        const child = `${pointer}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`;
        if (key in obj) duplicates.push([key, keyAt]);
        space();
        if (text[i] !== ':') fail(`expected ":" after "${key}", found ${describe(text[i])}`);
        i++;
        obj[key] = value(child);
        at.set(`${child}#key`, keyAt);
        space();
        if (text[i] === ',') {
          i++;
          continue;
        }
        if (text[i] === '}') {
          i++;
          return obj;
        }
        fail(`expected "," or "}" after the value of "${key}", found ${describe(text[i])}`);
      }
    }
    if (c === '[') {
      i++;
      const arr: unknown[] = [];
      space();
      if (text[i] === ']') {
        i++;
        return arr;
      }
      for (;;) {
        space();
        if (text[i] === ']') fail('trailing comma before "]"');
        arr.push(value(`${pointer}/${arr.length}`));
        space();
        if (text[i] === ',') {
          i++;
          continue;
        }
        if (text[i] === ']') {
          i++;
          return arr;
        }
        fail(`expected "," or "]" in a list, found ${describe(text[i])}`);
      }
    }
    if (c === '"' || c === "'") return string();
    const num = /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/y;
    num.lastIndex = i;
    const m = num.exec(text);
    if (m) {
      i += m[0].length;
      return Number(m[0]);
    }
    for (const [word, v] of [['true', true], ['false', false], ['null', null]] as const) {
      if (text.startsWith(word, i)) {
        i += word.length;
        return v;
      }
    }
    return fail(`unexpected ${describe(c)}`);
  };

  const result = value('');
  space();
  if (i < text.length) fail(`unexpected ${describe(text[i])} after the end of the tree`);
  return { value: result, at, duplicates };
}

function positionOf(text: string, offset: number): Pos {
  const before = text.slice(0, offset).split('\n');
  return { line: before.length, col: before[before.length - 1].length + 1 };
}

/** "/root/1/branches/0/2/kind" → "root[1].branches[0][2].kind" */
function readablePath(pointer: string): string {
  return pointer
    .split('/')
    .slice(1)
    .map((seg) => seg.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((out, seg) => (/^\d+$/.test(seg) ? `${out}[${seg}]` : out ? `${out}.${seg}` : seg), '');
}

// --- 2. The schema -------------------------------------------------------------

const validateSchema = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

const TREE_FIELDS = Object.keys(schema.properties);
const POINT_FIELDS = Object.keys(schema.$defs.point.properties);
const PIN_FIELDS = ['col', 'row'];

function closest(word: string, options: string[]): string | undefined {
  const distance = (a: string, b: string) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };
  const best = options.map((o) => [o, distance(word.toLowerCase(), o.toLowerCase())] as const).sort((a, b) => a[1] - b[1])[0];
  return best && best[1] <= 2 ? best[0] : undefined;
}

function fieldsAt(pointer: string): string[] {
  if (pointer === '') return TREE_FIELDS;
  if (pointer.endsWith('/pin')) return PIN_FIELDS;
  return POINT_FIELDS;
}

/** One clear message per schema error; null to drop an error that only repeats another. */
function explain(e: ErrorObject): { pointer: string; message: string } | null {
  const p = e.params as Record<string, unknown>;
  const field = e.instancePath.split('/').pop() ?? '';
  switch (e.keyword) {
    case 'required':
      return { pointer: e.instancePath, message: `missing "${p.missingProperty}"` };
    case 'additionalProperties': {
      const extra = String(p.additionalProperty);
      const guess = closest(extra, fieldsAt(e.instancePath));
      return {
        pointer: `${e.instancePath}/${extra}#key`,
        message: `unknown field "${extra}"${guess ? ` (did you mean "${guess}"?)` : ''}; allowed: ${fieldsAt(e.instancePath).join(', ')}`,
      };
    }
    case 'enum':
      return { pointer: e.instancePath, message: `"${field}" must be one of ${(p.allowedValues as string[]).join(', ')}` };
    case 'const':
      if (field === 'collapsed') return { pointer: e.instancePath, message: '"collapsed" must be true, or left out' };
      return { pointer: e.instancePath, message: `"${field}" must be ${JSON.stringify(p.allowedValue)}` };
    case 'type':
      return { pointer: e.instancePath, message: `${field ? `"${field}"` : 'this'} must be ${p.type === 'array' ? 'a list [ … ]' : p.type === 'object' ? 'an object { … }' : `a ${p.type}`}` };
    case 'pattern':
      return { pointer: e.instancePath, message: '"color" must be a hex color like "#fde68a"' };
    case 'minItems':
      return { pointer: e.instancePath, message: 'a chain needs at least one point; remove the empty list' };
    case 'maxItems':
      return { pointer: e.instancePath, message: 'a leaf can\'t have branches: make it a "point", or remove its branches' };
    case 'minLength':
      return { pointer: e.instancePath, message: `"${field}" can't be empty` };
    case 'if':
      return null; // explained by the "then" error it causes
    default:
      return { pointer: e.instancePath, message: e.message ?? e.keyword };
  }
}

// --- 3. Rules a schema can't express ----------------------------------------

interface RawPoint {
  id?: string;
  kind?: string;
  title?: string;
  branches?: RawPoint[][];
}

/** Runs even when the schema fails, so one pass reports everything; skips what isn't shaped right. */
function semanticProblems(root: unknown): { pointer: string; severity: 'error' | 'warning'; message: string }[] {
  const out: { pointer: string; severity: 'error' | 'warning'; message: string }[] = [];
  const ids = new Map<string, string>();
  const walk = (chain: unknown, pointer: string) => {
    if (!Array.isArray(chain)) return;
    chain.forEach((item: unknown, i) => {
      if (typeof item !== 'object' || item === null) return;
      const p = item as RawPoint;
      const here = `${pointer}/${i}`;
      if (p.kind === 'leaf' && i < chain.length - 1)
        out.push({
          pointer: `${here}/kind`,
          severity: 'error',
          message: `leaf "${p.title}" must be the last point of its chain; nothing can follow a leaf (for a side ending, put it in its own branch)`,
        });
      if (typeof p.id === 'string') {
        if (ids.has(p.id))
          out.push({ pointer: `${here}/id`, severity: 'warning', message: `duplicate id "${p.id}" (also at ${ids.get(p.id)}); this point gets a new id` });
        else ids.set(p.id, readablePath(here));
      }
      if (Array.isArray(p.branches)) p.branches.forEach((b, j) => walk(b, `${here}/branches/${j}`));
    });
  };
  walk(root, '/root');
  return out;
}

// --- Together ----------------------------------------------------------------

export function validateText(text: string): Validation {
  const diagnostics: Diagnostic[] = [];
  const first = text.trimStart()[0];
  if (first !== '{') {
    const message =
      first === '#' || first === '-'
        ? 'this looks like Markdown: panda trees are JSON files (see docs/reference/json-format.md)'
        : `a panda tree is a JSON object starting with "{", found ${first ? `"${first}"` : 'an empty file'}`;
    return { tree: null, diagnostics: [{ line: 1, col: 1, severity: 'error', path: '', message }] };
  }
  let parsed: ReturnType<typeof parseJson>;
  try {
    parsed = parseJson(text);
  } catch (e) {
    if (!(e instanceof SyntaxProblem)) throw e;
    return { tree: null, diagnostics: [{ ...positionOf(text, e.offset), severity: 'error', path: '', message: e.message }] };
  }
  const where = (pointer: string): Pos => {
    for (let p = pointer; ; p = p.slice(0, Math.max(0, p.lastIndexOf('/')))) {
      const offset = parsed.at.get(p);
      if (offset !== undefined) return positionOf(text, offset);
      if (p === '') return { line: 1, col: 1 };
    }
  };
  const add = (pointer: string, severity: Diagnostic['severity'], message: string) =>
    diagnostics.push({ ...where(pointer), severity, path: readablePath(pointer.replace(/#key$/, '')), message });

  for (const [key, offset] of parsed.duplicates)
    diagnostics.push({ ...positionOf(text, offset), severity: 'error', path: '', message: `"${key}" appears twice in the same object` });

  if (!validateSchema(parsed.value)) {
    const seen = new Set<string>();
    for (const e of validateSchema.errors ?? []) {
      const x = explain(e);
      if (!x || seen.has(x.pointer + x.message)) continue;
      seen.add(x.pointer + x.message);
      add(x.pointer, 'error', x.message);
    }
  }
  const root = (parsed.value as { root?: unknown } | null)?.root;
  for (const s of semanticProblems(root)) add(s.pointer, s.severity, s.message);

  diagnostics.sort((a, b) => a.line - b.line || a.col - b.col);
  if (diagnostics.some((d) => d.severity === 'error')) return { tree: null, diagnostics };
  return { tree: parseTree(parsed.value), diagnostics };
}
