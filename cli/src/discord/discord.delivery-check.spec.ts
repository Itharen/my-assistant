import { verifyDelivery } from './discord.delivery-check.js';

describe('verifyDelivery', () => {
  it('accepts a single message that arrived whole', () => {
    const verdict = verifyDelivery({
      sentParts: ['teljes uzenet'],
      arrived: [{ id: '1', content: 'teljes uzenet' }],
    });

    expect(verdict.intact).toBe(true);
  });

  it('catches the 2026-09-07 truncation: only the first line arrived', () => {
    // A valos incidens: a burkolo az elso ujsornal levagta a szoveget.
    const sent: string = 'Cimsor\nmasodik sor\nharmadik sor';
    const verdict = verifyDelivery({
      sentParts: [sent],
      arrived: [{ id: '1', content: 'Cimsor' }],
    });

    expect(verdict.intact).toBe(false);
    expect(verdict.detail).toContain('CSONKOLVA');
    expect(verdict.parts[0]).toEqual({ sent: sent.length, arrived: 6 });
  });

  it('names the --file option as the remedy for truncation', () => {
    const verdict = verifyDelivery({
      sentParts: ['hosszu szoveg'],
      arrived: [{ id: '1', content: 'hosszu' }],
    });

    expect(verdict.remedy).toContain('--file');
  });

  it('reports a missing part when nothing arrived', () => {
    const verdict = verifyDelivery({ sentParts: ['barmi'], arrived: [] });

    expect(verdict.intact).toBe(false);
    expect(verdict.detail).toContain('NEM található');
  });

  it('reverses the read-back order, because Discord returns newest first', () => {
    // Kuldes: ["elso", "masodik"] -> visszaolvasva: ["masodik", "elso"]
    const verdict = verifyDelivery({
      sentParts: ['elso', 'masodik'],
      arrived: [{ id: '2', content: 'masodik' }, { id: '1', content: 'elso' }],
    });

    expect(verdict.intact).toBe(true);
    expect(verdict.parts).toEqual([{ sent: 4, arrived: 4 }, { sent: 7, arrived: 7 }]);
  });

  it('ignores older messages beyond the ones we just sent', () => {
    const verdict = verifyDelivery({
      sentParts: ['uj'],
      arrived: [
        { id: '3', content: 'uj' },
        { id: '2', content: 'regi uzenet' },
        { id: '1', content: 'meg regebbi' },
      ],
    });

    expect(verdict.intact).toBe(true);
    expect(verdict.parts.length).toBe(1);
  });

  it('does not flag a longer arrival as a failure', () => {
    // A Discord normalizalhat; csak a HOSSZ-VESZTES valodi hiba.
    const verdict = verifyDelivery({
      sentParts: ['abc'],
      arrived: [{ id: '1', content: 'abcd' }],
    });

    expect(verdict.intact).toBe(true);
  });
});
