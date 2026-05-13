// CLI entry — `ma` command. Two-level command tree:
//   ma cast {discover|notify|volume|preset|list-interfaces}
//   ma spotify {auth|status}
//
// JSON envelope output stdout-ra; verbose log stderr-re.
// Action-log emit minden subcommand kezdetén és végén (ok / error).
// Global error handler: `uncaughtException` + `unhandledRejection` mindent
// action-log-ba ír (semmi csendes swallow — `current/principles/error-handling.md`).

import { logAction } from './action-log/action-log.client.js';
import { fail, makeRequestId, writeEnvelope } from './output/envelope.js';

// Global error handler-ek azonnal kötjük (NEM await, mert sync error-ok
// import-time-on is fire-elhetnek). A logAction async + Result-tel tér vissza,
// de itt szándékosan `void`-oljuk: már egy fatal-error pipeline-ban vagyunk,
// a log-write fail-jét sem tudnánk értelmesen kezelni (recursive error).
// A log-write fail-je így is **látható** lesz — a logAction belső
// `process.stderr.write` strukturált emitje fut le (error-handling-cleanup
// Phase 1). Per current/principles/error-handling.md.
process.on('uncaughtException', (err: Error) => {
  process.stderr.write(`[ma] uncaughtException: ${err.stack ?? err.message}\n`);
  void logAction({
    kind: 'error',
    summary: `ma uncaughtException: ${err.message}`,
    extra: { stack: err.stack, name: err.name },
  }).finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason: unknown) => {
  const err: Error = reason instanceof Error ? reason : new Error(String(reason));
  process.stderr.write(`[ma] unhandledRejection: ${err.stack ?? err.message}\n`);
  void logAction({
    kind: 'error',
    summary: `ma unhandledRejection: ${err.message}`,
    extra: { stack: err.stack, name: err.name },
  }).finally(() => process.exit(1));
});

import { runListInterfacesCommand } from './commands/list-interfaces.command.js';
import { runDiscoverCommand } from './commands/discover.command.js';
import { runVolumeCommand } from './commands/volume.command.js';
import { runNotifyCommand } from './commands/notify.command.js';
import { runPresetCommand } from './commands/preset.command.js';
import { runSpotifyStatusCommand } from './commands/spotify-status.command.js';
import { runSpotifyAuthCommand } from './commands/spotify-auth.command.js';
import { runGoogleAuthCommand } from './commands/google-auth.command.js';
import { runGoogleStatusCommand } from './commands/google-status.command.js';
import { runGoogleQueryCommand } from './commands/google-query.command.js';
import { runActionLogEmitCommand } from './commands/action-log-emit.command.js';

type CommandHandler = (args: string[]) => Promise<void>;

const COMMAND_TREE: Record<string, Record<string, CommandHandler>> = {
  cast: {
    discover: runDiscoverCommand,
    notify: runNotifyCommand,
    volume: runVolumeCommand,
    preset: runPresetCommand,
    'list-interfaces': runListInterfacesCommand,
  },
  spotify: {
    auth: runSpotifyAuthCommand,
    status: runSpotifyStatusCommand,
  },
  google: {
    auth: runGoogleAuthCommand,
    status: runGoogleStatusCommand,
    query: runGoogleQueryCommand,
  },
  'action-log': {
    emit: runActionLogEmitCommand,
  },
};

async function main(): Promise<void> {
  const startedAt = Date.now();
  const requestId = makeRequestId();
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    printHelp();
    return;
  }

  const group = argv[0];
  const sub = argv[1];
  const subArgs = argv.slice(2);

  if (!group || !(group in COMMAND_TREE)) {
    process.stderr.write(`Unknown command group: "${group}". Run \`ma --help\` for usage.\n`);
    process.exit(2);
  }

  if (!sub || sub === '--help' || sub === '-h') {
    printGroupHelp(group);
    return;
  }

  const handler = COMMAND_TREE[group]?.[sub];
  if (!handler) {
    process.stderr.write(`Unknown subcommand: "${group} ${sub}". Run \`ma ${group} --help\` for usage.\n`);
    process.exit(2);
  }

  await logAction({
    kind: 'external-action',
    summary: `ma ${group} ${sub} invoked`,
    extra: { group, sub, requestId, args: subArgs },
  });

  try {
    await handler(subArgs);
    await logAction({
      kind: 'external-action',
      summary: `ma ${group} ${sub} ok (${Date.now() - startedAt}ms)`,
      extra: { requestId, group, sub, elapsedMs: Date.now() - startedAt },
    });
  } catch (err) {
    const e = err as Error;
    writeEnvelope(fail(`${group}.${sub}`, requestId, startedAt, 'E_FAILED', e.message), true);
    await logAction({
      kind: 'error',
      summary: `ma ${group} ${sub} failed: ${e.message}`,
      extra: { requestId, group, sub, elapsedMs: Date.now() - startedAt },
    });
    process.exit(1);
  }
}

function printHelp(): void {
  process.stdout.write(
    [
      '',
      'ma — my-assistant CLI (TTS push, volume orchestration, Spotify resume; FOSS-only)',
      '',
      'Usage:',
      '  ma <group> <subcommand> [options]',
      '',
      'Groups:',
      '  cast        Cast device operations (discover/notify/volume/preset)',
      '  spotify     Spotify Web API integration (auth/status)',
      '  google      Google Assistant integration (auth/status/query)',
      '  action-log  Action-log entry emit (kanonikus belépés)',
      '',
      'Run `ma <group> --help` for group-specific help.',
      '',
    ].join('\n'),
  );
}

function printGroupHelp(group: string): void {
  if (group === 'cast') {
    process.stdout.write(
      [
        '',
        'ma cast — Cast device operations',
        '',
        'Subcommands:',
        '  list-interfaces  Show local non-loopback IPv4 interfaces (debug)',
        '  discover         List Cast devices on the local network (mDNS)',
        '  notify           TTS push: SAVE→UP→PLAY→RESTORE volume + Spotify resume',
        '  volume           Get/set volume on a device or group',
        '  preset           List/apply/capture per-device volume presets',
        '',
        'Common flags:',
        '  --pretty         Pretty-print JSON envelope',
        '  --verbose        Emit progress logs to stderr',
        '  --interface IP   Override mDNS interface (repeatable, comma-list)',
        '  --timeout N      Discovery timeout in ms (default 4000)',
        '',
        'Notify defaults:',
        '  --target = "All Speakers"',
        '  --voice = hu-HU-TamasNeural (mapped from --lang hu)',
        '  --announcement-volume = 0.7',
        '',
        'Examples:',
        '  ma cast discover --pretty',
        '  ma cast notify --text "Ideje lefeküdni" --pretty',
        '  ma cast volume --target "BathCom" --get',
        '  ma cast preset --apply default-evening',
        '',
      ].join('\n'),
    );
    return;
  }
  if (group === 'spotify') {
    process.stdout.write(
      [
        '',
        'ma spotify — Spotify Web API integration',
        '',
        'Subcommands:',
        '  auth     One-time OAuth setup (interactive browser callback)',
        '  status   Diagnostic — show config + token validity + current playback',
        '',
        'Examples:',
        '  ma spotify auth',
        '  ma spotify status --pretty',
        '',
      ].join('\n'),
    );
    return;
  }
  if (group === 'action-log') {
    process.stdout.write(
      [
        '',
        'ma action-log — Action-log entry emit (FR #3e Phase 1)',
        '',
        'Subcommands:',
        '  emit     Append entry → __agent/log/actions/<day>.jsonl (+ server POST stub Phase 3+)',
        '',
        'emit flags:',
        '  --kind <K>      (required) entry kind (note, ship, error, tool-call, file-edit, ...)',
        '  --summary <S>   (required) egy mondatos összefoglaló',
        '  --actor <A>     default: cli',
        '  --ref <R>       fájl-/task-ref/url',
        '  --session <S>   Claude session id (hook context)',
        '  --extra <JSON>  JSON-encoded extra payload',
        '  --ts <ISO>      default: now (Europe/Budapest)',
        '  --pretty        pretty-print JSON envelope',
        '',
        'Examples:',
        '  ma action-log emit --kind note --summary "cycle 25 start" --pretty',
        '  ma action-log emit --actor claude --kind tool-call --summary "Edit foo.ts"',
        '',
      ].join('\n'),
    );
    return;
  }
  printHelp();
}

main().catch(async (err) => {
  const e = err as Error;
  process.stderr.write(`[ma] FATAL: ${e.stack ?? e.message}\n`);
  await logAction({
    kind: 'error',
    summary: `ma FATAL (main rejection): ${e.message}`,
    extra: { stack: e.stack, name: e.name },
  });
  process.exit(1);
});
