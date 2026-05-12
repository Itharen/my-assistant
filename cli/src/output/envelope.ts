// JSON envelope formátum — az `fo` CLI mintáját követi.
// Stable contract — a my-assistant action-log és minden CLI output ezt használja.

import { randomUUID } from 'node:crypto';

export interface EnvelopeOk<T> {
  ok: true;
  action: string;
  requestId: string;
  elapsedMs: number;
  result: T;
}

export interface EnvelopeFail {
  ok: false;
  action: string;
  requestId: string;
  elapsedMs: number;
  error: { code: string; message: string; details?: unknown };
}

export type Envelope<T = unknown> = EnvelopeOk<T> | EnvelopeFail;

export function makeRequestId(): string {
  return randomUUID();
}

export function ok<T>(action: string, requestId: string, startedAt: number, result: T): EnvelopeOk<T> {
  return {
    ok: true,
    action,
    requestId,
    elapsedMs: Date.now() - startedAt,
    result,
  };
}

export function fail(
  action: string,
  requestId: string,
  startedAt: number,
  code: string,
  message: string,
  details?: unknown,
): EnvelopeFail {
  return {
    ok: false,
    action,
    requestId,
    elapsedMs: Date.now() - startedAt,
    error: { code, message, details },
  };
}

export function writeEnvelope(envelope: Envelope, pretty: boolean): void {
  process.stdout.write(JSON.stringify(envelope, null, pretty ? 2 : undefined) + '\n');
}
