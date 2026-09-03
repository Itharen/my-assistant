// CLI entry — `ma` command. Two-level command tree:
//   ma cast {discover|notify|volume|preset|list-interfaces}
//   ma spotify {auth|status}
//
// JSON envelope output stdout-ra; verbose log stderr-re.
// Action-log emit minden subcommand kezdetén és végén (ok / error).
// Global error handler: `uncaughtException` + `unhandledRejection` mindent
// action-log-ba ír (semmi csendes swallow — `current/principles/error-handling.md`).

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import { config as loadDotEnv } from 'dotenv';

import { logAction } from './action-log/action-log.client.js';
import { EmailToolError, describeEmailError } from './email/email-error.js';
import { redactEmailCommandArgs, redactEmailSensitiveText } from './email/email-redaction.js';
import {
  LinkedInToolError,
  redactLinkedInCommandArgs,
  redactLinkedInSensitiveText,
} from './linkedin/linkedin.error.js';
import { InterfoodToolError } from './interfood/interfood.error.js';
import { fail, makeRequestId, writeEnvelope } from './output/envelope.js';

const moduleDirectory: string = dirname(fileURLToPath(import.meta.url));
loadDotEnv({ path: resolveProjectEnvPath(moduleDirectory) });

// Global error handler-ek azonnal kötjük (NEM await, mert sync error-ok
// import-time-on is fire-elhetnek). A logAction async + Result-tel tér vissza,
// de itt szándékosan `void`-oljuk: már egy fatal-error pipeline-ban vagyunk,
// a log-write fail-jét sem tudnánk értelmesen kezelni (recursive error).
// A log-write fail-je így is **látható** lesz — a logAction belső
// `process.stderr.write` strukturált emitje fut le (error-handling-cleanup
// Phase 1). Per current/principles/error-handling.md.
process.on('uncaughtException', (err: Error) => {
  process.stderr.write(`[ma] uncaughtException: ${err.stack ?? err.message}\n`);
  const persistentMessage: string = persistentErrorText(err.message);
  const persistentStack: string | undefined = err.stack ? persistentErrorText(err.stack) : undefined;
  void logAction({
    kind: 'error',
    summary: `ma uncaughtException: ${persistentMessage}`,
    extra: { stack: persistentStack, name: err.name },
  }).finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason: unknown) => {
  const err: Error = reason instanceof Error ? reason : new Error(describeEmailError(reason));
  process.stderr.write(`[ma] unhandledRejection: ${err.stack ?? err.message}\n`);
  const persistentMessage: string = persistentErrorText(err.message);
  const persistentStack: string | undefined = err.stack ? persistentErrorText(err.stack) : undefined;
  void logAction({
    kind: 'error',
    summary: `ma unhandledRejection: ${persistentMessage}`,
    extra: { stack: persistentStack, name: err.name },
  }).finally(() => process.exit(1));
});

import { StockMirrorError } from './stocks/organizer-stock-mirror.service.js';

type CommandHandler = (args: string[]) => Promise<void>;

// Every integration is lazy: unrelated provider SDK initialization/failure must
// never delay or break another command group.
const runListInterfacesCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/list-interfaces.command.js')).runListInterfacesCommand(args)
);
const runDiscoverCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/discover.command.js')).runDiscoverCommand(args)
);
const runVolumeCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/volume.command.js')).runVolumeCommand(args)
);
const runNotifyCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/notify.command.js')).runNotifyCommand(args)
);
const runPresetCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/preset.command.js')).runPresetCommand(args)
);
const runSpotifyStatusCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/spotify-status.command.js')).runSpotifyStatusCommand(args)
);
const runSpotifyAuthCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/spotify-auth.command.js')).runSpotifyAuthCommand(args)
);
const runGoogleAuthCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/google-auth.command.js')).runGoogleAuthCommand(args)
);
const runGoogleStatusCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/google-status.command.js')).runGoogleStatusCommand(args)
);
const runGoogleQueryCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/google-query.command.js')).runGoogleQueryCommand(args)
);
const runActionLogEmitCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/action-log-emit.command.js')).runActionLogEmitCommand(args)
);
const runStocksMirrorCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/stocks-mirror.command.js')).runStocksMirrorCommand(args)
);
const runEmailListMailboxesCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/email-list-mailboxes.command.js')).runEmailListMailboxesCommand(args)
);
const runEmailListCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/email-list.command.js')).runEmailListCommand(args)
);
const runEmailReadCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/email-read.command.js')).runEmailReadCommand(args)
);
const runEmailFetchAttachmentsCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/email-fetch-attachments.command.js')).runEmailFetchAttachmentsCommand(args)
);
const runEmailSendCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/email-send.command.js')).runEmailSendCommand(args)
);
const runEmailAuthCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/email-auth.command.js')).runEmailAuthCommand(args)
);
const runEmailStatusCommand: CommandHandler = async (args: string[]) => (
  (await import('./commands/email-status.command.js')).runEmailStatusCommand(args)
);

async function runLinkedInSubcommand(command: string, args: string[]): Promise<void> {
  return (await import('./commands/linkedin.command.js')).runLinkedInCommand(command, args);
}

async function runInterfoodSubcommand(command: string, args: string[]): Promise<void> {
  return (await import('./commands/interfood.command.js')).runInterfoodCommand(command, args);
}

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
  email: {
    auth: runEmailAuthCommand,
    status: runEmailStatusCommand,
    'list-mailboxes': runEmailListMailboxesCommand,
    list: runEmailListCommand,
    read: runEmailReadCommand,
    'fetch-attachments': runEmailFetchAttachmentsCommand,
    send: runEmailSendCommand,
  },
  stocks: {
    mirror: runStocksMirrorCommand,
  },
  linkedin: {
    configure: (args: string[]) => runLinkedInSubcommand('configure', args),
    auth: (args: string[]) => runLinkedInSubcommand('auth', args),
    doctor: (args: string[]) => runLinkedInSubcommand('doctor', args),
    inbox: (args: string[]) => runLinkedInSubcommand('inbox', args),
    thread: (args: string[]) => runLinkedInSubcommand('thread', args),
    reply: (args: string[]) => runLinkedInSubcommand('reply', args),
    cache: (args: string[]) => runLinkedInSubcommand('cache', args),
  },
  interfood: {
    weeks: (args: string[]) => runInterfoodSubcommand('weeks', args),
    menu: (args: string[]) => runInterfoodSubcommand('menu', args),
    'menu-range': (args: string[]) => runInterfoodSubcommand('menu-range', args),
    auth: (args: string[]) => runInterfoodSubcommand('auth', args),
    orders: (args: string[]) => runInterfoodSubcommand('orders', args),
    foods: (args: string[]) => runInterfoodSubcommand('foods', args),
    preference: (args: string[]) => runInterfoodSubcommand('preference', args),
    plan: (args: string[]) => runInterfoodSubcommand('plan', args),
    nutrition: (args: string[]) => runInterfoodSubcommand('nutrition', args),
    cart: (args: string[]) => runInterfoodSubcommand('cart', args),
    order: (args: string[]) => runInterfoodSubcommand('order', args),
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
    extra: {
      group,
      sub,
      requestId,
      args: group === 'email'
        ? redactEmailCommandArgs(subArgs)
        : group === 'linkedin'
          ? redactLinkedInCommandArgs(subArgs)
          : subArgs,
    },
  });

  try {
    await handler(subArgs);
    await logAction({
      kind: 'external-action',
      summary: `ma ${group} ${sub} ok (${Date.now() - startedAt}ms)`,
      extra: { requestId, group, sub, elapsedMs: Date.now() - startedAt },
    });
  } catch (err: unknown) {
    const message: string = describeEmailError(err);
    const structuredError: EmailToolError | StockMirrorError | LinkedInToolError | InterfoodToolError | null =
      err instanceof EmailToolError
        || err instanceof StockMirrorError
        || err instanceof LinkedInToolError
        || err instanceof InterfoodToolError
        ? err
        : null;
    const code: string = structuredError?.code ?? 'E_FAILED';
    const details: unknown = structuredError !== null
      ? structuredError.details
      : err instanceof Error
        ? { name: err.name, stack: err.stack }
        : undefined;
    writeEnvelope(fail(`${group}.${sub}`, requestId, startedAt, code, message, details), true);
    await logAction({
      kind: 'error',
      summary: group === 'email'
        ? `ma email ${sub} failed: ${redactEmailSensitiveText(message)}`
        : group === 'linkedin'
          ? `ma linkedin ${sub} failed: ${redactLinkedInSensitiveText(message)}`
        : `ma ${group} ${sub} failed: ${message}`,
      extra: {
        requestId,
        group,
        sub,
        code,
        elapsedMs: Date.now() - startedAt,
      },
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
      '  email       Gmail OAuth/API + provider-neutral IMAP/SMTP tools',
      '  stocks      Organizer stock mirror (complete paginated local snapshot)',
      '  linkedin    Official Member Data Portability inbox sync and local reply drafts',
      '  interfood   Public weekly-menu and nutrition reader',
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
  if (group === 'email') {
    process.stdout.write(
      [
        '',
        'ma email — Gmail OAuth/API + provider-neutral IMAP/SMTP tools',
        '',
        'Subcommands:',
        '  auth              One-time Gmail OAuth setup (system browser + loopback callback)',
        '  status            Show Gmail OAuth config/token status without exposing tokens',
        '  list-mailboxes    List IMAP mailbox paths and SPECIAL-USE flags',
        '  list              List/search message metadata without body download',
        '  read              Read parsed text/html content with size limits',
        '  fetch-attachments List or safely download matching attachments',
        '  send              Send an ad-hoc email (Gmail API or SMTP)',
        '',
        'Examples (placeholders only):',
        '  ma email auth --account default --pretty',
        '  ma email status --account default --pretty',
        '  ma email list-mailboxes --account default --pretty',
        '  ma email list --mailbox INBOX --unseen --limit 20 --pretty',
        '  ma email read --mailbox INBOX --uid 123 --pretty',
        '  ma email fetch-attachments --mailbox INBOX --since 2026-08-01 --filename-pattern "\\.pdf$"',
        '  ma email send --to person@example.com --subject "Subject" --body-file C:\\absolute\\body.txt --dry-run',
        '',
        'Configuration: gitignored project-root .env; see .env.example.',
        '',
      ].join('\n'),
    );
    return;
  }
  if (group === 'stocks') {
    process.stdout.write(
      [
        '',
        'ma stocks — Organizer stock tools',
        '',
        'Subcommands:',
        '  mirror   Mirror every Organizer stock and stock-item page to a local JSON snapshot',
        '',
        'Flags:',
        '  --output <path>  Default: current/stock/organizer-mirror.json',
        '  --limit <n>      Organizer page size, 1..1000 (default: 100)',
        '  --timeout <ms>   Per-fo-call timeout, 1..300000 (default: 30000)',
        '  --dry-run        Read and validate every page without replacing the mirror',
        '  --pretty         Pretty-print the JSON envelope',
        '',
        'Examples:',
        '  ma stocks mirror --pretty',
        '  ma stocks mirror --dry-run --pretty',
        '',
      ].join('\n'),
    );
    return;
  }
  if (group === 'linkedin') {
    process.stdout.write(
      [
        '',
        'ma linkedin — official, read-only LinkedIn Member Data Portability integration',
        '',
        'Subcommands:',
        '  configure              Store non-secret credential-source metadata',
        '  auth status            Show local configuration/cache status without reading the token',
        '  doctor                 Verify config, token availability and LinkedIn authorization',
        '  inbox bootstrap        Import the complete historical INBOX snapshot',
        '  inbox sync             Apply incremental Member Change Logs',
        '  inbox list             List cached conversation summaries',
        '  inbox unread           List unread candidates (authoritative only after calibration)',
        '  inbox needs-reply      List threads whose latest known message is inbound',
        '  thread show            Show one cached thread',
        '  reply draft            Save a local reply draft; never sends to LinkedIn',
        '  reply list             List local draft metadata without bodies',
        '  reply show             Show one local reply draft, including its body',
        '  reply delete           Delete one local reply draft with explicit --confirm',
        '  cache purge            Delete cached messages/drafts with explicit --confirm',
        '',
        'Examples:',
        '  ma linkedin configure --pretty',
        '  ma linkedin configure --credential-source fdp-keystore --fdp-project PROJECT --fdp-environment ENV --pretty',
        '  ma linkedin doctor --pretty',
        '  ma linkedin inbox bootstrap --pretty',
        '  ma linkedin inbox bootstrap --dry-run --pretty',
        '  ma linkedin inbox sync --pretty',
        '  ma linkedin inbox needs-reply --limit 20 --pretty',
        '  ma linkedin thread show --id THREAD_ID --pretty',
        '  ma linkedin reply draft --thread THREAD_ID --body-file C:\\absolute\\reply.txt --pretty',
        '',
        'Security: the default token source is the gitignored project-root .env; token values are never logged.',
        'Limitation: the official personal-member API is read-only; sending remains a manual LinkedIn action.',
        '',
      ].join('\n'),
    );
    return;
  }
  if (group === 'interfood') {
    process.stdout.write(
      [
        '',
        'ma interfood — Interfood weekly-menu and nutrition tools',
        '',
        'Subcommands:',
        '  weeks          List the current and published order weeks',
        '  menu           Read one normalized weekly menu (defaults to current week)',
        '  menu-range     Read the current and following weeks (default: 3)',
        '',
        'Examples:',
        '  ma interfood weeks --pretty',
        '  ma interfood menu --pretty',
        '  ma interfood menu --year 2026 --week 37 --pretty',
        '  ma interfood menu-range --weeks 3 --pretty',
        '',
        '  ma interfood auth status|start --pretty',
        '  ma interfood orders sync|list|week|coverage|patterns [--add-ons-only] [--summary] --pretty',
        '  ma interfood foods identify|list [--commit] [--summary] --pretty',
        '  ma interfood preference set|compare|portion|list --pretty',
        '  ma interfood plan week [--meals-per-day 2] [--repetition-windows 7,14,28] [--summary] --pretty',
        '  ma interfood nutrition compare --ids 35853,35859 --pretty',
        '  ma interfood cart show|add|set|subtract|remove|clear|diff|reconcile --pretty',
        '  ma interfood order show|check|change-preview|change-apply --pretty',
        '',
        'Public menu reads need no login. Account commands use one persistent dedicated UBH profile.',
        '',
      ].join('\n'),
    );
    return;
  }
  printHelp();
}

main().catch(async (err: unknown) => {
  const message: string = describeEmailError(err);
  const stack: string | undefined = err instanceof Error ? err.stack : undefined;
  process.stderr.write(`[ma] FATAL: ${stack ?? message}\n`);
  await logAction({
    kind: 'error',
    summary: `ma FATAL (main rejection): ${persistentErrorText(message)}`,
    extra: {
      stack: stack ? persistentErrorText(stack) : undefined,
      name: err instanceof Error ? err.name : 'UnknownError',
    },
  });
  process.exit(1);
});

/** Email invocation runtime-errorjaiból a tracked action-log előtt adatot redaktálunk. */
function persistentErrorText(text: string): string {
  if (process.argv[2] === 'email') {
    return redactEmailSensitiveText(text);
  }
  if (process.argv[2] === 'linkedin') {
    return redactLinkedInSensitiveText(text);
  }
  return text;
}

/** src/ és dist/cli/src/ futtatásból is ugyanazt a projekt-root `.env`-et találja meg. */
function resolveProjectEnvPath(startDirectory: string): string {
  let directory: string = startDirectory;
  for (let depth: number = 0; depth < 8; depth += 1) {
    if (existsSync(resolve(directory, '__agent')) && existsSync(resolve(directory, 'package.json'))) {
      return resolve(directory, '.env');
    }
    const parent: string = dirname(directory);
    if (parent === directory) {
      break;
    }
    directory = parent;
  }
  return resolve(startDirectory, '..', '..', '.env');
}
