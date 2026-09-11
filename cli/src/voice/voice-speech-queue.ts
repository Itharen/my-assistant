// 🔢 A FELOLVASÁS SORA — egy üzenet sem esik ki azért, mert épp szól egy másik.
//
// > **Owner, 2026-09-11 01:30 (hang):** *„mintha két üzenetet küldtél, és csak az első került
// > felolvasásra… majd itt bonyolultabb queuing rendszert is kell kialakítsunk"*
//
// ## 🔴 A MÉRT GYÖKÉR
//
// `voice-speaker.ts`:
//
// ```ts
// if (request.player.state.status !== AudioPlayerStatus.Idle) {
//   return { spoken: false, detail: 'Épp szól valami — ezt nem olvasom bele.' };
// }
// ```
//
// ⇒ A második üzenet **elesik**. ⚠️ És ez nem a felvevő hibája: a `speakInVoiceChannel` a
// `player.play()` **után AZONNAL visszatér** *(a lejátszás onnantól a lejátszó dolga)*, tehát a
// `voice-read-aloud-watcher` `await`-je **nem a lejátszás végét** várja meg, csak az indítását.
// ⇒ Semmi nem sorosít. Az owner megfigyelése — *„a másodikat is legeneráltuk, csak aztán
// valahogy nem volt jó a kezelés"* — pontosan ezt írja le.
//
// ## ⭐ A MEGOLDÁS: VÁRAKOZÁS, NEM ELDOBÁS
//
// ```
// enqueue(A: 1 darab) ─┐
// enqueue(B: 3 darab) ─┴─▶ [A1] [B1 B2 B3] ──▶ szól ──▶ Idle ──▶ a következő
// ```
//
// | szempont | hogyan |
// |---|---|
// | **sorrend** | érkezési, ⛔ soha nem előz |
// | **veszteség** | ⛔ nulla — ha épp szól egy, a következő **vár** |
// | **csoport** | egy üzenet N darabja **egyben** marad, közéjük más üzenet ⛔ nem ékelődhet |
// | **láthatóság** | a torlódás **jelzés** — a csendes felhalmozódás ugyanaz a hibaosztály, mint a néma csonkolás |
//
// ## ⚠️ MIÉRT NEM POLLING
//
// A `core-no-polling` tiltja az ismételt kérdezést. Itt **nincs időzítő**: az `enqueue`
// **meglöki** a futót, a lejátszás végét pedig a `@discordjs/voice` `entersState`-je adja meg
// **eseményből**. ⛔ Sosem kérdezzük ismételten, hogy „vége van-e már".

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';

/** Egy sorba tett üzenet — ⚠️ a darabjai EGYBEN maradnak. */
interface QueuedSpeech {
  /** Az üzenet azonosítója *(a kimenő napló `sentAt`-ja)* — a naplózáshoz. */
  id: string;
  /**
   * A kimondandó darabok, sorrendben.
   *
   * ⭐ MIÉRT LISTA, MÁR MOST: a darabolás *(01:30)* ugyanennek a sornak a tételeit adja, és a
   * handoff kikötése, hogy egy üzenet darabjai közé **más üzenet nem ékelődhet**. Ha a sor
   * egyedi szövegeket tartana, ez a garancia **megszűnne**.
   */
  parts: string[];
}

/** Amit a sornak meg kell adni. */
interface SpeechQueueOptions {
  /**
   * EGY darab kimondása.
   *
   * ⚠️ A visszatérés a **megszólalás** kimenetele, ⛔ nem a lejátszás vége — azt a
   * `waitForIdle` adja meg.
   */
  speak: (text: string) => Promise<{ spoken: boolean; detail: string }>;
  /**
   * Várakozás, amíg a lejátszó **el nem hallgat**.
   *
   * 🔴 EZ A HIÁNYZÓ DARAB. Enélkül a sor ugyanúgy egymásra futtatná a darabokat, mint a
   * sor nélküli kód — csak épp sorban.
   *
   * @returns `true`, ha tényleg elhallgatott; `false`, ha nem várjuk tovább *(időtúllépés)*.
   */
  waitForIdle: () => Promise<boolean>;
  /** ⛔ Egyetlen kimenetel sem lehet néma — ide jön minden, ami történt. */
  onNote?: (detail: string) => void;
  /** 🔴 A TORLÓDÁS jelzése — a csendes felhalmozódás láthatatlan adatvesztés. */
  onBacklog?: (info: { depth: number; parts: number }) => void;
  /** Ennyi VÁRAKOZÓ üzenet fölött szólunk. */
  backlogThreshold?: number;
}

/**
 * Ennyi várakozó üzenet fölött jelezzük a torlódást.
 *
 * ⭐ A handoff saját száma: *„ha a sor nem ürül (pl. 5 tétel fölött), az jelzés"*.
 */
const DEFAULT_BACKLOG_THRESHOLD: number = 5;

/**
 * 🔢 A felolvasás FIFO sora.
 *
 * ⛔ **Hibát SOHA nem dob a hívó felé**: a felolvasás kísérő funkció — ha elhasal, az nem
 * viheti magával az üzenet-kézbesítést. ⚠️ De ⛔ nem is néma: minden kimenetel `onNote`-ra megy.
 */
export class VoiceSpeechQueue {

  private readonly pending: QueuedSpeech[] = [];

  /** Fut-e épp a kiszolgáló. ⚠️ Nem „szól-e valami" — az a lejátszó állapota. */
  private isRunning: boolean = false;

  /** Tartjuk-e a sort. ⭐ A tartás ⛔ NEM üríti ki — a tételek megvárják a folytatást. */
  private isHeld: boolean = false;

  /** Jeleztük-e MÁR a mostani torlódást. ⚠️ Enélkül üzenetenként szólnánk = spam. */
  private isBacklogWarned: boolean = false;

  constructor(private readonly options: SpeechQueueOptions) {}

  /** Hány ÜZENET vár — a diagnosztikához és a teszthez. */
  get depth(): number {
    return this.pending.length;
  }

  /** Hány DARAB vár összesen. ⚠️ Egy üzenet több darab is lehet *(darabolás)*. */
  get pendingParts(): number {
    return this.pending.reduce((sum: number, item: QueuedSpeech): number => sum + item.parts.length, 0);
  }

  /** Tartjuk-e a sort. */
  get isPaused(): boolean {
    return this.isHeld;
  }

  /**
   * Egy üzenet sorba tétele — ⭐ a darabjai **egyben**.
   *
   * ⚠️ Az üres darab-lista nem kerül be: egy tartalom nélküli tétel csak a sort hosszabbítaná.
   */
  enqueue(item: QueuedSpeech): void {
    const parts: string[] = item.parts
      .map((part: string): string => part.trim())
      .filter((part: string): boolean => part.length > 0);

    if (!parts.length) return;

    this.pending.push({ id: item.id, parts: parts });
    this.reportBacklogIfNeeded();

    // ⚠️ SZÁNDÉKOSAN NEM `await`-elünk: a hívó *(a napló-figyelő)* nem akadhat meg addig, amíg
    // egy hosszú felolvasás tart. A hibát a futó maga kezeli és jelenti.
    void this.run();
  }

  /**
   * A sor TARTÁSA.
   *
   * ⭐ A tartás **nem üríti ki** a sort: a soron lévő üzenet megvárja a folytatást.
   * ⚠️ A **már szóló** darab ettől nem hallgat el — ez a sor szintje, ⛔ nem a lejátszóé.
   * *(Az azonnali elhallgatás a hívó dolga; a sor csak nem indít újat.)*
   */
  hold(): void {
    this.isHeld = true;
  }

  /** A tartás feloldása — a sor **onnan folytatódik, ahol abbamaradt**. */
  release(): void {
    if (!this.isHeld) return;

    this.isHeld = false;
    void this.run();
  }

  /**
   * A sor kiürítése — ⚠️ CSAK a teszt és a szabályos leállás használja.
   *
   * ⛔ A normál működésben SOHA nem dobunk el tételt: pontosan az volt a hiba, amit javítunk.
   */
  async drain(): Promise<void> {
    while (this.pending.length && !this.isHeld) {
      await this.run();
    }
  }

  /**
   * A kiszolgáló.
   *
   * ⚠️ Az `isRunning` zár nem kényelmi: két egymásra futó kiszolgáló **egyszerre** indítana
   * lejátszást, és pontosan az egymásba-beszélést hozná vissza, amit a sor megszüntet.
   */
  private async run(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    try {
      while (this.pending.length && !this.isHeld) {
        // ⚠️ A tételt csak a KISZOLGÁLÁS ELŐTT vesszük ki — így a `depth` addig mutatja a
        // torlódást, ameddig tényleg tart.
        const item: QueuedSpeech | undefined = this.pending[0];

        if (!item) break;

        // 🔴 CSAK A BEFEJEZETT tételt vesszük ki. ⚠️ MÉRT SAJÁT HIBA a tervezés közben: ha a
        // `shift()` feltétel nélkül futna, egy TARTÁS közben félbehagyott üzenet maradék
        // darabjai **elveszhetnének** — pontosan az a veszteség, amit a sor megszüntet.
        if (!await this.speakGroup(item)) break;

        this.pending.shift();
      }

      // ⭐ A torlódás-jelzés ÚJRA FEGYVERBE áll, ha a sor leürült — különben egy korai
      // figyelmeztetés után soha többé nem szólnánk.
      if (!this.pending.length) this.isBacklogWarned = false;
    } catch (err: unknown) {
      SwallowedFailure_Util.report('voice.speech-queue.run', err);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * EGY üzenet összes darabja, sorrendben.
   *
   * ⛔ Más üzenet nem ékelődhet közéjük — ezért van a csoport egy tételben.
   *
   * @returns `true`, ha az üzenet **végig** elhangzott; `false`, ha tartás miatt félbemaradt —
   *   ilyenkor a **maradék darabok** a tételben maradnak, és a folytatás onnan veszi fel.
   */
  private async speakGroup(item: QueuedSpeech): Promise<boolean> {
    for (const [index, part] of item.parts.entries()) {
      // ⚠️ A TARTÁS A DARABOK KÖZÖTT IS ÉRVÉNYES. A handoff kikötése: *„ha a 2. rész közben
      // megszólal, a 3. NE induljon el."* ⛔ De a maradék NEM esik ki: visszatesszük a sor
      // ELEJÉRE, hogy a folytatás onnan vegye fel.
      if (this.isHeld) {
        item.parts = item.parts.slice(index);
        this.options.onNote?.(
          `a felolvasás TARTVA — ${item.parts.length} darab vár a folytatásra (${item.id})`,
        );

        return false;
      }

      const label: string = item.parts.length > 1
        ? `${item.id} (${index + 1}/${item.parts.length})`
        : item.id;
      const result = await this.options.speak(part);

      this.options.onNote?.(`${label}: ${result.detail}`);

      // ⛔ A BUKÁS NEM ÁLLÍTJA MEG A SORT. Ha egy darab szintézise elhasal, a többi attól még
      // elhangozhat — és a teljes szöveg írásban amúgy is ott van.
      if (!result.spoken) continue;

      // 🔴 EZ A LÉNYEG: megvárjuk, hogy TÉNYLEG elhallgatott. Enélkül a következő darab
      // ugyanabba a nem-`Idle` állapotba futna bele, amit javítunk.
      if (!await this.options.waitForIdle()) {
        this.options.onNote?.(
          `${label}: a lejátszás vége nem volt kivárható — a sor TOVÁBBLÉP, hogy ne akadjon be`,
        );
      }
    }

    // ⚠️ Ide csak akkor jutunk, ha MINDEN darab sorra került.
    return true;
  }

  /**
   * 🔴 A TORLÓDÁS LÁTHATÓVÁ TÉTELE.
   *
   * ⭐ MIÉRT KELL: a néma felhalmozódás ugyanaz a hibaosztály, mint a néma csonkolás — a
   * rendszer *„működik"*, csak az üzenetek 4 perc késéssel szólalnak meg, és senki nem tudja,
   * miért. ⚠️ **Egyszer** szólunk torlódásonként, ⛔ nem üzenetenként.
   */
  private reportBacklogIfNeeded(): void {
    const threshold: number = this.options.backlogThreshold ?? DEFAULT_BACKLOG_THRESHOLD;

    if (this.pending.length <= threshold || this.isBacklogWarned) return;

    this.isBacklogWarned = true;
    this.options.onBacklog?.({ depth: this.pending.length, parts: this.pendingParts });
  }
}
