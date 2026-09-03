import { InterfoodToolError } from './interfood.error.js';
import { InterfoodMenuRange, InterfoodMenuWeek, InterfoodWeek } from './interfood.models.js';
import { normalizeInterfoodMenu } from './interfood.normalizer.js';

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type JsonObject = Record<string, unknown>;

export interface InterfoodApiClientOptions {
  baseUrl?: string;
  fetch?: FetchLike;
  timeoutMs?: number;
}

export class InterfoodApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(options: InterfoodApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? 'https://ia.interfood.hu').replace(/\/$/, '');
    this.fetchImpl = options.fetch ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  async getWeeks(): Promise<InterfoodWeek[]> {
    const response: JsonObject = await this.request('/api/v1/weeks');
    if (!Array.isArray(response.data)) {
      throw new InterfoodToolError('MA-INTERFOOD-SCHEMA', 'Interfood weeks response has no data array.');
    }
    return response.data.map((value: unknown): InterfoodWeek => {
      const row: JsonObject = object(value, 'week');
      return {
        year: integer(row.year, 'week.year'),
        week: integer(row.week, 'week.week'),
        disabled: row.disabled === true,
        message: text(row.fake_message),
      };
    });
  }

  async getCurrentWeek(): Promise<{ year: number; week: number }> {
    const response: JsonObject = await this.request('/api/v1/current-week');
    const data: JsonObject = object(response.data, 'current-week.data');
    return { year: integer(data.year, 'current-week.year'), week: integer(data.week, 'current-week.week') };
  }

  async getMenu(year: number, week: number): Promise<InterfoodMenuWeek> {
    const response: JsonObject = await this.request('/api/v1/menu', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        year,
        week,
        seek_labels: [],
        ignore_labels: [],
        seek_ingredients: [],
        ignore_ingredients: [],
        calorie: { min: 0, max: 10_000 },
        carb: { min: 0, max: 1_000 },
        protein: { min: 0, max: 1_000 },
        fat: { min: 0, max: 1_000 },
        price: { min: 0, max: 9_000 },
        favorites: false,
        last_minute: false,
      }),
    });
    return normalizeInterfoodMenu(response, year, week);
  }

  async getMenuRange(requestedWeeks: number): Promise<InterfoodMenuRange> {
    if (!Number.isInteger(requestedWeeks) || requestedWeeks < 1 || requestedWeeks > 8) {
      throw new InterfoodToolError(
        'MA-INTERFOOD-OPTION',
        '--weeks must be an integer between 1 and 8.',
        { requestedWeeks },
      );
    }
    const [currentWeek, availableWeeks] = await Promise.all([this.getCurrentWeek(), this.getWeeks()]);
    const selected: InterfoodWeek[] = availableWeeks
      .filter((candidate: InterfoodWeek) => !candidate.disabled && compareWeek(candidate, currentWeek) >= 0)
      .sort(compareWeek)
      .slice(0, requestedWeeks);
    const menus: InterfoodMenuWeek[] = await Promise.all(
      selected.map((candidate: InterfoodWeek) => this.getMenu(candidate.year, candidate.week)),
    );
    const complete: boolean = menus.length === requestedWeeks;
    return {
      requestedWeeks,
      returnedWeeks: menus.length,
      complete,
      currentWeek,
      weeks: menus,
      warning: complete
        ? null
        : `Only ${menus.length} enabled week(s) are currently available from the current week.`,
    };
  }

  private async request(path: string, init?: RequestInit): Promise<JsonObject> {
    const abort: AbortController = new AbortController();
    const timer: NodeJS.Timeout = setTimeout(() => abort.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, { ...init, signal: abort.signal });
    } catch (error: unknown) {
      throw new InterfoodToolError(
        'MA-INTERFOOD-NETWORK',
        `Interfood request failed for ${path}.`,
        { cause: error instanceof Error ? error.message : String(error), timeoutMs: this.timeoutMs },
      );
    } finally {
      clearTimeout(timer);
    }
    const raw: string = await response.text();
    if (!response.ok) {
      throw new InterfoodToolError(
        'MA-INTERFOOD-HTTP',
        `Interfood returned HTTP ${response.status} for ${path}.`,
        { status: response.status, path, responseBody: raw.slice(0, 2_000) },
      );
    }
    try {
      return object(JSON.parse(raw) as unknown, `${path} response`);
    } catch (error: unknown) {
      if (error instanceof InterfoodToolError) throw error;
      throw new InterfoodToolError('MA-INTERFOOD-SCHEMA', `Interfood returned invalid JSON for ${path}.`, {
        cause: error instanceof Error ? error.message : String(error),
        responseBody: raw.slice(0, 2_000),
      });
    }
  }
}

function compareWeek(
  left: { year: number; week: number },
  right: { year: number; week: number },
): number {
  return left.year - right.year || left.week - right.week;
}

function object(value: unknown, label: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new InterfoodToolError('MA-INTERFOOD-SCHEMA', `${label} is not an object.`, { value });
  }
  return value as JsonObject;
}

function integer(value: unknown, label: string): number {
  const parsed: number = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed)) {
    throw new InterfoodToolError('MA-INTERFOOD-SCHEMA', `${label} is not an integer.`, { value });
  }
  return parsed;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
