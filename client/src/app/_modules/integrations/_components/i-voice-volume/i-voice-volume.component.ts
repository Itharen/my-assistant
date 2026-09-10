// 🔊 A HANG-CSATORNA HANGEREJE — a HARMADIK hozzáférési pont.
//
// > **Owner, 2026-09-10 18:27:** *„…és a My Assistant felületén is szeretném tudni állítani."*
//
// ⭐ Ugyanaz az érték, mint amit a `ma voice volume` ír: a szerver `PUT /api/voice/volume`-ja
// a CLI `voice-volume` modulját hívja *(SSOT)*. ⛔ Nincs kliens-oldali másolat a korlátokból
// sem: a sávot (`min`/`max`/`default`) a szerver adja meg, mert különben a felület és a
// tényleges ellenőrzés **elcsúszhatna** egymástól.

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DyFM_Log } from '@futdevpro/fsm-dynamo';

import { I_Integrations_ApiService } from '../../_services/i-integrations.api-service';

@Component({
  selector: 'i-voice-volume',
  templateUrl: './i-voice-volume.component.html',
  styleUrl: './i-voice-volume.component.scss',
  imports: [CommonModule, FormsModule],
})
/** Hang-csatorna hangerő panel — csúszka + azonnali visszajelzés. */
export class I_VoiceVolume_Component implements OnInit {

  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);

  /** A szerver által megadott sáv — ⛔ NEM beégetve. */
  readonly min = signal<number>(0);
  readonly max = signal<number>(2);
  readonly defaultVolume = signal<number>(1);

  /** A csúszka nyers értéke *(a `[(ngModel)]` sztringet is adhat)*. */
  volume: number = 1;

  /** Az utolsó művelet eredménye — ⛔ a hiba SOSEM néma a felületen. */
  readonly notice = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  private readonly api: I_Integrations_ApiService = inject(I_Integrations_ApiService);

  /** Lifecycle hook — betöltéskor lekéri a jelenlegi hangerőt. */
  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  /** A jelenlegi érték és a sáv lekérése a szervertől. */
  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const state = await this.api.getVoiceVolume();

      this.volume = state.volume;
      this.min.set(state.min);
      this.max.set(state.max);
      this.defaultVolume.set(state.default);
    } catch (err) {
      // ⚠️ A panel NEM maradhat üresen jelzés nélkül: enélkül úgy tűnne, hogy a hangerő 0.
      DyFM_Log.error(`[i-voice-volume] MA-CLIENT-VOICE-VOLUME-READ-FAILED: ${String(err)}`);
      this.error.set('A hangerő nem olvasható. Fut a szerver?');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * A csúszka elengedésekor mentünk.
   *
   * ⚠️ SZÁNDÉKOSAN NEM minden elmozdulásra: a `change` *(nem `input`)* esemény egyetlen kérést
   * ad egy húzásra. Az `input`-ra kötve egy húzás **több tucat** írást indítana ugyanarra a
   * fájlra — és a hangerő ettől nem lenne pontosabb, csak a lemez dolgozna.
   */
  async handleApply(): Promise<void> {
    this.saving.set(true);
    this.notice.set(null);
    this.error.set(null);
    try {
      const result = await this.api.setVoiceVolume(Number(this.volume));

      if (!result.ok) {
        // ⭐ A szerver a `detail`-ben megmondja, MIÉRT nem változott — ezt mutatjuk, nem egy
        // általános „hiba" szöveget. A `volume` a VÁLTOZATLAN érték, tehát visszaállítjuk.
        this.volume = result.volume;
        this.error.set(`${result.detail ?? 'Érvénytelen érték.'} ${result.remedy ?? ''}`.trim());

        return;
      }
      this.volume = result.volume;
      this.notice.set(`Beállítva: ${result.volume.toFixed(2)} — a következő hangnál hallható.`);
    } catch (err) {
      DyFM_Log.error(`[i-voice-volume] MA-CLIENT-VOICE-VOLUME-WRITE-FAILED: ${String(err)}`);
      this.error.set('A beállítás nem ment el. Fut a szerver?');
    } finally {
      this.saving.set(false);
    }
  }

  /** Visszaállítás az alapértékre — egy kattintás, hogy ne kelljen a számra emlékezni. */
  async handleReset(): Promise<void> {
    this.volume = this.defaultVolume();
    await this.handleApply();
  }
}
