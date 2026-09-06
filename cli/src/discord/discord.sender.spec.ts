import { splitForDiscord } from './discord.sender.js';

describe('splitForDiscord', () => {
  it('leaves a short message in one piece', () => {
    expect(splitForDiscord('Szia!').length).toBe(1);
  });

  it('splits a long message so every part fits the Discord limit', () => {
    const lines: string = Array.from({ length: 400 }, (_, index) => `sor ${index}`).join('\n');
    const parts = splitForDiscord(lines);

    expect(parts.length > 1).toBe(true);
    expect(parts.every((part) => part.length <= 2000)).toBe(true);
  });

  it('splits on line boundaries so sentences stay intact', () => {
    const lines: string = Array.from({ length: 400 }, () => 'x'.repeat(50)).join('\n');
    const parts = splitForDiscord(lines);

    // Egyetlen rész sem kezdődhet vagy végződhet fél soron: minden sor teljes hosszú.
    expect(parts.every((part) => part.split('\n').every((line) => line.length === 50))).toBe(true);
  });

  it('force-splits a single over-long line rather than dropping it', () => {
    const parts = splitForDiscord('y'.repeat(5000));

    expect(parts.length).toBe(3);
    expect(parts.join('').length).toBe(5000);
  });

  it('loses no characters when splitting', () => {
    const lines: string = Array.from({ length: 300 }, (_, index) => `tétel ${index}`).join('\n');
    const parts = splitForDiscord(lines);

    expect(parts.join('\n')).toBe(lines);
  });
});
