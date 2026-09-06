// `ma ccap <subcommand>` — a CCAP-integráció parancsai.
//
// Subcommandok:
//   whoami   — melyik CC session vagyok a CCAP-ban (futásidejű feloldás)
//   runtime  — foglalt vagyok-e most; hány elem áll a CCAP sorában
//
// Ezek a Discord-híd alapkövei: a híd ezekből tudja meg, KINEK küldjön, és MIKOR.

import { parseArgs } from 'node:util';

import { CcapApiClient } from '../ccap/ccap.api-client.js';
import { CcapError } from '../ccap/ccap.error.js';
import { resolveSelfIdentity } from '../ccap/ccap.identity.js';
import { fail, makeRequestId, ok, writeEnvelope } from '../output/envelope.js';

type CcapSubcommand = 'whoami' | 'runtime';

const SUBCOMMAND_HELP: string = [
  'ma ccap — CCAP CC-session integráció',
  '',
  'Subcommands:',
  '  whoami    Melyik CC session vagyok a CCAP-ban (futásidejű feloldás)',
  '  runtime   Foglalt vagyok-e most; a CCAP sorának állapota',
  '',
  'Options:',
  '  --pretty        Pretty-print JSON envelope',
  '  --session <id>  Explicit CC session azonosító (csak `runtime`; default: önmagam)',
  '',
].join('\n');

export async function runCcapCommand(subcommand: string, args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const parsed = parseArgs({
    args,
    options: {
      pretty: { type: 'boolean' },
      session: { type: 'string' },
      help: { type: 'boolean' },
    },
    strict: false,
  });
  const pretty: boolean = Boolean(parsed.values.pretty);

  if (parsed.values.help) {
    process.stdout.write(SUBCOMMAND_HELP);
    return;
  }

  const action: string = `ccap.${subcommand}`;

  try {
    const result: unknown = await dispatch(subcommand as CcapSubcommand, {
      sessionId: typeof parsed.values.session === 'string' ? parsed.values.session : undefined,
    });

    writeEnvelope(ok(action, requestId, startedAt, result), pretty);
  } catch (err: unknown) {
    // Deskriptív hiba: a `remedy` MINDIG kimegy — a tünet önmagában nem elég (owner, 2026-09-06).
    if (err instanceof CcapError) {
      writeEnvelope(
        fail(action, requestId, startedAt, err.code, err.message, {
          remedy: err.remedy,
          details: err.details,
        }),
        pretty,
      );
      process.exitCode = 1;
      return;
    }

    throw err;
  }
}

async function dispatch(
  subcommand: CcapSubcommand,
  options: { sessionId?: string },
): Promise<unknown> {
  const api: CcapApiClient = new CcapApiClient();

  if (subcommand === 'whoami') {
    return { ...(await resolveSelfIdentity(api)), ccapBaseUrl: api.getBaseUrl() };
  }

  if (subcommand === 'runtime') {
    const sessionId: string = options.sessionId ?? (await resolveSelfIdentity(api)).sessionId;

    return api.inspectRuntime(sessionId);
  }

  throw new CcapError(
    'MA-CCAP-BAD-RESPONSE',
    `Ismeretlen ccap subcommand: "${subcommand}".`,
    'Futtasd: `ma ccap --help`.',
  );
}
