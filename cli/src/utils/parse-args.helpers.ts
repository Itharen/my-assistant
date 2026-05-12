// Parse-args helperek — a `node:util` parseArgs API tetejére vékony rétegek.
// A subcommand-fájlok ezeket használják az option-érték normalizációhoz.

export function numericOption(raw: unknown, fallback: number | undefined): number | undefined {
  if (typeof raw !== 'string') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function stringOption(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

export function parseList(raw: unknown): string[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    const flat = raw
      .flatMap((v) => (typeof v === 'string' ? v.split(',') : []))
      .map((s) => s.trim())
      .filter(Boolean);
    return flat.length > 0 ? flat : undefined;
  }
  if (typeof raw === 'string') {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : undefined;
  }
  return undefined;
}

export function onLogFor(prefix: string, verbose: boolean): ((m: string) => void) | undefined {
  if (!verbose) return undefined;
  return (msg: string) => process.stderr.write(`[${prefix}] ${msg}\n`);
}
