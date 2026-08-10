import { DyNTS_GlobalService_Settings } from '@futdevpro/nts-dynamo';
import {
  FDP_errors_dataParams,
  FDP_feedback_dataParams,
  FDP_feedbackVote_dataParams
} from '@futdevpro/fdp-templates';
import { FDP_account_dataParams } from '@futdevpro/fdp-templates/account';

// `.js` kiterjesztes SZANDEKOS (a tobbi szerver-fajl extensionless importal):
// ezt a modult a guard-spec is behuzza, az pedig a `build/`-bol, PLAIN NODE ESM alatt fut,
// ahol a kiterjesztes KOTELEZO. A szerver maga `tsx`-szel, kozvetlenul a TS-forrasbol indul
// (`node tsx/cli.mjs ./src/index.ts`), az pedig a `.js` → `.ts` feloldast is kezeli — igy
// mindket futtatasi mod jo. Kimerve 2026-08-11: a lanc tovabbi 3 fajlja level (nincs relativ importja).
import { capture_dataParams } from '../_models/data-models/capture.data-model.js';
import { insight_dataParams } from '../_models/data-models/insight.data-model.js';
import { wave_dataParams } from '../_models/data-models/wave.data-model.js';

/**
 * my-assistant DB-model regisztrációs lista (SSOT)
 *
 * @description Az ÖSSZES Dynamo data-model `dataParams` EGY helyen. Az `app.server.ts`
 *   (`getGlobalServiceCollection`) INNEN regisztrál, hogy a lista ne driftelhessen szét a
 *   guard-specektől. ÚJ data-model → IDE add hozzá.
 *
 *   Minta-forrás: `LIVE-projects/adventor/server/src/_collections/db-models.collection.ts`.
 *
 *   🔴 `FDP_account_dataParams` KÖTELEZŐ a feedback-domain miatt: az
 *   `FDP_feedback_dataParams.accountId` és az `FDP_feedbackVote_dataParams.accountId`
 *   `dependencyDataName: 'account'`-ot deklarál. Enélkül a Dynamo NEM tudja felépíteni a feedback
 *   data-service-eket, és a `/api/feedback/*` MINDEN endpointja HTTP 500-at ad (`DyNTS-DS0-C00`)
 *   valid tokennel is — miközben a build, a `tsc` és a többi teszt ZÖLD marad.
 *
 *   Ez a projekt pontosan ebben az állapotban volt (2026-08-10-i mérés): a feedback + feedbackVote
 *   regisztrálva volt, az `account` gyökér viszont **nem**. A hibát eddig ELFEDTE a kliens-oldali
 *   `apiBaseUrl: ''` defekt — a hívások a SPA-catch-all-ra mentek, tehát a szerver-oldali 500-ig
 *   el sem jutottak. A kliens javításával ez a defekt magától előjött volna.
 */
// A `NonNullable<...>` SZANDEKOS elteres az adventor-mintatol (ott csupasz
// `DyNTS_GlobalService_Settings['dbModels']`): a mezo OPCIONALIS, igy a tipus tartalmazza az
// `undefined`-ot is, es a guard-spec `.map()`-je TS18048-cal bukott. Kimerve 2026-08-11.
export const myAssistant_dbModels: NonNullable<DyNTS_GlobalService_Settings['dbModels']> = [
  // FDP identitas-gyoker — a feedback/feedbackVote `accountId` fuggosege erre mutat.
  FDP_account_dataParams,

  // Projekt-sajat domainek.
  wave_dataParams,
  insight_dataParams,
  capture_dataParams,

  // Bedrock error-store.
  FDP_errors_dataParams,

  // Global feedback system (M5a-pattern rollout).
  FDP_feedback_dataParams,
  FDP_feedbackVote_dataParams,
];
