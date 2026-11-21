#!/usr/bin/env node
// Self-test for the Claude Code hooks. Run: node .claude/hooks/test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const run = (script, input, env = {}) =>
  spawnSync(process.execPath, [join(here, script)], { input: JSON.stringify(input), encoding: 'utf8', env: { ...process.env, ...env } });

// guard-git: what must be denied and what must pass
const denied = (command) => run('guard-git.mjs', { tool_input: { command } }).stdout.includes('"deny"');
for (const command of [
  'git commit --no-verify -m "feat: x"',
  'git commit -nm "feat: x"',
  'git -c core.hooksPath=/dev/null commit -m "feat: x"',
  'git config core.hooksPath other',
  'git push --force origin feature/x',
  'git push -f',
  'git push origin main',
  'cd repo && git push -u origin HEAD:develop',
]) assert.ok(denied(command), `should deny: ${command}`);
for (const command of [
  'git commit -m "feat(engine): add board"',
  'git commit --amend --no-edit',
  'git config core.hooksPath .githooks',
  'git push -u origin feature/main-menu',
  'git push --force-with-lease origin feature/x',
  'git push origin feature/x && git switch main',
  'git pull origin develop',
  'ls -f',
]) assert.ok(!denied(command), `should allow: ${command}`);

// log-prompt: writes one entry per prompt, redacts secrets, ignores empty prompts
const dir = mkdtempSync(join(tmpdir(), 'ai-log-'));
try {
  const env = { AI_PROMPT_LOG_DIR: dir };
  const secrets = ['ghp_abcdefghijklmnopqrstuvwxyz0123', 'hunter2secret', 'dbpass99', 'eyJhbGciOiJIUzI1.eyJzdWIiOiIxMjM0.SflKxwRJSMeKKF2QT4'];
  const prompt = `add login\ntoken ${secrets[0]} password=${secrets[1]}\npostgres://admin:${secrets[2]}@localhost/db ${secrets[3]}`;
  assert.equal(run('log-prompt.mjs', { session_id: 'abcdef123456', prompt }, env).status, 0);
  assert.equal(run('log-prompt.mjs', { session_id: 'abcdef123456', prompt: 'second prompt' }, env).status, 0);
  assert.equal(run('log-prompt.mjs', { session_id: 'abcdef123456', prompt: '  ' }, env).status, 0);

  const files = readdirSync(dir);
  assert.equal(files.length, 1, 'one log file per member');
  const log = readFileSync(join(dir, files[0]), 'utf8');
  assert.equal(log.match(/^## /gm).length, 2, 'one entry per non-empty prompt');
  assert.equal(log.match(/^# AI prompt log/gm).length, 1, 'header written once');
  assert.match(log, /^> add login$/m);
  assert.match(log, /session `abcdef12`/);
  for (const secret of secrets) assert.ok(!log.includes(secret), `secret leaked: ${secret}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log('claude hooks: ok');
