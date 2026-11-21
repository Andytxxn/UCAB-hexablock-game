#!/usr/bin/env node
// PreToolUse hook (Bash | PowerShell): denies git commands that bypass the team workflow.
// The real enforcement of branch rules is .githooks/ + GitHub; this stops the agent from sidestepping it.
import { readFileSync } from 'node:fs';

const command = JSON.parse(readFileSync(0, 'utf8')).tool_input?.command ?? '';
const git = String.raw`\bgit\b[^|;&]*`; // a git invocation, up to the next shell separator

const SKIP_HOOKS = 'Do not skip the git hooks. Fix what the hook reports instead.';
const RULES = [
  [new RegExp(git + String.raw`\s(--no-verify|-c\s+core\.hooksPath)`), SKIP_HOOKS],
  [new RegExp(git + String.raw`\bcommit\b[^|;&]*\s-[a-zA-Z]*n[a-zA-Z]*(\s|$)`), SKIP_HOOKS], // commit -n
  [new RegExp(git + String.raw`\bconfig\b[^|;&]*core\.hooksPath(?!\s+\.githooks)`), SKIP_HOOKS],
  [
    new RegExp(git + String.raw`\bpush\b[^|;&]*\s(--force(?!-with-lease)|-[a-zA-Z]*f[a-zA-Z]*(\s|$))`),
    'No force pushes. If you rebased your own branch, use --force-with-lease.',
  ],
  [
    new RegExp(git + String.raw`\bpush\b[^|;&]*[\s:+](main|develop)(\s|$)`),
    'Never push to main or develop. Push your working branch and open a pull request (/open-pr).',
  ],
];

const hit = RULES.find(([pattern]) => pattern.test(command));
if (hit) {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: hit[1] },
  }));
}
