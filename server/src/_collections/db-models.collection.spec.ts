// `.js` kiterjesztes: a projekt ESM (`"type": "module"`), es a specek plain node ESM alatt
// futnak (jasmine) — ott a kiterjesztes KOTELEZO. Ugyanez a minta a `sleep-state.service.spec.ts`-ben.
import { myAssistant_dbModels } from './db-models.collection.js';

/**
 * DB-model REGISZTRÁCIÓS INTEGRITÁS guard
 *
 * @description MIÉRT: a Dynamo data-service konstrukciója HIBÁVAL dől el (`DyNTS-DS0-C00`), ha egy
 *   regisztrált data-model olyan `dependencyDataName`-et hivatkozik, ami NINCS regisztrálva
 *   ugyanabban a listában. Ez a hiba **csak futásidőben, az adott endpoint első hívásakor**
 *   jelentkezik — a build, a `tsc` és a többi unit-teszt közben ZÖLD marad.
 *
 *   A my-assistant PONTOSAN ebben az állapotban volt (2026-08-10): a `feedback` + `feedbackVote`
 *   regisztrálva volt, az `account` gyökér viszont **nem** — miközben mindkettő hivatkozik rá.
 *   A hibát ELFEDTE a kliens-oldali `apiBaseUrl: ''` defekt (a hívások a SPA-catch-all-ra mentek,
 *   a szerverig el sem jutottak). A kliens javításával a 500 magától előjött volna.
 *
 *   A flotta már kétszer belefutott ugyanebbe (adventor + master-prompter + helocia élesben).
 */
describe('| myAssistant_dbModels (regisztracios integritas)', (): void => {

  /** A regisztrált dataName-ek — a függőség-feloldás ehhez a készlethez történik. */
  const registeredNames: string[] = myAssistant_dbModels.map((params): string => params.dataName);

  it('| a lista NEM URES (vacuity-guard: ures listan minden alabbi allitas trivialisan atmenne)', (): void => {
    expect(registeredNames.length).toBeGreaterThan(3);
  });

  it('| MINDEN deklaralt `dependencyDataName` regisztralva van (DyNTS-DS0-C00 bug-osztaly)', (): void => {
    const missing: string[] = [];

    for (const params of myAssistant_dbModels) {
      for (const propertyKey of Object.keys(params.properties ?? {})) {
        const dependency: string | undefined = params.properties[propertyKey]?.dependencyDataName;
        if (dependency && !registeredNames.includes(dependency)) {
          missing.push(`${params.dataName}.${propertyKey} → "${dependency}"`);
        }
      }
    }

    // Ha ez bukik: vedd fel a hianyzo `*_dataParams`-t a `myAssistant_dbModels` listaba — kulonben
    // az adott domain MINDEN endpointja 500-at ad elesben (a build es a tobbi teszt zold marad).
    expect(missing).toEqual([]);
  });

  it('| a dataName-ek EGYEDIEK (a Dynamo createDBService first-wins SILENT SKIP-je ellen)', (): void => {
    const duplicates: string[] = registeredNames.filter(
      (name: string, index: number): boolean => registeredNames.indexOf(name) !== index,
    );

    expect(duplicates).toEqual([]);
  });

  it('| minden regisztralt elemnek van nem-ures dataName-je', (): void => {
    const nameless: number = registeredNames.filter((name: string): boolean => !name || !name.trim()).length;

    expect(nameless).toBe(0);
  });

  it('| a feedback-domain teljes: feedback + feedbackVote + a hozza tartozo account-gyoker', (): void => {
    expect(registeredNames).toContain('feedback');
    expect(registeredNames).toContain('feedbackVote');
    expect(registeredNames).toContain('account');
  });
});
