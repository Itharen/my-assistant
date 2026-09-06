// A tick döntési logikája — TISZTA függvény, futó rendszer nélkül tesztelhető.
//
// A szabályok forrása: `__agent/flows/recurring/hourly-assistant-tick/README.md` §3B–§3C.
//
// A döntés sorrendje szándékos, és ez a sorrend hordozza a szabályokat:
//   1. Mód: ÉBREN → daytime, különben nighttime (nem napszak, hanem ébrenlét szerint)
//   2. Van-e egyáltalán mondanivaló → ha nincs: CSENDES tick
//   3. Éjszaka: GYŰJT, nem szól (a hangszóró éjjel tilos, a Discord alapból vár)
//   4. Nappal: csatorna-választás — a hangszóró csak indokolt esetben ÉS csak nyitott kapuval

import type { PresenceGateDecision } from '../cast/notify.presence-gate.js';
import type { StatusDigest, StatusTask } from '../status/status.models.js';
import {
  DEFAULT_TICK_CONFIG,
  type NotifiedHistory,
  type TickConfig,
  type TickDecision,
  type TickMode,
} from './tick.models.js';

export function decideTick(params: {
  digest: StatusDigest;
  gate: PresenceGateDecision;
  now: Date;
  notified?: NotifiedHistory;
  config?: TickConfig;
}): TickDecision {
  const config: TickConfig = params.config ?? DEFAULT_TICK_CONFIG;
  const notified: NotifiedHistory = params.notified ?? {};
  const mode: TickMode = params.gate.signals.isAwake === 'yes' ? 'daytime' : 'nighttime';

  // A cselekvést igénylő tételek: ami lejárt, és ami egy órán belül esedékes.
  // A „ma" rekesz tájékoztató — önmagában nem indokol értesítést.
  const candidates: StatusTask[] = [
    ...params.digest.buckets.overdue,
    ...params.digest.buckets.withinHour,
  ];
  const fresh: StatusTask[] = candidates.filter(
    (task) => !wasRecentlyNotified(task, notified, params.now, config),
  );

  if (fresh.length === 0) {
    return {
      mode,
      action: 'silent',
      channel: null,
      items: [],
      // 🔴 A hiányos kivonatot KIMONDJUK: a csend ilyenkor nem bizonyíték.
      reason: params.digest.isPartial
        ? 'Csendes tick — de a kivonat HIÁNYOS (egy forrás nem válaszolt), '
          + 'tehát a „nincs teendő" nem megbízható.'
        : candidates.length === 0
          ? 'Csendes tick — nincs lejárt vagy egy órán belüli tétel.'
          : `Csendes tick — mind a(z) ${candidates.length} tételről szóltunk már nemrég.`,
    };
  }

  if (mode === 'nighttime') {
    return {
      mode,
      action: 'hold',
      channel: null,
      items: fresh,
      reason: `Éjszakai mód (nem tudjuk ébren lenni): ${fresh.length} tétel GYŰJTVE, `
        + 'ébredéskor egy csomagban megy. Hangszóró éjjel tilos.',
    };
  }

  // Nappali mód — a hangszóró csak akkor, ha a kapu nyitva ÉS a sürgősség indokolja.
  // Az egyezést AZONOSÍTÓ szerint nézzük, nem objektum-azonosság szerint: a kivonat
  // forrása változhat (pl. újra-beolvasás), és akkor a referencia-egyezés némán elromlana.
  const freshRefs: Set<string> = new Set(fresh.map((task) => task.ref));
  const hasImminentDeadline: boolean = params.digest.buckets.withinHour.some(
    (task) => freshRefs.has(task.ref),
  );

  if (params.gate.allowed && hasImminentDeadline) {
    return {
      mode,
      action: 'notify',
      channel: 'speaker',
      items: fresh,
      reason: 'Nappali mód, a kapu nyitva (ébren + itthon), és van egy órán belüli határidő '
        + '— a hangszóró indokolt.',
    };
  }

  return {
    mode,
    action: 'notify',
    channel: 'discord',
    items: fresh,
    reason: params.gate.allowed
      ? `Nappali mód: ${fresh.length} tétel, de nincs egy órán belüli határidő `
        + '— nem indokolt a hangszóró, Discordon szólunk.'
      : `Nappali mód, de a hangszórós kapu zárva (${params.gate.reason}) — Discordon szólunk.`,
  };
}

/**
 * Szóltunk-e már erről a tételről nemrég.
 *
 * Enélkül egy lejárt feladat ÓRÁNKÉNT újra kimenne, és a csatorna zajjá válna — pont a
 * fontos üzenetek vesznének el benne.
 */
function wasRecentlyNotified(
  task: StatusTask,
  notified: NotifiedHistory,
  now: Date,
  config: TickConfig,
): boolean {
  const lastNotifiedAt: string | undefined = notified[task.ref];

  if (!lastNotifiedAt) return false;

  const parsed: number = new Date(lastNotifiedAt).getTime();

  // Értelmezhetetlen időbélyeg → inkább szólunk újra, mint hogy némán elnyeljük.
  if (Number.isNaN(parsed)) return false;

  return now.getTime() - parsed < config.repeatSuppressionMs;
}
