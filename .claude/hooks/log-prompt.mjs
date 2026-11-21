#!/usr/bin/env node
// UserPromptSubmit hook: appends every prompt sent to Claude Code to
// docs/ai-usage/prompts/<member>.md. One file per team member.
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { userInfo } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// AI_PROMPT_LOG_DIR exists only so test.mjs can write to a temp folder.
const logDir = process.env.AI_PROMPT_LOG_DIR ?? join(root, 'docs', 'ai-usage', 'prompts');

const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

// The repository is public: mask anything that looks like a credential before writing it.
// shortcut: best-effort patterns, upgrade to a real secret scanner (gitleaks) if one ever slips through.
const SECRETS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED PRIVATE KEY]'],
  [/\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_\w{20,}|sk-[\w-]{20,}|AKIA[0-9A-Z]{16}|AIza[\w-]{30,})/g, '[REDACTED]'],
  [/\beyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}/g, '[REDACTED JWT]'],
  [/\b(Bearer\s+)[\w.~+/-]{16,}=*/gi, '$1[REDACTED]'],
  [/(\w+:\/\/[^\s:/@]+:)[^\s@]+@/g, '$1[REDACTED]@'],
  [/\b(password|passwd|pwd|secret|token|api[_-]?key|contraseña|clave)(["']?\s*[:=]\s*["']?)[^\s"']+/gi, '$1$2[REDACTED]'],
];
const redact = (text) => SECRETS.reduce((out, [pattern, mask]) => out.replace(pattern, mask), text);

const input = JSON.parse(readFileSync(0, 'utf8'));
const prompt = (input.prompt ?? '').trim();
if (!prompt) process.exit(0);

const name = git('config', 'user.name') || userInfo().username;
const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const branch = git('rev-parse', '--abbrev-ref', 'HEAD') || 'unknown';

const now = new Date();
const offset = -now.getTimezoneOffset();
const pad = (n) => String(n).padStart(2, '0');
const stamp = `${now.toLocaleString('sv-SE')} UTC${offset < 0 ? '-' : '+'}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;

const file = join(logDir, `${slug}.md`);
mkdirSync(logDir, { recursive: true });
const header = existsSync(file)
  ? ''
  : `# AI prompt log — ${name}\n\nRaw, automatic log of every prompt sent to Claude Code in this repository\n(written by \`.claude/hooks/log-prompt.mjs\`). Do not edit by hand. Curated entries live in \`AI_USAGE.md\`.\n`;
const quoted = redact(prompt).split(/\r?\n/).map((line) => `> ${line}`.trimEnd()).join('\n');
appendFileSync(file, `${header}\n## ${stamp} · \`${branch}\` · session \`${(input.session_id ?? 'unknown').slice(0, 8)}\`\n\n${quoted}\n`);
