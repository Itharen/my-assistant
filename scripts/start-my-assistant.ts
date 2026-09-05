import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFile, watch, type FSWatcher } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SERVER_ORIGIN = 'http://127.0.0.1:39245';
const DEFAULT_TIMEOUT_MS = 12 * 60 * 1000;
const SERVER_LISTENING_MARKER = 'HTTP (open) server is listening on port:';
const FATAL_PIPELINE_STEPS = new Set([
  'rimraf-cli-dist',
  'tsc-cli',
  'rimraf-server-dist',
  'tsc-server',
  'client-build',
  'browser-extension-build',
]);

export interface StartOptions {
  route: 'dashboard' | 'linkedin';
  openBrowser: boolean;
  timeoutMs: number;
  projectRoot: string;
}

interface PipelineStepState { status?: string }
interface PipelineStatus {
  startedAtMs?: number;
  phase?: string;
  restartPending?: boolean;
  serverRunning?: boolean;
  steps?: Record<string, PipelineStepState>;
}

export function isPipelineReady(status: PipelineStatus): boolean {
  return status.serverRunning === true && status.restartPending !== true;
}

export function runtimeLogShowsReady(raw: string): boolean {
  return raw.includes(SERVER_LISTENING_MARKER);
}

export function parseStartOptions(args: string[], cwd: string = process.cwd()): StartOptions {
  let route: StartOptions['route'] = 'linkedin';
  let openBrowser: boolean = true;
  let timeoutMs: number = DEFAULT_TIMEOUT_MS;
  let projectRoot: string = cwd;
  for (let index = 0; index < args.length; index += 1) {
    const arg: string | undefined = args[index];
    if (arg === '--no-open') {
      openBrowser = false;
    } else if (arg === '--route') {
      const value: string | undefined = args[index + 1];
      if (value !== 'dashboard' && value !== 'linkedin') {
        throw new Error('--route must be dashboard or linkedin.');
      }
      route = value;
      index += 1;
    } else if (arg === '--timeout-ms') {
      const value: number = Number(args[index + 1]);
      if (!Number.isInteger(value) || value < 1_000 || value > 30 * 60 * 1000) {
        throw new Error('--timeout-ms must be an integer between 1000 and 1800000.');
      }
      timeoutMs = value;
      index += 1;
    } else if (arg === '--project-root') {
      const value: string | undefined = args[index + 1];
      if (!value) {
        throw new Error('--project-root requires a path.');
      }
      projectRoot = resolve(cwd, value);
      index += 1;
    } else {
      throw new Error(`Unknown startup option: ${arg ?? '(missing)'}.`);
    }
  }
  return { route, openBrowser, timeoutMs, projectRoot };
}

export function findFatalPipelineFailure(status: PipelineStatus): string | null {
  if (status.serverRunning === true) {
    return null;
  }
  for (const [name, step] of Object.entries(status.steps ?? {})) {
    if (FATAL_PIPELINE_STEPS.has(name) && step.status === 'failed') {
      return name;
    }
  }
  return null;
}

export async function isServerHealthy(fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const response: Response = await fetcher(`${SERVER_ORIGIN}/api/healthz`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function start(options: StartOptions): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = randomUUID();
  if (!(await isServerHealthy())) {
    const launchedAt: number = Date.now();
    launchPipeline(options.projectRoot);
    await waitForPipeline(options.projectRoot, launchedAt, options.timeoutMs);
    const remainingMs: number = options.timeoutMs - (Date.now() - launchedAt);
    if (remainingMs < 1) {
      throw new Error(`My Assistant did not become healthy within ${options.timeoutMs}ms. See logs/live-dev-pipeline/status.json and output.log.`);
    }
    await waitForRuntimeLog(options.projectRoot, remainingMs);
    if (!(await isServerHealthy())) {
      throw new Error('LDP reported a running server, but GET /api/healthz did not succeed. See logs/live-dev-pipeline/output.log.');
    }
  }

  const url: string = `${SERVER_ORIGIN}/${options.route}`;
  if (options.openBrowser) {
    openDefaultBrowser(url);
  }
  process.stdout.write(`${JSON.stringify({
    ok: true,
    action: 'workspace.start',
    requestId,
    elapsedMs: Date.now() - startedAt,
    result: { server: 'healthy', url, browserOpened: options.openBrowser },
  })}\n`);
}

function waitForRuntimeLog(projectRoot: string, timeoutMs: number): Promise<void> {
  const logPath: string = resolve(projectRoot, 'logs', 'live-dev-pipeline', 'output.log');
  const logDirectory: string = resolve(projectRoot, 'logs', 'live-dev-pipeline');
  return new Promise((resolveReady: () => void, reject: (error: Error) => void): void => {
    let settled: boolean = false;
    let watcher: FSWatcher | null = null;
    const finish = (error?: Error): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      watcher?.close();
      error ? reject(error) : resolveReady();
    };
    const inspect = (): void => {
      readFile(logPath, 'utf8', (error: NodeJS.ErrnoException | null, raw?: string): void => {
        if (error || !raw || settled) {
          return;
        }
        if (runtimeLogShowsReady(raw)) {
          finish();
        }
      });
    };
    const timeout: NodeJS.Timeout = setTimeout((): void => {
      finish(new Error(
        `LDP completed, but the My Assistant HTTP runtime did not report its listening state within ${timeoutMs}ms. `
        + 'See logs/live-dev-pipeline/output.log.',
      ));
    }, timeoutMs);
    try {
      watcher = watch(logDirectory, (_event: string, filename: string | null): void => {
        if (filename === null || filename === 'output.log') {
          inspect();
        }
      });
      inspect();
    } catch (error: unknown) {
      finish(new Error(`Cannot watch LDP output directory '${logDirectory}': ${error instanceof Error ? error.message : String(error)}`));
    }
  });
}

function launchPipeline(projectRoot: string): void {
  const command: string = process.platform === 'win32' ? 'cmd.exe' : 'dc';
  const args: string[] = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'dc ldp --foreground']
    : ['ldp', '--foreground'];
  const child: ChildProcess = spawn(command, args, {
    cwd: projectRoot,
    detached: true,
    windowsHide: true,
    stdio: 'ignore',
  });
  child.on('error', (error: Error): void => {
    process.stderr.write(`[my-assistant/start] LDP launch failed: ${error.message}\n`);
  });
  child.unref();
}

function waitForPipeline(projectRoot: string, launchedAt: number, timeoutMs: number): Promise<void> {
  const statusPath: string = resolve(projectRoot, 'logs', 'live-dev-pipeline', 'status.json');
  const statusDirectory: string = resolve(projectRoot, 'logs', 'live-dev-pipeline');
  mkdirSync(statusDirectory, { recursive: true });
  return new Promise((resolveReady: () => void, reject: (error: Error) => void): void => {
    let settled: boolean = false;
    let watcher: FSWatcher | null = null;
    const finish = (error?: Error): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      watcher?.close();
      error ? reject(error) : resolveReady();
    };
    const inspect = (): void => {
      readFile(statusPath, 'utf8', (error: NodeJS.ErrnoException | null, raw?: string): void => {
        if (error || !raw || settled) {
          return;
        }
        try {
          const status: PipelineStatus = JSON.parse(raw) as PipelineStatus;
          if ((status.startedAtMs ?? 0) < launchedAt - 2_000) {
            return;
          }
          if (isPipelineReady(status)) {
            finish();
            return;
          }
          const failedStep: string | null = findFatalPipelineFailure(status);
          if (failedStep) {
            finish(new Error(`My Assistant startup stopped at fatal LDP step '${failedStep}'. See logs/live-dev-pipeline/output.log.`));
          }
        } catch (error: unknown) {
          process.stderr.write(`[my-assistant/start] Status parse deferred: ${error instanceof Error ? error.message : String(error)}\n`);
        }
      });
    };
    const timeout: NodeJS.Timeout = setTimeout((): void => {
      finish(new Error(`My Assistant did not become healthy within ${timeoutMs}ms. See logs/live-dev-pipeline/status.json and output.log.`));
    }, timeoutMs);
    try {
      watcher = watch(statusDirectory, (_event: string, filename: string | null): void => {
        if (filename === null || filename === 'status.json') {
          inspect();
        }
      });
      inspect();
    } catch (error: unknown) {
      finish(new Error(`Cannot watch LDP status directory '${statusDirectory}': ${error instanceof Error ? error.message : String(error)}`));
    }
  });
}

function openDefaultBrowser(url: string): void {
  const set = process.platform === 'win32'
    ? { command: 'explorer.exe', args: [url] }
    : process.platform === 'darwin'
      ? { command: 'open', args: [url] }
      : { command: 'xdg-open', args: [url] };
  const child: ChildProcess = spawn(set.command, set.args, { detached: true, stdio: 'ignore' });
  child.unref();
}

async function main(): Promise<void> {
  const requestId: string = randomUUID();
  const startedAt: number = Date.now();
  try {
    await start(parseStartOptions(process.argv.slice(2)));
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${JSON.stringify({
      ok: false,
      action: 'workspace.start',
      requestId,
      elapsedMs: Date.now() - startedAt,
      error: { code: 'MA-WORKSPACE-START', message },
    })}\n`);
    process.exitCode = 1;
  }
}

const invokedPath: string | undefined = process.argv[1];
if (invokedPath && pathToFileURL(resolve(invokedPath)).href === import.meta.url) {
  void main();
}
