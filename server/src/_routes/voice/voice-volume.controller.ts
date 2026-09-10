// 🔊 `GET | PUT /api/voice/volume` — a hang-csatorna hangereje a FELÜLETRŐL.
//
// > **Owner, 2026-09-10 18:27:** *„…és a My Assistant felületén is szeretném tudni állítani."*
//
// ⭐ SSOT: a tárolás és az értelmezés a CLI `voice-volume` modulja — a szerver **nem másolja**
// le, hanem **ugyanazt** hívja. ⛔ Egy második implementáció azt jelentené, hogy a felület és
// a `ma voice volume` **eltérő** értéket mutathat ugyanarról a dologról.
//
// ⚠️ Unauth, mint a `sleep-state`: a dashboard a lokális hálózaton, a saját gépen fut, és a
// hangerő nem érzékeny adat. *(Ugyanaz a megfontolás, mint a `/api/dashboard/snapshot`-nál.)*

import { Request, Response } from 'express';

import { DyFM_Error, DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

/**
 * A CLI hangerő-modul betöltése.
 *
 * ⚠️ Dinamikus import, a `spotify.data-service` mintája szerint: a CLI-modul a szerver
 * indulásakor még nem feltétlenül fordult le, és egy statikus import a **teljes szervert**
 * megbuktatná emiatt.
 *
 * 🔴 A FUTASIDEI HIVATKOZAS RELATIV, NEM `@cli/...` ALIAS — MERVE 2026-09-10.
 *
 * A `tsconfig.json` `paths` bejegyzese (`"@cli/*": ["./../cli/src/*"]`) **csak forditasi
 * idoben** letezik. A `tsx` futasidoben NEM alkalmazza a dinamikus importra, ezert ez a hivas
 * `ERR_MODULE_NOT_FOUND: Cannot find package '@cli/...'`-szal bukott.
 *
 * ⚠️ ES EZ NEM ELMELETI: a Google- es a Spotify-panel **elesben elromlott** emiatt — a
 * `getStatus` minden hivasa `MA-*-STATUS-FAILED`-del tert vissza, es a felületen csak annyi
 * latszott, hogy „nincs adat". A tipus-ellenorzes ZOLD volt, mert forditasi idoben az alias
 * feloldodik ⇒ a hibat CSAK egy elo hivas tudta megfogni.
 *
 * ⭐ A tipus-hivatkozas (`typeof import('@cli/...')`) MARADHAT aliasos: az forditasi idoben dol el.
 */
let cliModulePromise: Promise<typeof import('@cli/voice/voice-volume')> | null = null;

function loadVolumeModule(): Promise<typeof import('@cli/voice/voice-volume')> {
  cliModulePromise ??= import('../../../../cli/src/voice/voice-volume.js');

  return cliModulePromise;
}

/** A hang-csatorna hangerejének olvasása és állítása a felületről. */
export class VoiceVolume_Controller extends DyNTS_Controller {

  /** Singleton accessor. */
  static getInstance(): VoiceVolume_Controller {
    return VoiceVolume_Controller.getSingletonInstance();
  }

  /** `GET /` = jelenlegi érték + a sáv · `PUT /` = beállítás. */
  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'getVoiceVolume',
        type: DyFM_HttpCallType.get,
        // ⚠️ MERVE: a `route: '/voice'` + `endpoint: '/'` a `/api/voice`-ra kepzodik, NEM
        // `/api/voice/volume`-ra. A kliens az utobbit hivja, ezert az utvonal ITT dol el.
        endpoint: '/volume',
        preProcesses: [],
        tasks: [ async (_req: Request, res: Response): Promise<void> => {
          res.send(await readVoiceVolumeState());
        } ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'putVoiceVolume',
        type: DyFM_HttpCallType.put,
        endpoint: '/volume',
        preProcesses: [],
        tasks: [ async (req: Request, res: Response): Promise<void> => {
          res.send(await applyVoiceVolume(req.body));
        } ],
      }),
    ];
  }
}

/** A `GET` válasza — a jelenlegi érték és a sáv, hogy a kliens ne égessen be korlátokat. */
async function readVoiceVolumeState(): Promise<{
  volume: number;
  default: number;
  min: number;
  max: number;
}> {
  try {
    const cli = await loadVolumeModule();

    return {
      volume: await cli.readVoiceVolume(),
      default: cli.DEFAULT_VOICE_VOLUME,
      min: cli.MIN_VOICE_VOLUME,
      max: cli.MAX_VOICE_VOLUME,
    };
  } catch (error: unknown) {
    throw new DyFM_Error({
      error: error,
      errorCode: 'MA-VOICE-VOLUME-READ-FAILED',
      message: 'A hangerő nem olvasható.',
    });
  }
}

/**
 * A `PUT` feldolgozása.
 *
 * ⚠️ A KÉRÉS-TÖRZS ELLENŐRZÉSE a `parseVoiceVolume`-ban történik *(REQ-SYS-INPUT-VALIDATION)*:
 * a `body.volume` **ismeretlen érték**, nem szám — a felület bármit küldhet.
 *
 * ⛔ A hibás értékre **200-at adunk `ok: false`-szal**, nem 4xx-et: a felületnek a `detail`-t
 * kell megjelenítenie *(„miért nem változott")*, és egy nyers HTTP-hiba ott csak
 * „valami elromlott"-ként látszana.
 */
async function applyVoiceVolume(body: unknown): Promise<{
  ok: boolean;
  volume: number;
  detail?: string;
  remedy?: string;
}> {
  try {
    const cli = await loadVolumeModule();
    const requested: unknown = readRequestedVolume(body);
    const result = await cli.writeVoiceVolume(requested, 'owner');

    return {
      ok: result.ok,
      volume: result.value,
      ...(result.detail === undefined ? {} : { detail: result.detail }),
      ...(result.remedy === undefined ? {} : { remedy: result.remedy }),
    };
  } catch (error: unknown) {
    throw new DyFM_Error({
      error: error,
      errorCode: 'MA-VOICE-VOLUME-WRITE-FAILED',
      message: 'A hangerő beállítása elszállt.',
    });
  }
}

/**
 * A kért érték kiolvasása a törzsből — **cast nélkül**.
 *
 * ⚠️ A `body as { volume: number }` csak *átnevezné* a bejövő adatot, futásidőben semmit nem
 * ellenőrizne. Itt tényleg megkérdezzük, hogy van-e `volume` mező; az értelmezés
 * *(szám-e, sávban van-e)* a `parseVoiceVolume` dolga.
 */
function readRequestedVolume(body: unknown): unknown {
  if (typeof body !== 'object' || body === null || !('volume' in body)) {
    return undefined;
  }

  return body.volume;
}
