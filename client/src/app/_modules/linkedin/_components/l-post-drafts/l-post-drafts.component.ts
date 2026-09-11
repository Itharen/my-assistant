// ✍️ A POSZT-PISZKOZATOK FELÜLETE — „egy lista + posztonként egy másolható szövegdoboz".
//
// > **Owner sorrendje:** profil → **posztok** → üzenetek. A profil-vonal kész ⇒ ez jön.
//
// ## 🔴 A KORLÁT, AMI A TERVET MEGHATÁROZZA — ugyanaz, mint a profilnál
//
// A LinkedIn hivatalos API-ja **csak olvas** ⇒ a posztot **nem tudjuk kiküldeni**.
// ⇒ **A cél nem az automatizálás, hanem a SÚRLÓDÁS-MENTES ÁTVITEL.**
//
// | amit ad | miért |
// |---|---|
// | **posztonként** egy másolható szövegdoboz | ⭐ ez a lényeg — ⛔ nem egy nagy blob |
// | karakterszám + a LinkedIn poszt-limitje | *„ha túllóg, ott derüljön ki, ne a beillesztésnél"* |
// | **„kiposztoltam" pipa** posztonként | különben nem tudja, hol tartott, ha félbeszakad |
// | az **indoklás** *(„miért így")* a poszt mellett | a döntéshez a **miért** kell, nem csak a szöveg |
//
// ## ⛔ AMI NINCS BENNE — szándékosan, a feladat szó szerinti tiltása
//
// Ütemezés · automatikus kiküldés · statisztika · kép-generálás · **szerkesztő**.
//
// 🔴 **A SZÖVEGET NEM SZERKESZTJÜK ÉS NEM GENERÁLJUK.** A tartalmi szabályok az asszisztensé
// *(`current/principles/linkedin-post-writing.md`)*; ez a panel **megjelenít és másol**.

import { CommonModule } from '@angular/common';
import { Component, computed, Inject, OnInit, Signal, signal } from '@angular/core';

import { DyFM_Log } from '@futdevpro/fsm-dynamo';

import type {
  LinkedInPostDraft,
  LinkedInPostDraftsPlan,
  LinkedInPostPostedRequest,
} from '@server-models';
import { L_LinkedInWorkspace_DataService } from '../../_services/l-linkedin-workspace.data-service';

/**
 * Amire ennek a panelnek TÉNYLEGESEN szüksége van az adat-rétegből.
 *
 * ⭐ MIÉRT SZŰK TÍPUS: így a teszt egy **egyszerű objektummal** kielégíti, ⛔ `as` átcímkézés
 * nélkül. ⚠️ Átcímkézve a fordító **nem szólna**, ha az adat-réteg felülete elmozdulna, és a
 * teszt zöld maradna egy nem létező szerződésre.
 */
interface PostDraftsGateway {
  getPostDrafts(): Promise<LinkedInPostDraftsPlan>;
  markPostDraftPosted(request: LinkedInPostPostedRequest): Promise<LinkedInPostDraftsPlan>;
}

@Component({
  selector: 'l-post-drafts',
  templateUrl: './l-post-drafts.component.html',
  styleUrl: './l-post-drafts.component.scss',
  imports: [CommonModule],
})
/** LinkedIn poszt-piszkozatok — posztonkénti vágólap + haladás-jelölés. */
export class L_PostDrafts_Component implements OnInit {

  readonly loading_$ = signal<boolean>(false);
  readonly plan_$ = signal<LinkedInPostDraftsPlan | null>(null);

  /** Melyik posztot másoltuk épp — a gomb visszajelzéséhez. */
  readonly copiedId_$ = signal<string | null>(null);

  /** ⛔ A hiba SOSEM néma a felületen. */
  readonly error_$ = signal<string | null>(null);

  /**
   * A piszkozatok — ⭐ `computed`, ⛔ nem metódus.
   *
   * ⚠️ A sablonból hívott metódus **minden** változás-detektálásnál újrafutna
   * *(`no-method-call-in-template`)*.
   */
  readonly drafts_$: Signal<LinkedInPostDraft[]> = computed(
    (): LinkedInPostDraft[] => this.plan_$()?.drafts ?? [],
  );

  /** A haladás szövege — ⭐ egy pillantással látszik, hol tart. */
  readonly progressLabel_$: Signal<string> = computed((): string => {
    const plan: LinkedInPostDraftsPlan | null = this.plan_$();

    if (!plan || !plan.hasDrafts) return 'Még nincs piszkozat.';

    return `${plan.postedCount} / ${plan.draftCount} poszt kiküldve`;
  });

  /**
   * KONSTRUKTOR-INJEKTÁLÁS, nem `inject()` — a szomszéd panelek mintája szerint.
   *
   * Így a komponens **TestBed nélkül** példányosítható, és a viselkedés *(vágólap-hiba,
   * jelölés-mentés)* tesztelhető.
   */
  constructor(
    // ⚠️ EXPLICIT TOKEN: a paraméter típusa szándékosan a **szűk** szerződés, ezért az
    // Angular nem tudná belőle kitalálni a szolgáltatást — a token mondja meg.
    @Inject(L_LinkedInWorkspace_DataService) private readonly data: PostDraftsGateway,
  ) {}

  /**
   * Lifecycle hook — betöltéskor lekéri a listát.
   *
   * ⚠️ **NEM `async`**: az Angular ⛔ nem várja meg a `ngOnInit` promise-át, tehát az `async`
   * jelölés **hamis biztonságot** adna.
   */
  ngOnInit(): void {
    void this.refresh();
  }

  /**
   * A lista lekérése.
   *
   * ⚠️ **A `ngOnInit` elutasított promise-a némán elnyelődne**, és a panel üresen állna — ez a
   * hibafajta már MEGTÖRTÉNT ebben a projektben. Ezért itt `try/catch` van, és a hiba a
   * felületen is látszik.
   */
  async refresh(): Promise<void> {
    this.loading_$.set(true);
    this.error_$.set(null);

    try {
      this.plan_$.set(await this.data.getPostDrafts());
    } catch (error: unknown) {
      DyFM_Log.error(`[l-post-drafts] A poszt-piszkozatok nem olvashatók: ${String(error)}`);
      this.error_$.set('A poszt-piszkozatok nem olvashatók. Fut-e a szerver?');
    } finally {
      this.loading_$.set(false);
    }
  }

  /**
   * ⭐ EGY POSZT a vágólapra.
   *
   * ⚠️ **`navigator.clipboard` csak biztonságos környezetben** *(`https` vagy `localhost`)*
   * létezik. A dashboard localhoston fut, tehát megvan — de ⛔ ha mégsem, azt **kimondjuk**,
   * ⛔ nem tesszük úgy, mintha másoltunk volna. *(A néma „siker" itt azt jelentené, hogy az
   * owner üres vágólapot illeszt be a LinkedIn-re.)*
   */
  async copyDraft(draft: LinkedInPostDraft): Promise<void> {
    this.error_$.set(null);

    if (!draft.body) {
      this.error_$.set(`A(z) „${draft.title}" piszkozat szövege üres.`);

      return;
    }

    try {
      if (!navigator.clipboard) {
        throw new Error('a vágólap nem érhető el ebben a környezetben');
      }

      await navigator.clipboard.writeText(draft.body);
      this.copiedId_$.set(draft.id);
    } catch (error: unknown) {
      DyFM_Log.error(`[l-post-drafts] A vágólapra másolás nem sikerült: ${String(error)}`);
      this.error_$.set(
        `A(z) „${draft.title}" nem került a vágólapra — jelöld ki és másold kézzel.`,
      );
    }
  }

  /**
   * ✅ A „kiposztoltam" pipa átállítása.
   *
   * ⭐ A választ a **szerver** adja vissza *(a friss lista)* — ⛔ nem a saját feltevésünkből
   * rajzolunk újra. Így egy elbukott mentés **látszik**, nem pedig kipipáltnak tűnik.
   */
  async togglePosted(draft: LinkedInPostDraft): Promise<void> {
    this.error_$.set(null);

    try {
      this.plan_$.set(await this.data.markPostDraftPosted({
        id: draft.id,
        isPosted: !draft.isPosted,
      }));
    } catch (error: unknown) {
      DyFM_Log.error(`[l-post-drafts] A jelölés nem menthető: ${String(error)}`);
      this.error_$.set('A jelölés nem menthető — a haladás nem őrződött meg.');
    }
  }
}
