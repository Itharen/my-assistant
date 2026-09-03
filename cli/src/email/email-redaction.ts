const EMAIL_ADDRESS_PATTERN: RegExp = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SECRET_ASSIGNMENT_PATTERN: RegExp = /\b(password|pass|token|secret)\s*[:=]\s*[^\s,;]+/gi;

export interface RedactedEmailArgs {
  redacted: true;
  flags: string[];
}

/**
 * Az action-logba e-mail parancsból csak a flag-nevek kerülhetnek. Címzett,
 * subject, body, mailbox, account és fájlútvonal sem perzisztálható oda.
 */
export function redactEmailCommandArgs(args: string[]): RedactedEmailArgs {
  const flags: string[] = args
    .filter((arg: string): boolean => arg.startsWith('--'))
    .map((arg: string): string => arg.split('=', 1)[0] ?? '--redacted');
  return { redacted: true, flags: Array.from(new Set(flags)).sort() };
}

/** E-mail címeket és tipikus secret-értékeket eltávolít a perzisztált hiba-szövegből. */
export function redactEmailSensitiveText(text: string): string {
  return text
    .replace(EMAIL_ADDRESS_PATTERN, '<redacted-email>')
    .replace(SECRET_ASSIGNMENT_PATTERN, '$1=<redacted-secret>');
}
