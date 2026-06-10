// Integrations landing — Spotify + Google paneleket egymás mellett mutatja.

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { I_Spotify_Component } from '../i-spotify/i-spotify.component';
import { I_Google_Component } from '../i-google/i-google.component';

@Component({
  standalone: true,
  selector: 'i-home',
  templateUrl: './i-home.component.html',
  styleUrl: './i-home.component.scss',
  imports: [CommonModule, I_Spotify_Component, I_Google_Component],
})
/** Integrations container — 2-paneles dashboard (Spotify + Google). */
export class I_Home_Component {}
