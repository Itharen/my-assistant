// scripts/agent-handlers/src/handlers/notify-discord.ts
// Tier 1 (notify cluster) — FR #5b-DISCORD Phase 2
// (current/feature-requests/discord-webhook-notification.md).
//
// HTTP POST egy Discord webhook URL-re (embed-formátum). Master-prompter
// pattern: a `ccap-notify` handler (FR #1 Phase 1) mintáját követi — közös
// throttle + strukturált error + action-log emit.
//
// Env:
//   MA_DISCORD_WEBHOOK_URL  (required) — a csatorna webhook URL-je
//   MA_DISCORD_USER_ID      (opc.)     — mention='user' esetén a @ping target
//
// Konfliktus-kerülés: teljesen ortogonális — új fájl, új env-var, nem érinti
// az auth-blokkolót / ESM-migrációt / Google Home channel-t.

import { logAction } from '../action-log.js';
import { checkThrottle, recordThrottle } from '../throttle.js';
import type { NotifyDiscordAction } from '../types.js';

// Discord embed színek prioritás szerint (decimal RGB). Override: args.color.
const PRIORITY_COLORS: Record<string, number> = {
  info: 0x3498db, // kék
  success: 0x2ecc71, // zöld
  warning: 0xf1c40f, // sárga
  error: 0xe74c3c, // piros
};

const DEFAULT_COLOR: number = PRIORITY_COLORS.info!;

/**
 * Felépíti a Discord webhook payload-ot. Pure — könnyen tesztelhető.
 * A `content` csak a mention-ping-et hordozza (mobil push @-jelzés), a
 * strukturált tartalom az embed-ben van (title + description). Így nincs
 * duplikáció a content és description közt.
 */
export function buildDiscordPayload(
  args: NotifyDiscordAction['args'],
  userId: string | undefined,
): { content: string; embeds: Array<{ title: string; description: string; color: number }> } {
  const content: string = args.mention === 'user' && userId ? `<@${userId}>` : '';
  const color: number =
    typeof args.color === 'number'
      ? args.color
      : (args.priority ? PRIORITY_COLORS[args.priority] : undefined) ?? DEFAULT_COLOR;

  return {
    content,
    embeds: [{ title: args.title, description: args.message, color }],
  };
}

export async function handleNotifyDiscord(action: NotifyDiscordAction): Promise<void> {
  const webhookUrl: string | undefined = process.env.MA_DISCORD_WEBHOOK_URL;

  // Strukturált hiba — semmi csendes swallow (error-handling.md zero-tolerance).
  if (!webhookUrl) {
    await logAction({
      actor: 'agent',
      kind: 'error',
      summary: `[notify-discord] MA_DISCORD_WEBHOOK_URL not set — "${action.args.title}" not sent`,
      extra: { code: 'MA-DISCORD-NO-WEBHOOK-URL', title: action.args.title },
    });
    throw new Error('MA-DISCORD-NO-WEBHOOK-URL: MA_DISCORD_WEBHOOK_URL env-var is required');
  }

  // Phase 4 közös throttle — ha throttleId adott + cooldown-on belül → skip + log.
  if (action.args.throttleId) {
    const check = await checkThrottle(action.args.throttleId, action.args.cooldownMs);
    if (check.skip) {
      await logAction({
        actor: 'agent',
        kind: 'note',
        summary: `[notify-discord] throttled: "${action.args.title}" (ageMs=${check.ageMs}, cooldownMs=${check.cooldownMs})`,
        extra: {
          code: 'MA-DISCORD-THROTTLED',
          throttleId: action.args.throttleId,
          lastSentAt: check.lastSentAt,
          ageMs: check.ageMs,
          cooldownMs: check.cooldownMs,
        },
      });
      return;
    }
  }

  const payload = buildDiscordPayload(action.args, process.env.MA_DISCORD_USER_ID);

  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : String(err);
    await logAction({
      actor: 'agent',
      kind: 'error',
      summary: `[notify-discord] POST failed: "${action.args.title}" — ${msg}`,
      extra: { code: 'MA-DISCORD-POST-FAIL', title: action.args.title, error: msg },
    });
    throw new Error(`MA-DISCORD-POST-FAIL: ${msg}`);
  }

  if (!res.ok) {
    // Discord webhook tipikusan 204 No Content sikerre; 4xx/5xx → hiba.
    let respBody: string = '';
    try {
      respBody = await res.text();
    } catch {
      // body-read hiba nem kritikus — status-code önmagában elég a diagnózishoz
    }
    await logAction({
      actor: 'agent',
      kind: 'error',
      summary: `[notify-discord] HTTP ${res.status}: "${action.args.title}"${respBody ? ` — ${respBody.slice(0, 200)}` : ''}`,
      extra: { code: 'MA-DISCORD-HTTP-ERROR', status: res.status, title: action.args.title },
    });
    throw new Error(`MA-DISCORD-HTTP-ERROR: webhook returned ${res.status}`);
  }

  if (action.args.throttleId) {
    await recordThrottle(action.args.throttleId);
  }

  await logAction({
    actor: 'agent',
    kind: 'ship',
    summary: `[notify-discord] sent: "${action.args.title}" (priority=${action.args.priority ?? 'info'}, status=${res.status})`,
    extra: {
      title: action.args.title,
      priority: action.args.priority,
      mention: action.args.mention,
      throttleId: action.args.throttleId,
      cooldownMs: action.args.cooldownMs,
      status: res.status,
    },
  });
}
