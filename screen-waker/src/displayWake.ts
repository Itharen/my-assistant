import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot: string = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wakeScriptPath: string = path.join(packageRoot, 'scripts', 'wake-display.ps1');

export async function wakeDisplay(): Promise<void> {
  if (process.platform !== 'win32') throw new Error('Display wake is supported only on Windows');

  await new Promise<void>((resolve: () => void, reject: (reason: Error) => void): void => {
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', wakeScriptPath],
      { windowsHide: true },
    );
    let stderr: string = '';

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string): void => {
      stderr += chunk;
    });
    child.once('error', (error: Error): void => {
      reject(new Error(`Cannot start display wake helper: ${error.message}`, { cause: error }));
    });
    child.once('close', (code: number | null): void => {
      if (code === 0) resolve();
      else reject(new Error(`Display wake helper failed with exit code ${code}: ${stderr.trim()}`));
    });
  });
}
