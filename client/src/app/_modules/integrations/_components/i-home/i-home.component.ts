// Integrations landing — Spotify + Google paneleket egymás mellett mutatja.

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { I_Spotify_Component } from '../i-spotify/i-spotify.component';
import { I_Google_Component } from '../i-google/i-google.component';
import { I_VoiceVolume_Component } from '../i-voice-volume/i-voice-volume.component';

@Component({
    selector: 'i-home',
    templateUrl: './i-home.component.html',
    styleUrl: './i-home.component.scss',
    imports: [CommonModule, I_Spotify_Component, I_Google_Component, I_VoiceVolume_Component]
})
/** Integrations container — Spotify + Google + hang-csatorna hangero panel. */
export class I_Home_Component {}
