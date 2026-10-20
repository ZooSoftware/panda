#!/usr/bin/env bun
// PreToolUse hook (Bash): before Claude runs `git commit`, require a green typecheck + test
// suite, and refuse to commit build output or an npm lockfile.
// Exit 2 blocks the tool call and shows stderr to Claude. Other commands pass through.

interface HookInput {
  tool_name?: string;
  tool_input?: { command?: string };
}

const input = (await Bun.stdin.json().catch(() => ({}))) as HookInput;
const cmd = input.tool_input?.command ?? '';
if (input.tool_name !== 'Bash' || !/\bgit\s+commit\b/.test(cmd)) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const run = (args: string[]) => Bun.spawnSync(args, { cwd: root, stdout: 'pipe', stderr: 'pipe' });
const tail = (b: Uint8Array): string => new TextDecoder().decode(b).trim().split('\n').slice(-15).join('\n');

// Files staged before this command (a `git add` chained in the same command isn't seen yet).
const staged = new TextDecoder().decode(run(['git', 'diff', '--cached', '--name-only']).stdout).split('\n');
const wrong = staged.filter((f) => /^dist\//.test(f) || f === 'package-lock.json' || f === 'pnpm-lock.yaml');
if (wrong.length > 0) {
  console.error(
    `Blocked: these should not be committed (build output or a non-Bun lockfile):\n  ${wrong.join('\n  ')}\n` +
      `Unstage them with git restore --staged <file>.`,
  );
  process.exit(2);
}

const tc = run(['bun', 'run', 'typecheck']);
if (tc.exitCode !== 0) {
  console.error(`Blocked: typecheck fails.\n${tail(tc.stdout)}\n${tail(tc.stderr)}`);
  process.exit(2);
}
const t = run(['bun', 'run', 'test']);
if (t.exitCode !== 0) {
  console.error(`Blocked: tests fail.\n${tail(t.stdout)}\n${tail(t.stderr)}`);
  process.exit(2);
}
process.exit(0);
