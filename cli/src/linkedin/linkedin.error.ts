const SECRET_PATTERNS: RegExp[] = [
  /Bearer\s+[A-Za-z0-9._~+\/=\-]+/giu,
  /(?:access[_-]?token|client[_-]?secret)\s*[=:]\s*[^\s,;]+/giu,
];

export class LinkedInToolError extends Error {
  public readonly code: string;
  public readonly details: Record<string, unknown>;

  public constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(redactLinkedInSensitiveText(message));
    this.name = 'LinkedInToolError';
    this.code = code;
    this.details = sanitizeDetails(details);
  }
}

export function redactLinkedInSensitiveText(text: string): string {
  return SECRET_PATTERNS.reduce(
    (redacted: string, pattern: RegExp) => redacted.replace(pattern, '[REDACTED]'),
    text,
  );
}

export function redactLinkedInCommandArgs(args: string[]): string[] {
  const sensitiveValueFlags: Set<string> = new Set<string>(['--body-file', '--id', '--self-id', '--thread']);
  const output: string[] = [];
  let redactNext: boolean = false;
  for (const argument of args) {
    if (redactNext) {
      output.push('[REDACTED]');
      redactNext = false;
      continue;
    }
    output.push(argument);
    redactNext = sensitiveValueFlags.has(argument);
  }
  return output;
}

function sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    output[key] = sanitizeValue(key, value);
  }
  return output;
}

function sanitizeValue(key: string, value: unknown): unknown {
  const normalizedKey: string = key.toLowerCase();
  if (normalizedKey.includes('token') || normalizedKey.includes('secret') || normalizedKey === 'authorization') {
    return '[REDACTED]';
  }
  if (typeof value === 'string') {
    return redactLinkedInSensitiveText(value);
  }
  if (Array.isArray(value)) {
    return value.map((item: unknown) => sanitizeValue('', item));
  }
  if (typeof value === 'object' && value !== null) {
    return sanitizeDetails(Object.fromEntries(Object.entries(value)));
  }
  return value;
}
