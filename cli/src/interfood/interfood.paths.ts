import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { InterfoodToolError } from './interfood.error.js';

export interface InterfoodPaths {
  runtimeRoot: string;
  accountSnapshot: string;
  foodRegistry: string;
  latestPlan: string;
  receipts: string;
  preferences: string;
}

export function resolveInterfoodPaths(
  startDirectory: string = process.cwd(),
  userHome: string = homedir(),
): InterfoodPaths {
  const runtimeRoot: string = join(userHome, '.config', 'my-assistant', 'interfood');
  const projectRoot: string = resolveInterfoodProjectRoot(startDirectory);
  return {
    runtimeRoot,
    accountSnapshot: join(runtimeRoot, 'account-snapshot.json'),
    foodRegistry: join(runtimeRoot, 'food-registry.json'),
    latestPlan: join(runtimeRoot, 'latest-plan.json'),
    receipts: join(runtimeRoot, 'receipts'),
    preferences: join(projectRoot, 'current', 'interfood', 'preferences.json'),
  };
}

export function resolveInterfoodProjectRoot(startDirectory: string): string {
  const configured: string | undefined = process.env.MA_ASSISTANT_PROJECT_ROOT;
  if (configured !== undefined && configured.trim().length > 0) return resolve(configured);
  let directory: string = resolve(startDirectory);
  for (let depth: number = 0; depth < 10; depth += 1) {
    if (existsSync(join(directory, '__agent')) && existsSync(join(directory, 'package.json'))) return directory;
    const parent: string = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new InterfoodToolError(
    'MA-INTERFOOD-PROJECT-ROOT',
    'Cannot locate my-assistant. Run from the project or set MA_ASSISTANT_PROJECT_ROOT.',
    { startDirectory },
  );
}

export async function readJsonIfExists(path: string): Promise<unknown | undefined> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown;
  } catch (error: unknown) {
    const code: string | undefined = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return undefined;
    throw new InterfoodToolError('MA-INTERFOOD-STATE-READ', 'Cannot read Interfood state.', {
      path,
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function writeJsonAtomically(path: string, value: unknown): Promise<void> {
  const temporaryPath: string = join(dirname(path), `.interfood.${process.pid}.${randomUUID()}.tmp`);
  await mkdir(dirname(path), { recursive: true });
  try {
    await import('node:fs/promises').then(({ writeFile }) => writeFile(
      temporaryPath,
      `${JSON.stringify(value, null, 2)}\n`,
      { encoding: 'utf8', mode: 0o600, flag: 'wx' },
    ));
    await rename(temporaryPath, path);
  } catch (error: unknown) {
    await rm(temporaryPath, { force: true });
    throw new InterfoodToolError('MA-INTERFOOD-STATE-WRITE', 'Cannot atomically write Interfood state.', {
      path,
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}
