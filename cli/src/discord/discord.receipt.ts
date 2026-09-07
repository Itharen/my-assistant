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
