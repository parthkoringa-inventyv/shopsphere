import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LoaderService } from './core/services/loader.service';
import { LoaderComponent } from './shared/components/loader/loader.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly isLoading = inject(LoaderService).isLoading;
}
