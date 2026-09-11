// 🔗 A PROFIL-FRISSÍTÉS FELÜLETE — „easy to use, copy-paste-es".
//
// > **Owner, 2026-09-11 01:52:** *„most az első majd az kell legyen, hogy a **profilt kéne
// > frissítsük**. Amúgy lehet, hogy ahhoz is adhatnál majd egy felületet, meg valami **easy to
// > use, copy-paste-es megoldást**, ugye azt sem tudjuk automatizálni teljesen."*
//
// ## 🔴 A KORLÁT, AMI A TERVET MEGHATÁROZZA
//
// A LinkedIn hivatalos API-ja **csak olvas** ⇒ a profilt **nem tudjuk átírni**.
// ⇒ **A cél nem az automatizálás, hanem a SÚRLÓDÁS-MENTES ÁTVITEL.**
//
// | amit ad | miért |
// |---|---|
// | **mezőnként** a mostani és a javasolt szöveg, egymás mellett | a LinkedIn-en is mezőnként kell beilleszteni |
// | **egy gomb = egy mező** vágólapra | ⭐ ez a lényeg — ⛔ **nem egy nagy blob** |
// | karakterszám + a LinkedIn limitje mezőnként | *„ha túllóg, ott derüljön ki, ne a beillesztésnél"* |
// | **„beillesztettem" pipa** mezőnként | különben nem tudja, hol tartott, ha félbeszakad |
//
// ## ⛔ AMI NINCS BENNE — szándékosan
//
// A **poszt**-felület *(T-73)* ugyanez a minta lesz, de **külön kör** *(`one-function-is-enough`)*.

import { CommonModule } from '@angular/common';
import { Component, computed, Inject, OnInit, Signal, signal } from '@angular/core';

import { DyFM_Log } from '@futdevpro/fsm-dynamo';

import type {
  LinkedInProfileField,
  LinkedInProfilePastedRequest,
  LinkedInProfileUpdatePlan,
} from '@server-models';
import { L_LinkedInWorkspace_DataService } from '../../_services/l-linkedin-workspace.data-service';

/**
 * Amire ennek a panelnek TÉNYLEGESEN szüksége van az adat-rétegből.
 *
 * ⭐ MIÉRT SZŰK TÍPUS: így a teszt egy **egyszerű objektummal** kielégíti, ⛔ `as` átcímkézés
 * nélkül. ⚠️ Átcímkézve a fordító **nem szólna**, ha az adat-réteg felülete elmozdulna, és a
 * teszt zöld maradna egy nem létező szerződésre.
 */
interface ProfileUpdateGateway {
  getProfileUpdatePlan(): Promise<LinkedInProfileUpdatePlan>;
  markProfileFieldPasted(request: LinkedInProfilePastedRequest): Promise<LinkedInProfileUpdatePlan>;
}

@Component({
  selector: 'l-profile-update',
  templateUrl: './l-profile-update.component.html',
  styleUrl: './l-profile-update.component.scss',
  imports: [CommonModule],
})
/** LinkedIn profil-frissítés — mezőnkénti vágólap + haladás-jelölés. */
export class L_ProfileUpdate_Component implements OnInit {

  readonly loading_$ = signal<boolean>(false);
  readonly plan_$ = signal<LinkedInProfileUpdatePlan | null>(null);

  /** Melyik mezőt másoltuk épp — a gomb visszajelzéséhez. */
  readonly copiedKey_$ = signal<string | null>(null);

  /** ⛔ A hiba SOSEM néma a felületen. */
  readonly error_$ = signal<string | null>(null);

  /**
   * Csak a VÁLTOZÓ mezők — ⛔ a változatlanokkal nem adunk munkát.
   *
   * ⭐ `computed`, ⛔ nem metódus: a sablonból hívott metódus **minden** változás-detektálásnál
   * újrafutna. *(A `no-method-call-in-template` review pont ezt fogja meg.)*
   */
  readonly changingFields_$: Signal<LinkedInProfileField[]> = computed(
    (): LinkedInProfileField[] => (this.plan_$()?.fields ?? [])
      .filter((field: LinkedInProfileField): boolean => field.hasChange),
  );

  /** A haladás szövege — ⭐ egy pillantással látszik, hol tart. */
  readonly progressLabel_$: Signal<string> = computed((): string => {
    const plan: LinkedInProfileUpdatePlan | null = this.plan_$();

    if (!plan || !plan.hasProposal) return 'Még nincs javaslat.';

    return `${plan.pastedCount} / ${plan.changeCount} mező beillesztve`;
  });

  /**
   * KONSTRUKTOR-INJEKTALAS, nem `inject()` — a szomszed `l-workspace` mintaja szerint.
   *
   * Igy a komponens **TestBed nelkul** peldanyosithato, es a viselkedes *(vagolap-hiba,
   * jelolés-mentes)* tesztelheto. Az `inject()` injektalas-kornyezetet igenyelne.
   */
  constructor(
    // ⚠️ EXPLICIT TOKEN: a paraméter típusa szándékosan a **szűk** szerződés, ezért az
    // Angular nem tudná belőle kitalálni a szolgáltatást — a token mondja meg.
    @Inject(L_LinkedInWorkspace_DataService) private readonly data: ProfileUpdateGateway,
  ) {}

  /**
   * Lifecycle hook — betöltéskor lekéri a tervet.
   *
   * ⚠️ **NEM `async`**: az Angular ⛔ nem várja meg a `ngOnInit` promise-át, tehát az `async`
   * jelölés **hamis biztonságot** adna. A `void` kimondja, hogy tudatosan nem várjuk — a hibát
   * pedig a `refresh` maga kezeli, ⛔ nem egy elnyelt elutasítás.
   */
  ngOnInit(): void {
    void this.refresh();
  }

  /**
   * A terv lekérése.
   *
   * ⚠️ **A `ngOnInit` elutasított promise-a némán elnyelődne**, és a panel üresen állna — ez a
   * hibafajta már MEGTÖRTÉNT ebben a projektben. Ezért itt `try/catch` van, és a hiba a
   * felületen is látszik.
   */
  async refresh(): Promise<void> {
    this.loading_$.set(true);
    this.error_$.set(null);

    try {
      this.plan_$.set(await this.data.getProfileUpdatePlan());
    } catch (error: unknown) {
      DyFM_Log.error(`[l-profile-update] A profil-frissítési terv nem olvasható: ${String(error)}`);
      this.error_$.set('A profil-frissítési terv nem olvasható. Fut-e a szerver?');
    } finally {
      this.loading_$.set(false);
    }
  }

  /**
   * ⭐ EGY MEZŐ a vágólapra.
   *
   * ⚠️ **`navigator.clipboard` csak biztonságos környezetben** *(`https` vagy `localhost`)*
   * létezik. A dashboard localhoston fut, tehát megvan — de ⛔ ha mégsem, azt **kimondjuk**,
   * ⛔ nem tesszük úgy, mintha másoltunk volna. *(A néma „siker" itt azt jelentené, hogy az
   * owner üres vágólapot illeszt be a profiljába.)*
   */
  async copyField(field: LinkedInProfileField): Promise<void> {
    this.error_$.set(null);

    if (!field.proposed) {
      this.error_$.set(`A(z) „${field.label}" mezőhöz még nincs javaslat.`);

      return;
    }

    try {
      if (!navigator.clipboard) {
        throw new Error('a vágólap nem érhető el ebben a környezetben');
      }

      await navigator.clipboard.writeText(field.proposed);
      this.copiedKey_$.set(field.key);
    } catch (error: unknown) {
      DyFM_Log.error(`[l-profile-update] A vágólapra másolás nem sikerült: ${String(error)}`);
      this.error_$.set(
        `A(z) „${field.label}" nem került a vágólapra — jelöld ki és másold kézzel.`,
      );
    }
  }

  /**
   * ✅ A „beillesztettem" pipa átállítása.
   *
   * ⭐ A választ a **szerver** adja vissza *(a friss terv)* — ⛔ nem a saját feltevésünkből
   * rajzolunk újra. Így egy elbukott mentés **látszik**, nem pedig kipipáltnak tűnik.
   */
  async togglePasted(field: LinkedInProfileField): Promise<void> {
    this.error_$.set(null);

    try {
      this.plan_$.set(await this.data.markProfileFieldPasted({
        key: field.key,
        isPasted: !field.isPasted,
      }));
    } catch (error: unknown) {
      DyFM_Log.error(`[l-profile-update] A jelölés nem menthető: ${String(error)}`);
      this.error_$.set('A jelölés nem menthető — a haladás nem őrződött meg.');
    }
  }
}
