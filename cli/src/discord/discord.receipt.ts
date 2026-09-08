// KÉZBESÍTÉSI ÉRTESÍTŐ — „most ment el neked X üzenet".
//
// > **Owner-KORREKCIÓ (2026-09-07 10:29), szó szerint:** *„Nem kell folyton írni, hogy
// > megvannak az üzenetek... Elég ha a typing frissítve van és esetleg arról küldhetsz egy
// > rövid 2 szavas választ, hogy na most ment el neked x üzenet"*
//
// 🔴 EZ EGY KORÁBBI MEGOLDÁSOM JAVÍTÁSA. Előbb „megérkezett, dolgozom" nyugtát küldtem,
// amikor a köteg VÁRT. Az owner szerint ez **sok** — és igaza van: a várakozásról a
// „gépel…" jelzés úgyis szól, tehát a nyugta ugyanazt mondta el még egyszer, szavakkal.
//
// ⇒ A jelzés **átkerült a KÜLDÉS pillanatára**: nem azt mondjuk meg, hogy *megkaptuk*,
// hanem azt, hogy **most ment át**. Ez az az egy pillanat, amiről a „gépel…" NEM tud
// beszélni — és pont ez hiányzott.
//
// ⭐ A TANULSÁG: nem elég **jelezni**; a jelzésnek azt kell mondania, amit a többi jel NEM
// mond el. A redundáns visszajelzés nem megnyugtat, hanem zajjá válik.

/**
 * A kézbesítési értesítő szövege.
 *
 * ⭐ SZÁNDÉKOSAN TŐMONDAT — az owner kifejezetten *„rövid 2 szavas választ"* kért. Egyetlen
 * tényt közöl: **most ment át, ennyi**. ⛔ Nem magyaráz, nem ígér, nem köszönget.
 */
export function composeDeliveryNotice(deliveredCount: number): string {
  return deliveredCount === 1
    ? '📨 Átment az üzeneted.'
    : `📨 Átment ${deliveredCount} üzeneted.`;
}

/**
 * Kimenjen-e egyáltalán az értesítő.
 *
 * 🔴 MÉRT SPAM, 2026-09-08: **72 üzenetet** küldtem aznap, ebből **17 ez a nyugta** volt.
 * Az owner reggel ezt írta: *„megint kicsit össze lett spam-elve a discord"*.
 *
 * ⚠️ **KÉT OWNER-SZABÁLY ÜTKÖZÖTT, és mindkettő érvényes:**
 *
 * | Mikor | Mit mondott |
 * |---|---|
 * | 2026-09-07 10:29 | *„esetleg arról küldhetsz egy rövid 2 szavas választ, hogy **na most ment el neked x üzenet**"* |
 * | 2026-09-08 13:19 | *„nem jeleznél vissza **mindig minden inputról**. Csak intéznéd/feljegyeznéd."* |
 *
 * ⭐ **A feloldás nem választás, hanem a KÜLÖNBSÉG megtalálása:** a korábbi kérés **kötegre**
 * szólt *(„x üzenet")*, a tiltás pedig az **egyenkénti** visszajelzésre. Mivel az üzenetei
 * egyesével érkeznek, a `deliveredCount` **majdnem mindig 1** volt ⇒ a köteg-értesítőből
 * gyakorlatilag **per-input nyugta** lett, azaz pontosan az, amit megtiltott.
 *
 * ⇒ **Egyetlen üzenetnél hallgatunk** — arról a „gépel…" jelzés úgyis szól. **Kettőtől
 * felfelé** viszont megy, mert ott valódi információ van: hogy **több** ment át egyszerre.
 *
 * 📌 Kanonikus: `current/principles/focus-support.md` 6️⃣ + `discord-message-style.md`.
 */
export function shouldSendDeliveryNotice(deliveredCount: number): boolean {
  return deliveredCount >= 2;
}
