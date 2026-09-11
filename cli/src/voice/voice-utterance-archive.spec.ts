// A megszólalás-archívum tesztjei.
//
// 🔴 MIÉRT LÉTEZIK EZ A MODUL — a MÉRT veszteség: `ma comm voice-funnel --day 2026-09-11` szerint
// **62,5% átvitel** 24 megszólalásból, ebből *„felismerés után elveszett: 6"*. A bizonytalan ágon
// a `handleFinishedRecording` **semmit nem hívott** ⇒ a WAV-ot a felvevő takarítása törölte, a
// nyers átirat pedig nem maradt meg sehol.
//
// ⭐ A LEGFONTOSABB ÁLLÍTÁSOK ITT:
//   (a) a hang **üres** felvételre ⛔ nem tesz úgy, mintha megőrizte volna;
//   (b) a törzs **dátumozott és fájlnév-biztos** (Windows: ⛔ `:` és `.` nem lehet benne);
//   (c) a bizonytalanság **indoka** eljut az ownerhez — és a technikai bukás ⛔ NEM
//       „nem értettem"-ként jelenik meg;
//   (d) ⛔ egyetlen művelet sem dob — a megőrzés kísérő funkció.

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { VoiceUtteranceArchive_Util } from './voice-utterance-archive.js';

describe('VoiceUtteranceArchive_Util.buildStem — ⭐ dátumozott ÉS fájlnév-biztos', () => {

  it('az ISO-időbélyeg kerül a névbe, de ⛔ `:` és `.` NÉLKÜL', () => {
    // ⚠️ Windowson a `:` érvénytelen fájlnév-karakter — egy nyers ISO-alak itt NÉMÁN
    // bukó írást adna, és pont a megőrzés hiúsulna meg.
    const stem: string = VoiceUtteranceArchive_Util.buildStem(
      new Date('2026-09-11T02:14:33.123Z'),
      '123456789',
    );

    expect(stem).toBe('2026-09-11T02-14-33-123Z__123456789');
    expect(stem).not.toContain(':');
    expect(stem).not.toContain('.');
  });

  it('⭐ a névsorrend = IDŐSORREND — enélkül az archívum böngészhetetlen lenne', () => {
    const earlier: string = VoiceUtteranceArchive_Util.buildStem(new Date('2026-09-11T02:00:00Z'), 'a');
    const later: string = VoiceUtteranceArchive_Util.buildStem(new Date('2026-09-11T03:00:00Z'), 'a');

    expect(earlier < later).toBeTrue();
  });

  it('🔴 az ÚTVONAL-ELVÁLASZTÓ nem juthat a fájlnévbe', () => {
    // Egy `../` a beszélő-azonosítóban az archívumon KÍVÜLRE írást jelentene.
    const stem: string = VoiceUtteranceArchive_Util.buildStem(new Date('2026-09-11T02:00:00Z'), '../../etc');

    expect(stem).not.toContain('/');
    expect(stem).not.toContain('..');
  });

  it('üres beszélő-azonosítónál sincs névtelen fájl', () => {
    expect(VoiceUtteranceArchive_Util.buildStem(new Date('2026-09-11T02:00:00Z'), ''))
      .toContain('__unknown');
  });
});

describe('VoiceUtteranceArchive_Util.describeUncertainty', () => {

  it('⭐ a KONKRÉT indokot adja vissza, ha van', () => {
    expect(VoiceUtteranceArchive_Util.describeUncertainty({
      ok: true,
      text: 'valami',
      suspicionReason: 'gyanús tagolás',
      detail: 'általános leírás',
    })).toBe('gyanús tagolás');
  });

  it('indok nélkül sem hallgat el — ⛔ az üres ok használhatatlan visszajelzés', () => {
    expect(VoiceUtteranceArchive_Util.describeUncertainty({
      ok: true,
      text: 'valami',
      detail: '',
    }).length).toBeGreaterThan(0);
  });

  it('🔴 a TECHNIKAI BUKÁS nem „nem értettem" — mérve: 3 időtúllépés jelent meg így', () => {
    // A hazug diagnózis rosszabb, mint a néma hiba: az owner azt hitte volna, hogy ROSSZUL
    // beszélt, és tisztábban megismételte volna — ami semmit nem segít.
    expect(VoiceUtteranceArchive_Util.describeUncertainty({
      ok: false,
      text: '',
      detail: 'A felismerés 5 perc után sem fejeződött be.',
    })).toContain('5 perc');
  });
});

describe('VoiceUtteranceArchive_Util — a lemezre írás', () => {

  let root: string;

  beforeEach(async (): Promise<void> => {
    root = await mkdtemp(join(tmpdir(), 'ma-voice-archive-'));
  });

  afterEach(async (): Promise<void> => {
    await rm(root, { recursive: true, force: true });
  });

  it('⭐ a hangot ELTESZI, és a bájtok VÁLTOZATLANOK', async (): Promise<void> => {
    // A megőrzés akkor ér valamit, ha a forrás tényleg újrafeldolgozható.
    const audio: Uint8Array = new Uint8Array([1, 2, 3, 4, 5]);
    const outcome = await VoiceUtteranceArchive_Util.keep({ audio: audio, stem: 'proba', root: root });

    expect(outcome.kept).toBeTrue();
    expect(outcome.audioPath).toBe(join(root, 'proba.wav'));
    expect(new Uint8Array(await readFile(join(root, 'proba.wav')))).toEqual(audio);
  });

  it('⛔ az ÜRES felvételre nem tesz úgy, mintha megőrizte volna', async (): Promise<void> => {
    const outcome = await VoiceUtteranceArchive_Util.keep({
      audio: new Uint8Array(),
      stem: 'ures',
      root: root,
    });

    expect(outcome.kept).toBeFalse();
    expect(outcome.detail).toContain('ÜRES');
  });

  it('⛔ NEM hagy maga után `.tmp` szemetet', async (): Promise<void> => {
    // Az átmeneti fájl + `rename` a csonka írás ellen véd — de a nyoma sem maradhat.
    await VoiceUtteranceArchive_Util.keep({ audio: new Uint8Array([9]), stem: 'tiszta', root: root });

    await expectAsync(readFile(join(root, 'tiszta.wav.tmp'))).toBeRejected();
  });

  it('⭐ a BIZONYTALAN átirat is megmarad — ez a 02:00-as kérés lényege', async (): Promise<void> => {
    // ⛔ A megőrzés NEM jelenti, hogy cselekszünk rá: a köteg változatlanul csak a
    // megbízható átiratot kapja. De visszatérni legyen mihez.
    await VoiceUtteranceArchive_Util.annotate({
      stem: 'ketes',
      status: 'uncertain',
      transcript: 'Jag måste bara vara en falla om en gång.',
      reason: 'nyelv-eltérés',
      speakerId: '42',
      audioKept: true,
      root: root,
      now: new Date('2026-09-11T02:20:00Z'),
    });

    const note = JSON.parse(await readFile(join(root, 'ketes.json'), 'utf-8'));

    expect(note.status).toBe('uncertain');
    expect(note.transcript).toContain('Jag måste');
    expect(note.reason).toBe('nyelv-eltérés');
    expect(note.audioKept).toBeTrue();
    expect(note.recordedAt).toBe('2026-09-11T02:20:00.000Z');
  });

  it('⚠️ jelzi, ha a hang NEM maradt meg — a hamis biztonság a legrosszabb', async (): Promise<void> => {
    await VoiceUtteranceArchive_Util.annotate({
      stem: 'nincs-hang',
      status: 'recognition-failed',
      reason: 'időtúllépés',
      speakerId: '42',
      audioKept: false,
      root: root,
    });

    expect(JSON.parse(await readFile(join(root, 'nincs-hang.json'), 'utf-8')).audioKept).toBeFalse();
  });

  it('⛔ EGYIK művelet sem dob — olvashatatlan gyökér mellett sem', async (): Promise<void> => {
    // A megőrzés kísérő funkció: egy elhasalt írás nem viheti magával a felismerést.
    // ⚠️ Egy LÉTEZŐ FÁJL az archívum helyén: az `mkdir` itt `ENOTDIR`-rel bukik.
    const blocked: string = join(root, 'proba.wav');

    await VoiceUtteranceArchive_Util.keep({ audio: new Uint8Array([1]), stem: 'proba', root: root });

    const outcome = await VoiceUtteranceArchive_Util.keep({
      audio: new Uint8Array([1]),
      stem: 'x',
      root: blocked,
    });

    expect(outcome.kept).toBeFalse();
    expect(outcome.detail.length).toBeGreaterThan(0);
    expect(await VoiceUtteranceArchive_Util.annotate({
      stem: 'x',
      status: 'queued',
      speakerId: '1',
      audioKept: false,
      root: blocked,
    })).toBeFalse();
  });
});
