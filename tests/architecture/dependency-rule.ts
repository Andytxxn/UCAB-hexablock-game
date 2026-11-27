import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

export const SRC_DIR = resolve(__dirname, '../../src');

export type SourceFile = { path: string; source: string };

// Clean Architecture rings, innermost first. A file may import its own ring or an inner one, never an outer one.
const RING: Record<string, number> = {
  domain: 0, // entities
  application: 1, // use cases
  presentation: 2, // interface adapters
  infrastructure: 2, // interface adapters
  main: 3, // frameworks & drivers: composition root
  app: 3, // frameworks & drivers: expo-router routes
};

// The two inner rings must stay framework-free (CLAUDE.md: no React Native, Expo or Drizzle there).
const FRAMEWORK_FREE_RING = 1;
const FRAMEWORK =
  /^(react|react-dom|react-native|i18next|react-i18next)(\/|$)|^(expo|drizzle)(-|\/|$)|^(@expo|@react-native|react-native-)/;

// Static imports, re-exports, side-effect imports, require() and dynamic import().
const IMPORT =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

const SOURCE_EXTENSION = /\.(ts|tsx|js|jsx)$/;

function ringOf(path: string): number | undefined {
  const fromSrc = relative(SRC_DIR, path);
  if (fromSrc.startsWith('..')) return undefined;
  return RING[fromSrc.split(sep)[0]];
}

function resolveInSrc(specifier: string, importer: string): string | undefined {
  if (specifier.startsWith('@/')) return join(SRC_DIR, specifier.slice(2));
  if (specifier.startsWith('.')) return resolve(dirname(importer), specifier);
  return undefined; // a package
}

export function readSourceFiles(dir: string): SourceFile[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((name) => SOURCE_EXTENSION.test(name))
    .map((name) => join(dir, name))
    .map((path) => ({ path, source: readFileSync(path, 'utf8') }));
}

export function findDependencyViolations(files: SourceFile[]): string[] {
  const violations: string[] = [];
  for (const { path, source } of files) {
    const ring = ringOf(path);
    if (ring === undefined) continue;
    for (const match of source.matchAll(IMPORT)) {
      const specifier = match[1] ?? match[2] ?? match[3];
      const target = resolveInSrc(specifier, path);
      const where = `${relative(SRC_DIR, path)} -> '${specifier}'`;
      if (target === undefined) {
        if (ring <= FRAMEWORK_FREE_RING && FRAMEWORK.test(specifier))
          violations.push(`${where}: framework import in an inner ring`);
        continue;
      }
      const targetRing = ringOf(target);
      if (targetRing !== undefined && targetRing > ring)
        violations.push(`${where}: points outward`);
    }
  }
  return violations;
}
