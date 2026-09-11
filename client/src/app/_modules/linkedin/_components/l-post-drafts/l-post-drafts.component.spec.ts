// A poszt-piszkozat panel tesztjei.
//
// ⭐ A NÉGY ÁLLÍTÁS, AMI A FELÜLETRE VONATKOZIK:
//   (a) ⛔ **egyetlen hiba sem néma** — a betöltés, a vágólap és a mentés bukása is látszik;
//   (b) a jelölés után a **szerver friss listája** rajzol újra, ⛔ nem a saját feltevésünk;
//   (c) 🔴 **az ÜRES lista KIMONDVA üres** — a szöveget az asszisztens írja, a hiánya nem hiba;
//   (d) 🔴 **a vágólapra a PONTOS szöveg megy** — ⛔ a panel nem alakít rajta semmit.

import type { LinkedInPostDraft, LinkedInPostDraftsPlan } from '@server-models';
import { L_PostDrafts_Component } from './l-post-drafts.component';

/** Egy piszkozat a teszthez. */
function draft(overrides: Partial<LinkedInPostDraft> = {}): LinkedInPostDraft {
  return {
    id: '2026-09-11-teszt',
    title: '2026-09-11 — Teszt poszt',
    body: 'A poszt szövege.',
    length: 16,
    limit: 3000,
    isOverLimit: false,
    why: '',
    status: '',
    isPosted: false,
    ...overrides,
  };
}

/** Egy lista a teszthez. */
function plan(drafts: LinkedInPostDraft[]): LinkedInPostDraftsPlan {
  return {
    drafts: drafts,
    draftCount: drafts.length,
    postedCount: drafts.filter((item: LinkedInPostDraft): boolean => item.isPosted).length,
    overLimitCount: drafts.filter((item: LinkedInPostDraft): boolean => item.isOverLimit).length,
    hasDrafts: drafts.length > 0,
    draftsPath: 'current/linkedin/post-drafts',
  };
}

/**
 * Az adat-réteg utánzata.
 *
 * ⭐ A komponens **szűk szerződést** kér *(`PostDraftsGateway`)*, ezért itt egy egyszerű
 * objektum elég — ⛔ egyetlen `as` átcímkézés sem kell.
 */
function gateway(overrides: {
  getPostDrafts?: () => Promise<LinkedInPostDraftsPlan>;
  markPostDraftPosted?: (request: { id: string; isPosted: boolean }) => Promise<LinkedInPostDraftsPlan>;
}): {
  getPostDrafts(): Promise<LinkedInPostDraftsPlan>;
  markPostDraftPosted(request: { id: string; isPosted: boolean }): Promise<LinkedInPostDraftsPlan>;
} {
  return {
    getPostDrafts: overrides.getPostDrafts
      ?? ((): Promise<LinkedInPostDraftsPlan> => Promise.resolve(plan([]))),
    markPostDraftPosted: overrides.markPostDraftPosted
      ?? ((): Promise<LinkedInPostDraftsPlan> => Promise.resolve(plan([]))),
  };
}

/** A vágólap utánzata — RÖGZÍTI, mit írtunk rá. */
function stubClipboard(): { written: string[]; restore: () => void } {
  const written: string[] = [];
  const original: unknown = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string): Promise<void> => {
        written.push(text);
      },
    },
  });

  return {
    written: written,
    restore: (): void => {
      if (original && typeof original === 'object') {
        Object.defineProperty(navigator, 'clipboard', original);
      }
    },
  };
}

describe('| L_PostDrafts_Component — a betöltés', () => {

  it('betöltéskor lekéri a listát', async (): Promise<void> => {
    const component = new L_PostDrafts_Component(gateway({
      getPostDrafts: (): Promise<LinkedInPostDraftsPlan> => Promise.resolve(plan([draft()])),
    }));

    await component.refresh();

    expect(component.drafts_$().length).toBe(1);
    expect(component.error_$()).toBeNull();
  });

  it('⛔ a betöltési hiba NEM néma — a felületen is látszik', async (): Promise<void> => {
    const component = new L_PostDrafts_Component(gateway({
      getPostDrafts: (): Promise<LinkedInPostDraftsPlan> => Promise.reject(new Error('nincs szerver')),
    }));

    await component.refresh();

    expect(component.error_$()).toContain('nem olvashatók');
    expect(component.loading_$()).toBeFalse();
  });

  it('🔴 az ÜRES listát KIMONDJA — ⛔ nem néz ki elromlottnak', async (): Promise<void> => {
    const component = new L_PostDrafts_Component(gateway({}));

    await component.refresh();

    expect(component.drafts_$()).toEqual([]);
    // ⭐ „Még nincs piszkozat." — a haladás-szöveg mondja ki, nem a csend.
    expect(component.progressLabel_$()).toContain('Még nincs');
    // ⛔ És ez NEM hiba: hibaüzenet nem jár vele.
    expect(component.error_$()).toBeNull();
  });

  it('a haladás a kiküldött / összes posztot mutatja', async (): Promise<void> => {
    const component = new L_PostDrafts_Component(gateway({
      getPostDrafts: (): Promise<LinkedInPostDraftsPlan> => Promise.resolve(plan([
        draft({ id: 'a', isPosted: true }),
        draft({ id: 'b' }),
      ])),
    }));

    await component.refresh();

    expect(component.progressLabel_$()).toBe('1 / 2 poszt kiküldve');
  });
});

describe('| L_PostDrafts_Component — a vágólap', () => {

  it('🔴 a PONTOS szöveget másolja — ⛔ a panel nem alakít rajta', async (): Promise<void> => {
    const clipboard = stubClipboard();
    const body: string = 'Első sor.\n\nMásodik — „idézettel" 🚀';
    const component = new L_PostDrafts_Component(gateway({}));

    try {
      await component.copyDraft(draft({ body: body }));

      expect(clipboard.written).toEqual([body]);
      expect(component.copiedId_$()).toBe('2026-09-11-teszt');
    } finally {
      clipboard.restore();
    }
  });

  it('⛔ az ÜRES piszkozatot nem másolja, és ezt KIMONDJA', async (): Promise<void> => {
    const clipboard = stubClipboard();
    const component = new L_PostDrafts_Component(gateway({}));

    try {
      await component.copyDraft(draft({ body: '' }));

      expect(clipboard.written).toEqual([]);
      expect(component.error_$()).toContain('üres');
    } finally {
      clipboard.restore();
    }
  });

  it('🔴 ha a vágólap NEM érhető el, azt KIMONDJA — ⛔ nem tesz úgy, mintha másolt volna', async (): Promise<void> => {
    // ⚠️ A néma „siker" itt azt jelentené, hogy az owner ÜRES vágólapot illeszt a LinkedIn-re.
    const original: unknown = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });

    const component = new L_PostDrafts_Component(gateway({}));

    try {
      await component.copyDraft(draft());

      expect(component.error_$()).toContain('másold kézzel');
      expect(component.copiedId_$()).toBeNull();
    } finally {
      if (original && typeof original === 'object') {
        Object.defineProperty(navigator, 'clipboard', original);
      }
    }
  });
});

describe('| L_PostDrafts_Component — a „kiposztoltam" jelölés', () => {

  it('⭐ a SZERVER friss listájával rajzol újra — ⛔ nem a saját feltevésből', async (): Promise<void> => {
    const component = new L_PostDrafts_Component(gateway({
      markPostDraftPosted: (): Promise<LinkedInPostDraftsPlan> => Promise.resolve(
        plan([draft({ isPosted: true })]),
      ),
    }));

    await component.togglePosted(draft());

    expect(component.drafts_$()[0]?.isPosted).toBeTrue();
    expect(component.error_$()).toBeNull();
  });

  it('a jelölést MEGFORDÍTVA küldi — a kipipált visszakapcsolható', async (): Promise<void> => {
    // ⚠️ TOMBBE gyujtjuk, ⛔ nem `let … | null`-ba: az utobbit a fordito `null`-ra szukiti
    // (a hozzarendeles egy lezaraszban tortenik), es a `toEqual` tipusa elromlik.
    const sent: { id: string; isPosted: boolean }[] = [];
    const component = new L_PostDrafts_Component(gateway({
      markPostDraftPosted: (request: { id: string; isPosted: boolean }): Promise<LinkedInPostDraftsPlan> => {
        sent.push(request);

        return Promise.resolve(plan([]));
      },
    }));

    await component.togglePosted(draft({ isPosted: true }));

    expect(sent).toEqual([{ id: '2026-09-11-teszt', isPosted: false }]);
  });

  it('⛔ a mentési hiba NEM néma — a haladás elvesztése LÁTSZIK', async (): Promise<void> => {
    const component = new L_PostDrafts_Component(gateway({
      markPostDraftPosted: (): Promise<LinkedInPostDraftsPlan> => Promise.reject(new Error('lemez')),
    }));

    await component.togglePosted(draft());

    expect(component.error_$()).toContain('nem menthető');
  });
});
