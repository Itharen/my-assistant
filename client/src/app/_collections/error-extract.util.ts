// Error-detail extractor. Normalises *any* incoming error type — DyFM_Error,
// Angular HttpErrorResponse, plain Error, string, unknown — into a stable
// shape with debug-level information. Consumed by `A_Error_ControlService`
// and the global ErrorHandler. NEVER returns `[object Object]`.

import { HttpErrorResponse } from '@angular/common/http';

import { DyFM_Error } from '@futdevpro/fsm-dynamo';

/** Normalizált error részletek a kliens-oldali error pipeline-hoz — `A_ErrorExtract_Util.extract` outputja. */
export interface A_ErrorDetails_Interface {
  /** Human-readable description, debug-level (joins all sub-messages). */
  message: string;
  /** Unique, grep-able error code. */
  errorCode: string;
  /** Full stack chain (may include "Caused by:" layers). */
  stack?: string;
  /** State snapshot from the original throw site. */
  additionalContent?: unknown;
  /** Where the error surfaced from (route URL, component name, etc.). */
  source: string;
  /** HTTP status if applicable. */
  httpStatus?: number;
  /** Original error reference for downstream consumers. */
  raw: unknown;
}

/** Static util — bármilyen hibatípust normalizál egy stabil `A_ErrorDetails_Interface` shape-be. */
export class A_ErrorExtract_Util {

  /** Bármilyen `unknown` hibát normalizál egy stabil A_ErrorDetails_Interface shape-be. */
  static extract(err: unknown, source: string = 'client'): A_ErrorDetails_Interface {
    if (DyFM_Error.isDyFMError(err)) {
      return {
        message: DyFM_Error.getErrorMessage(err) || 'DyFM_Error without message',
        errorCode: DyFM_Error.getErrorCode(err) || 'NO-CODE',
        stack: DyFM_Error.getErrorStack(err),
        additionalContent: (err).additionalContent,
        source,
        raw: err,
      };
    }

    if (err instanceof HttpErrorResponse) {
      return A_ErrorExtract_Util.fromHttpError(err, source);
    }

    if (err instanceof Error) {
      return {
        message: err.message || err.name || 'Error without message',
        errorCode: err.name || 'JS-ERROR',
        stack: err.stack,
        source,
        raw: err,
      };
    }

    if (typeof err === 'string') {
      return {
        message: err,
        errorCode: 'STRING-ERROR',
        source,
        raw: err,
      };
    }

    // Last resort — stringify whatever it is, never let `[object Object]`
    // through. JSON.stringify with the `safeReplacer` handles cycles.
    return {
      message: A_ErrorExtract_Util.safeStringify(err) || 'Unknown error',
      errorCode: 'UNKNOWN-ERROR',
      source,
      raw: err,
    };
  }

  private static fromHttpError(err: HttpErrorResponse, source: string): A_ErrorDetails_Interface {
    const body: Record<string, unknown> | string | null | undefined =
      err.error as Record<string, unknown> | string | null | undefined;

    // Server-side DyFM_Error fields may travel in the body under various shapes.
    if (body && typeof body === 'object') {
      const dyfm: Record<string, unknown> = body;
      const subMessage: string =
        (typeof dyfm['_message'] === 'string' && dyfm['_message']) ||
        (typeof dyfm['message'] === 'string' && dyfm['message']) ||
        '';
      const errorCode: string =
        (typeof dyfm['_errorCode'] === 'string' && dyfm['_errorCode']) ||
        (typeof dyfm['errorCode'] === 'string' && dyfm['errorCode']) ||
        'HTTP-' + err.status;
      const stack: string | undefined = typeof dyfm['stack'] === 'string' ? dyfm['stack'] : undefined;
      const additional: unknown = dyfm['additionalContent'] ?? dyfm;

      return {
        message: `${err.status} ${err.statusText}${subMessage ? ': ' + subMessage : ''}`,
        errorCode,
        stack,
        additionalContent: additional,
        source,
        httpStatus: err.status,
        raw: err,
      };
    }

    return {
      message: `${err.status} ${err.statusText}${typeof body === 'string' && body ? ': ' + body : ''}`,
      errorCode: 'HTTP-' + err.status,
      source,
      httpStatus: err.status,
      raw: err,
    };
  }

  private static safeStringify(v: unknown): string {
    try {
      return JSON.stringify(v, A_ErrorExtract_Util.cycleSafeReplacer());
    } catch {
      return String(v);
    }
  }

  private static cycleSafeReplacer(): (key: string, value: unknown) => unknown {
    const seen = new WeakSet<object>();

    return (_key: string, value: unknown): unknown => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }

      return value;
    };
  }
}
