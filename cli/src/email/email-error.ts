/**
 * Strukturált e-mail-tool hiba. A code stabil, grep-elhető contract; a details
 * csak technikai contextust tartalmazhat, levéltartalmat vagy credentialt nem.
 */
export class EmailToolError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  public constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'EmailToolError';
    this.code = code;
    this.details = details;
  }
}

/** Unknown errorból mindig leíró szöveget készít; `[object Object]` fallback nincs. */
export function describeEmailError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    const serialized: string | undefined = JSON.stringify(error);
    return serialized ?? 'Unknown email-tool error';
  } catch (serializeErr) {
    // ⛔ NEM naplozunk es NEM dobunk: ez a fuggveny epp azt csinalja, hogy hibat ir le —
    // ha o maga dobna vagy naplozna, a hivo hibakezelese vegtelen korbe futna. ⭐ Helyette
    // az OKOT betesszuk a VISSZAADOTT szovegbe: igy a hiany ott latszik, ahol a leiras.
    return `Unserializable email-tool error (${String(serializeErr)})`;
  }
}
