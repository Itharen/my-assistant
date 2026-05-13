// Pre-kill helper: kill any process listening on `MA_SERVER_PORT` (default 39245)
// before the server boots. Megoldja az LDP `EADDRINUSE` cycle-eit, amikor egy
// orphan szerver-process tartja a portot (előző LDP run kill-je nem
// propagált a npm → tsx → node láncon).
//
// Cross-platform: Windows (netstat + taskkill) + POSIX (fuser).
// Action-log emit: nem ide tartozik (a server saját error-handler-e fogja
// elkapni ha valami baj van itt).

import { execSync } from 'node:child_process';
import { platform } from 'node:os';

const PORT = Number(process.env.MA_SERVER_PORT ?? 39245);

function killWindows() {
  let out = '';
  try {
    out = execSync(`netstat -ano -p tcp`, { encoding: 'utf8' });
  } catch {
    return;
  }
  const pids = new Set();
  for (const line of out.split('\n')) {
    if (!line.includes(`:${PORT} `) && !line.includes(`:${PORT}\t`)) continue;
    if (!line.includes('LISTENING')) continue;
    const m = line.match(/LISTENING\s+(\d+)/);
    if (m) pids.add(m[1]);
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      process.stderr.write(`[pre-kill-port] killed PID ${pid} on :${PORT}\n`);
    } catch {
      /* may have died already */
    }
  }
}

function killPosix() {
  try {
    execSync(`fuser -k ${PORT}/tcp`, { stdio: 'ignore' });
    process.stderr.write(`[pre-kill-port] killed listeners on :${PORT}\n`);
  } catch {
    /* no listener or fuser missing — OK */
  }
}

try {
  if (platform() === 'win32') killWindows();
  else killPosix();
} catch (err) {
  // Soha ne blokkoljuk a server-startot a pre-kill miatt
  process.stderr.write(`[pre-kill-port] error (continuing): ${err.message}\n`);
}
