// Cast hangszórók felfedezése a lokál hálózaton mDNS-en (`_googlecast._tcp`).
//
// FONTOS: Windows-on tipikusan **több hálózati interface** van (Wi-Fi, Ethernet,
// virtuálisak: Hyper-V, VMware, WSL, VirtualBox). A bonjour-service / multicast-dns
// alapból **csak egy** interface-en megy ki, ami sokszor a virtuális adapter.
// → Ezért **minden** non-loopback IPv4 interface-en parallel futtatjuk a
//   discovery-t, és aggregáljuk a találatokat.

import { Bonjour, type Service } from 'bonjour-service';
import { networkInterfaces } from 'node:os';
import { safeCall } from './internal/safe-call.js';

export interface CastDevice {
  name: string;
  host: string;
  address: string;
  port: number;
  txt: Record<string, string>;
  discoveredOn?: string;
}

export interface NetIface {
  name: string;
  address: string;
  netmask: string;
  cidr: string;
}

export interface DiscoverOptions {
  timeoutMs?: number;
  interfaces?: string[];
  onLog?: (msg: string) => void;
}

export function listIPv4Interfaces(): NetIface[] {
  const ifs = networkInterfaces();
  const out: NetIface[] = [];
  for (const [name, list] of Object.entries(ifs)) {
    if (!list) continue;
    for (const addr of list) {
      if (addr.family === 'IPv4' && !addr.internal) {
        out.push({
          name,
          address: addr.address,
          netmask: addr.netmask,
          cidr: addr.cidr ?? '',
        });
      }
    }
  }
  return out;
}

export async function discoverCastDevices(opts: DiscoverOptions = {}): Promise<CastDevice[]> {
  const { timeoutMs = 4000, interfaces, onLog } = opts;
  const ifaceIps = interfaces ?? listIPv4Interfaces().map((i) => i.address);

  if (ifaceIps.length === 0) {
    onLog?.('No non-loopback IPv4 interface found — discovery cannot run.');
    return [];
  }

  onLog?.(`Discovery on ${ifaceIps.length} interface(s): ${ifaceIps.join(', ')}`);

  const found = new Map<string, CastDevice>();

  const runOne = (ifaceIp: string): Promise<void> =>
    new Promise((resolve) => {
      let bonjour: Bonjour;
      try {
        // A bonjour-service `opts`-ot átadja a multicast-dns-nek, ami támogatja
        // az `interface` mezőt — a TS típus nem exposolja, ezért cast kell.
        bonjour = new Bonjour({ interface: ifaceIp } as never);
      } catch (err) {
        onLog?.(`[${ifaceIp}] Bonjour init failed: ${(err as Error).message}`);
        resolve();
        return;
      }

      const browser = bonjour.find({ type: 'googlecast' }, (svc: Service) => {
        const addresses = (svc as Service & { addresses?: string[] }).addresses ?? [];
        const ipv4 = addresses.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
        if (!ipv4) return;

        const txt = (svc.txt as Record<string, string> | undefined) ?? {};
        const friendly = txt.fn ?? svc.name;

        const key = `${ipv4}:${svc.port}`;
        if (!found.has(key)) {
          onLog?.(`[${ifaceIp}] found "${friendly}" at ${ipv4}:${svc.port}`);
          found.set(key, {
            name: friendly,
            host: svc.host ?? '',
            address: ipv4,
            port: svc.port,
            txt,
            discoveredOn: ifaceIp,
          });
        }
      });

      setTimeout(() => {
        safeCall(() => browser.stop(), 'mdns.browser.stop');
        safeCall(() => bonjour.destroy(), 'mdns.bonjour.destroy');
        resolve();
      }, timeoutMs);
    });

  await Promise.all(ifaceIps.map(runOne));

  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
}
