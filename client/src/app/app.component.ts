import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
/** Root app component — csak a title-t tartja, a tényleges UI a router-outlet alatt él. */
export class AppComponent {
  readonly title: string = 'my-assistant';
}
