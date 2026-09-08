// A `fetch` TÖRZSE ELFOGAD NYERS `Buffer`-t — típus-szintű kiegészítés az ÁTEMELT kódhoz.
//
// 🔴 MIÉRT LÉTEZIK EZ A FÁJL
//
// > **Owner, 2026-09-07:** *„semmit nem szabad változtatni a kódban jelenleg, mert nagyon
// > törékeny az a kód, de cserében meg egész jól működött."*
//
// Két hang-modul (`cv-audio-classification.api-service`, `cv-local-speech-recognition.api-service`)
// nyers `Buffer`-t ad át a `fetch` törzsének. Ez a **futásidőben helyes** — a Node `fetch`-e
// (undici) elfogadja a `Buffer`-t, és a régi bot évekig így működött.
//
// ⛔ A hiba nem a kódban van, hanem a KÖRNYEZETBEN: az `@types/node` 22-es sora a `Buffer`-t
// **generikussá** tette (`Buffer<ArrayBufferLike>`), és ez a típus már nem illeszkedik a
// `BodyInit` union egyetlen tagjára sem. ⚠️ A `lib: ["…","dom"]` — amit a régi bot tsconfigja
// is használt — **önmagában nem oldja meg**: az `@types/node` saját globális `fetch`-e
// **árnyékolja** a DOM-belit, tehát a szigorúbb undici-szerződés érvényesül.
//
// ⭐ EZÉRT ITT, ÉS NEM A KÓDBAN: egy `as unknown as BodyInit` cast a két hívási helyen
// **igazolhatatlan viselkedés-változás** volna egy olyan modulban, ami 2026-01-31 óta
// változatlan, és amihez **nincs mihez hasonlítani** *(a régi bot nem fut)*. A különbséget
// ott oldjuk fel, ahol nem árt: a **típus-környezetben**.
//
// ⚠️ Ez **NEM lazítás**: egyetlen további túlterhelést ad a `fetch`-hez, ami pontosan azt
// engedi meg, amit a Node futásideje amúgy is elfogad. Minden más hívást a meglévő,
// szigorú túlterhelések bírálnak el változatlanul.
//
// 📌 Csak a `tsconfig.transplanted.json` húzza be — a saját kódunkra NEM vonatkozik.

export {};

declare global {

  /**
   * Túlterhelés: a törzs lehet nyers `Buffer` *(a Node `fetch`-e ezt elfogadja)*.
   *
   * @param input a cél URL vagy kérés.
   * @param init a kérés beállításai, `Buffer` törzzsel.
   */
  function fetch(
    input: string | URL | Request,
    init: Omit<RequestInit, 'body'> & { body: Buffer },
  ): Promise<Response>;
}
