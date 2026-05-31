// scripts/agent-handlers/src/handlers/notify-push.ts
// Tier 1 (notify cluster) — FR #5b ntfy.sh push Phase 1
// (current/feature-requests/ntfy-push-notification.md).
//
// HTTP POST egy ntfy.sh (public vagy self-hosted) topic-ra. MOBIL push-réteg:
// a Google Home / dashboard / CCAP otthoni csatornák mellé. Master-prompter
// pattern: a `notify-discord` (FR #5b-DISCORD Phase 2, cycle 130) + `ccap-notify`
// handler mintáját követi — közös throttle + strukturált error + action-log emit.
//
// ntfy kontraktus: **JSON publish formátum** (https://docs.ntfy.sh/publish/#publish-as-json)
// — POST a base-URL-re (NEM a topic-path-ra), body `{ topic, title, message,
// priority, tags }`. Azért JSON és nem HTTP-header (Title/Priority/Tags), mert a
// header-ek csak ByteString-ek (Latin-1) lehetnek → emoji a title-ben (pl. 💪)
// "Cannot convert to ByteString" hibát dobna. A JSON body UTF-8-safe.
//
// Env:
//   MA_NTFY_URL    (opc., default 'https://ntfy.sh') — a ntfy szerver base-URL
//   MA_NTFY_TOPIC  (required) — a topic, amire a user subscribe-olt
//   MA_NTFY_AUTH   (opc.) — Bearer token (self-host / reserved topic eseteén)
//
// Konfliktus-kerülés: teljesen ortogonális — új fájl, új env-var.

import { logAction } from '../action-log.js';
import { checkThrottle, recordThrottle } from '../throttle.js';
import type { NotifyPushAction } from '../types.js';

const DEFAULT_NTFY_URL: string = 'https://ntfy.sh';

// ntfy numerikus prioritás (1=min … 5=max) a named-priority-hoz.
const PRIORITY_MAP: Record<string, number> = {
  min: 1,
  low: 2,
  default: 3,
  high: 4,
  max: 5,
};

export interface NtfyJsonPayload {
  topic: string;
  title: string;
  message: string;
  priority?: number;
  tags?: string[];
}

/**
 * Felépíti a ntfy JSON publish payload-ot. Pure — könnyen tesztelhető.
 * A priority/tags csak akkor kerül be, ha adott (ntfy az alapértékeket
 * használja hiány esetén). A tags vesszővel-tagolt string → array (trim + üres-szűrés).
 */
export function buildNtfyPayload(args: NotifyPushAction['args'], topic: string): NtfyJsonPayload {
  const payload: NtfyJsonPayload = { topic, title: args.title, message: args.message };
  if (args.priority) payload.priority = PRIORITY_MAP[args.priority] ?? PRIORITY_MAP.default!;
  if (args.tags) {
    const tags: string[] = args.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (tags.length > 0) payload.tags = tags;
  }
  return payload;
}

export async function handleNotifyPush(action: NotifyPushAction): Promise<void> {
  const topic: string | undefined = process.env.MA_NTFY_TOPIC;
  const baseUrl: string = process.env.MA_NTFY_URL || DEFAULT_NTFY_URL;

  // Strukturált hiba — semmi csendes swallow (error-handling.md zero-tolerance).
  if (!topic) {
    await logAction({
      actor: 'agent',
      kind: 'error',
      summary: `[notify-push] MA_NTFY_TOPIC not set — "${action.args.title}" not sent`,
      extra: { code: 'MA-NTFY-NO-TOPIC', title: action.args.title },
    });
    throw new Error('MA-NTFY-NO-TOPIC: MA_NTFY_TOPIC env-var is required');
  }

  // Phase 4 közös throttle — ha throttleId adott + cooldown-on belül → skip + log.
  if (action.args.throttleId) {
    const check = await checkThrottle(action.args.throttleId, action.args.cooldownMs);
    if (check.skip) {
      await logAction({
        actor: 'agent',
        kind: 'note',
        summary: `[notify-push] throttled: "${action.args.title}" (ageMs=${check.ageMs}, cooldownMs=${check.cooldownMs})`,
        extra: {
          code: 'MA-NTFY-THROTTLED',
          throttleId: action.args.throttleId,
          lastSentAt: check.lastSentAt,
          ageMs: check.ageMs,
          cooldownMs: check.cooldownMs,
        },
      });
      return;
    }
  }

  // JSON publish: POST a base-URL-re (topic a body-ban). Trailing-slash tolerálás.
  const endpoint: string = baseUrl.replace(/\/+$/, '');
  const payload = buildNtfyPayload(action.args, topic);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.MA_NTFY_AUTH) headers.Authorization = `Bearer ${process.env.MA_NTFY_AUTH}`;

  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : String(err);
    await logAction({
      actor: 'agent',
      kind: 'error',
      summary: `[notify-push] POST failed: "${action.args.title}" — ${msg}`,
      extra: { code: 'MA-NTFY-POST-FAIL', title: action.args.title, error: msg },
    });
    throw new Error(`MA-NTFY-POST-FAIL: ${msg}`);
  }

  if (!res.ok) {
    // ntfy siker = 200 OK; 4xx/5xx → hiba.
    let respBody: string = '';
    try {
      respBody = await res.text();
    } catch {
      // body-read hiba nem kritikus — status-code önmagában elég a diagnózishoz
    }
    await logAction({
      actor: 'agent',
      kind: 'error',
      summary: `[notify-push] HTTP ${res.status}: "${action.args.title}"${respBody ? ` — ${respBody.slice(0, 200)}` : ''}`,
      extra: { code: 'MA-NTFY-HTTP-ERROR', status: res.status, title: action.args.title },
    });
    throw new Error(`MA-NTFY-HTTP-ERROR: ntfy returned ${res.status}`);
  }

  if (action.args.throttleId) {
    await recordThrottle(action.args.throttleId);
  }

  await logAction({
    actor: 'agent',
    kind: 'ship',
    summary: `[notify-push] sent: "${action.args.title}" (priority=${action.args.priority ?? 'default'}, status=${res.status})`,
    extra: {
      title: action.args.title,
      priority: action.args.priority,
      tags: action.args.tags,
      throttleId: action.args.throttleId,
      cooldownMs: action.args.cooldownMs,
      status: res.status,
    },
  });
}
