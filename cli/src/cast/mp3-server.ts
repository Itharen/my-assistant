// Minimális, egyszer-használatos HTTP server az MP3 buffer kiszolgálására.
// A Cast hangszóró egyszer letölti az MP3-at, mi pedig a play után leállítjuk.
//
// FONTOS: a server URL-t az a hangszóró kell hogy elérje, amelyiken játsszuk.
// Több network interface esetén a **target hangszóró subnet-jébe eső** saját
// IP-t választjuk — különben a hangszóró az URL-t nem éri el.

import { createServer, type Server } from 'node:http';
import { type AddressInfo } from 'node:net';
import { networkInterfaces } from 'node:os';

export interface Mp3ServerHandle {
  url: string;
  port: number;
  boundIp: string;
  close: () => Promise<void>;
}

export interface StartOptions {
  buffer: Buffer;
  targetIp?: string;
  preferIp?: string;
}

export async function startMp3Server(opts: StartOptions): Promise<Mp3ServerHandle> {
  const { buffer, targetIp, preferIp } = opts;

  const server: Server = createServer((_req, res) => {
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(buffer.length),
      'Cache-Control': 'no-store',
      'Accept-Ranges': 'bytes',
    });
    res.end(buffer);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '0.0.0.0', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });

  const addr = server.address() as AddressInfo;
  const ip = preferIp ?? pickLanIp(targetIp);
  const url = `http://${ip}:${addr.port}/audio.mp3`;

  return {
    url,
    port: addr.port,
    boundIp: ip,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

// Választ egy LAN IP-t. Ha `targetIp` adott, **subnet-match** alapján a vele
// azonos szegmensre eső interface-t preferálja. Ha nincs target vagy nincs
// match, a "valódi" (nem-virtuális nevű) interface-t választja first-match-ben.
export function pickLanIp(targetIp?: string): string {
  const candidates = collectIPv4();

  if (candidates.length === 0) {
    throw new Error('No non-loopback IPv4 interface found — Cast hangszóró nem fogja elérni az MP3 server-t.');
  }

  if (targetIp) {
    const match = candidates.find((c) => sameSubnet(c.address, c.netmask, targetIp));
    if (match) return match.address;
  }

  const nonVirtual = candidates.find((c) => !isVirtualName(c.name));
  return (nonVirtual ?? candidates[0]!).address;
}

function collectIPv4(): Array<{ name: string; address: string; netmask: string }> {
  const ifs = networkInterfaces();
  const out: Array<{ name: string; address: string; netmask: string }> = [];
  for (const [name, list] of Object.entries(ifs)) {
    if (!list) continue;
    for (const addr of list) {
      if (addr.family === 'IPv4' && !addr.internal) {
        out.push({ name, address: addr.address, netmask: addr.netmask });
      }
    }
  }
  return out;
}

function sameSubnet(localIp: string, netmask: string, targetIp: string): boolean {
  const a = ipToNum(localIp);
  const m = ipToNum(netmask);
  const t = ipToNum(targetIp);
  if (a === null || m === null || t === null) return false;
  return (a & m) === (t & m);
}

function ipToNum(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const x = Number(p);
    if (!Number.isInteger(x) || x < 0 || x > 255) return null;
    n = (n << 8) | x;
  }
  return n >>> 0;
}

function isVirtualName(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes('vmnet') ||
    n.includes('vboxnet') ||
    n.includes('virtualbox') ||
    n.includes('vethernet') ||
    n.includes('hyper-v') ||
    n.includes('wsl') ||
    n.includes('docker') ||
    n.includes('vmware')
  );
}
