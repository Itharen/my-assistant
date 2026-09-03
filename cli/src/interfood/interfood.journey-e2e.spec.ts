import { InterfoodApiClient } from './interfood.api-client.js';
import { InterfoodMenuRange } from './interfood.models.js';
import { menuFixture } from './interfood.test-fixtures.js';

describe('Interfood menu-reading user journey', () => {
  it('discovers the current week, selects future enabled weeks and normalizes every linked menu', async () => {
    const requestedMenuWeeks: number[] = [];
    const api = new InterfoodApiClient({
      fetch: async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const url: string = String(input);
        if (url.endsWith('/api/v1/current-week')) {
          return json({ error: false, data: { year: '2026', week: '36' } });
        }
        if (url.endsWith('/api/v1/weeks')) {
          return json({ data: [
            { year: 2026, week: 35, disabled: false, fake_message: '' },
            { year: 2026, week: 36, disabled: false, fake_message: '' },
            { year: 2026, week: 37, disabled: false, fake_message: '' },
            { year: 2026, week: 38, disabled: false, fake_message: '' },
            { year: 2026, week: 39, disabled: true, fake_message: 'Még nem rendelhető' },
          ] });
        }
        if (url.endsWith('/api/v1/menu')) {
          const body = JSON.parse(String(init?.body)) as { year: number; week: number };
          requestedMenuWeeks.push(body.week);
          return json(menuFixture(35_000 + body.week, `2026-09-${body.week}`, `Étel ${body.week}`));
        }
        return new Response('not found', { status: 404 });
      },
    });

    const range: InterfoodMenuRange = await api.getMenuRange(3);

    expect(requestedMenuWeeks.sort()).toEqual([36, 37, 38]);
    expect(range.complete).toBeTrue();
    expect(range.weeks.map((week) => week.week)).toEqual([36, 37, 38]);
    expect(range.weeks.map((week) => week.items[0]?.foodName)).toEqual(['Étel 36', 'Étel 37', 'Étel 38']);
    expect(range.weeks.every((week) => week.items[0]?.components[0]?.portion.proteinG === 42)).toBeTrue();
  });

  it('returns a visible partial result when fewer future weeks are published', async () => {
    const api = new InterfoodApiClient({
      fetch: async (input: string | URL | Request): Promise<Response> => {
        const url: string = String(input);
        if (url.endsWith('/api/v1/current-week')) return json({ data: { year: 2026, week: 38 } });
        if (url.endsWith('/api/v1/weeks')) return json({ data: [
          { year: 2026, week: 38, disabled: false, fake_message: '' },
          { year: 2026, week: 39, disabled: true, fake_message: 'Még nem rendelhető' },
        ] });
        return json(menuFixture(35038, '2026-09-14', 'Egyetlen hét'));
      },
    });

    const range: InterfoodMenuRange = await api.getMenuRange(3);

    expect(range.complete).toBeFalse();
    expect(range.returnedWeeks).toBe(1);
    expect(range.warning).toContain('Only 1 enabled week');
  });
});

function json(value: unknown): Response {
  return new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } });
}
