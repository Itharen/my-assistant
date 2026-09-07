// 🪶 TÍPUS-VÁZ a régi CCAP `NewVersionContext` helyére.
//
// 🔴 MIÉRT NEM EMELTÜK ÁT AZ EREDETIT: az a fájl a CCAP `_modules/server/` és
// `_modules/definitions/` alrendszereibe hivatkozik tovább *(definition-data-model,
// task-runtime, input-request…)* — vagyis egy **egész alrendszert** húzna magával.
//
// ⭐ ÉS MINDEZT EGY HALOTT IMPORT MIATT. MÉRVE (2026-09-07): az egyetlen hivatkozó a
// `cv-result-review.control-service.ts`, ahol a `NewVersionContext` **kizárólag
// kikommentelt kódban** szerepel *(a `/* let context: NewVersionContext; … *​/` blokkban)*.
// A típus tehát **fordítási** követelmény, nem futási — a viselkedéshez semmi köze.
//
// ⇒ Ezért elég egy váz. ⛔ Az átemelt fájl így is **bájtra változatlan**: csak az van más,
// amire az import mutat. *(Ugyanaz az elv, mint a `ccap.master-service` illesztőnél.)*
//
// ⚠️ HA EZ A KÓD VALAHA ÉLESEDIK — vagyis a kommentblokk visszakerül —, akkor ez a váz
// **NEM lesz elég**, és a valódi kontextus-modellt kell megoldani. Azért áll itt ez a
// figyelmeztetés, hogy az a pillanat ne csendben találjon meg minket.
//
// Terv: `__agent/plans/voice-control-transplant/hyperplan.plan.md`

/**
 * A régi kontextus-modell VÁZA — csak annyi, amennyit a *(jelenleg kikommentelt)* hívás
 * használna: egy `discordId` mező a konstruktorban.
 */
export class NewVersionContext {

  readonly discordId: string;

  constructor(params: { discordId: string }) {
    this.discordId = params.discordId;
  }
}
