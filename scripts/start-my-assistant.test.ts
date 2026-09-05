import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  findFatalPipelineFailure,
  isPipelineReady,
  isServerHealthy,
  parseStartOptions,
  runtimeLogShowsReady,
} from './start-my-assistant';

describe('My Assistant startup launcher', (): void => {
  it('defaults to the LinkedIn workspace and supports agent-safe no-open mode', (): void => {
    const defaults = parseStartOptions([], 'C:\\project');
    assert.equal(defaults.route, 'linkedin');
    assert.equal(defaults.openBrowser, true);
    const agent = parseStartOptions(['--no-open', '--route', 'dashboard'], 'C:\\project');
    assert.equal(agent.route, 'dashboard');
    assert.equal(agent.openBrowser, false);
  });

  it('rejects invalid startup arguments before spawning anything', (): void => {
    assert.throws(() => parseStartOptions(['--route', 'unknown']), /dashboard or linkedin/u);
    assert.throws(() => parseStartOptions(['--timeout-ms', '12']), /between 1000/u);
    assert.throws(() => parseStartOptions(['--wat']), /Unknown startup option/u);
  });

  it('distinguishes fatal compile failures from nonfatal test failures', (): void => {
    assert.equal(findFatalPipelineFailure({ steps: { 'client-test': { status: 'failed' } } }), null);
    assert.equal(findFatalPipelineFailure({ steps: { 'tsc-server': { status: 'failed' } } }), 'tsc-server');
    assert.equal(findFatalPipelineFailure({ serverRunning: true, steps: { 'tsc-server': { status: 'failed' } } }), null);
  });

  it('does not accept a server that is being replaced by a pending pipeline restart', (): void => {
    assert.equal(isPipelineReady({ serverRunning: true, restartPending: false }), true);
    assert.equal(isPipelineReady({ serverRunning: true, restartPending: true }), false);
    assert.equal(isPipelineReady({ serverRunning: false, restartPending: false }), false);
  });

  it('waits for the event-driven HTTP listening marker instead of trusting the early LDP flag', (): void => {
    assert.equal(runtimeLogShowsReady('[ldp] server start (PID: 1)'), false);
    assert.equal(runtimeLogShowsReady('HTTP (open) server is listening on port: 0.0.0.0:39245'), true);
  });

  it('requires a successful health response', async (): Promise<void> => {
    assert.equal(await isServerHealthy(async (): Promise<Response> => new Response('{}', { status: 200 })), true);
    assert.equal(await isServerHealthy(async (): Promise<Response> => new Response('{}', { status: 503 })), false);
    assert.equal(await isServerHealthy(async (): Promise<Response> => { throw new Error('offline'); }), false);
  });
});
